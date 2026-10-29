import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ethers } from "ethers";
import {
  getJwtExpiryMs,
  getRoleFromJwt,
} from "./utils/jwt";
import {
  connectToWallet,
  revokeWalletPermissions,
  signAndVerifyNonce as web3SignAndVerifyNonce,
} from "./web3/web3Utils";
import { refreshAuthSession } from "./auth/session";
import { EMAIL_LOGIN_STORAGE_KEY } from "./auth/constants";

interface Web3AuthContextProps {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  jwt: string | null;
  role: string | null;
  connect: () => Promise<{ provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner; address: string }>;
  setJwt: (token: string) => void;
  signAndVerifyNonce: (signer?: ethers.JsonRpcSigner, address?: string) => Promise<void>;
  logout: () => void;
}

const Web3AuthContext = createContext<Web3AuthContextProps | undefined>(undefined);

export const Web3AuthProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [jwt, setJwtState] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const addressRef = useRef<string | null>(null);
  const jwtRef = useRef<string | null>(null);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  useEffect(() => {
    jwtRef.current = jwt;
  }, [jwt]);

  const setJwt = useCallback((token: string) => {
    setJwtState(token);
    // JWT `sub` is member id, not an Ethereum address — keep wallet address from connect().
    setRole(getRoleFromJwt(token));
  }, []);

  const connect = useCallback(async () => {
    const { provider, signer, address } = await connectToWallet();
    setProvider(provider);
    setSigner(signer);
    setAddress(address);

    return { provider, signer, address };
  }, []);

  const signAndVerifyNonce = useCallback(async (providedSigner?: ethers.JsonRpcSigner, providedAddress?: string) => {
    const activeSigner = providedSigner ?? signer;
    const activeAddress = providedAddress ?? address;

    if (!activeSigner || !activeAddress) throw new Error("Brak połączenia z portfelem");

    const token = await web3SignAndVerifyNonce(activeSigner, activeAddress);
    setJwt(token);
  }, [signer, address, setJwt]);

  const logout = useCallback(async () => {
    setJwtState(null);
    setRole(null);
    setAddress(null);
    setSigner(null);
    setProvider(null);

    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Clear MetaMask site permissions so the next login uses the currently selected account.
    await revokeWalletPermissions();
  }, []);

  // After Aspire/page reload JWT is gone from memory; restore via refresh_token cookie.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (jwtRef.current) {
        return;
      }

      const token = await refreshAuthSession();
      if (cancelled || !token) {
        return;
      }

      setJwt(token);
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [setJwt]);

  useEffect(() => {
    if (!jwt) {
      return;
    }

    const expiresAt = getJwtExpiryMs(jwt);
    if (!expiresAt) {
      logout();
      return;
    }

    const remainingTime = expiresAt - Date.now();
    if (remainingTime <= 0) {
      // Try silent refresh before logging out (e.g. after Aspire restart).
      void (async () => {
        const token = await refreshAuthSession();
        if (token) {
          setJwt(token);
          return;
        }
        localStorage.removeItem(EMAIL_LOGIN_STORAGE_KEY);
        logout();
      })();
      return;
    }

    // Refresh a minute before expiry so profile data stays available.
    const refreshIn = Math.max(remainingTime - 60_000, 5_000);
    const timer = window.setTimeout(() => {
      void (async () => {
        const token = await refreshAuthSession();
        if (token) {
          setJwt(token);
          return;
        }
        localStorage.removeItem(EMAIL_LOGIN_STORAGE_KEY);
        logout();
      })();
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [jwt, logout, setJwt]);

  // Keep React wallet state in sync when the user switches accounts in MetaMask.
  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) {
      return;
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts.length) {
        if (jwtRef.current) {
          await logout();
        } else {
          setAddress(null);
          setSigner(null);
          setProvider(null);
        }
        return;
      }

      const nextAddress = ethers.getAddress(accounts[0]);
      const currentAddress = addressRef.current;

      if (currentAddress && nextAddress.toLowerCase() === currentAddress.toLowerCase()) {
        return;
      }

      // Logged-in JWT belongs to the previous wallet — force a fresh login.
      if (jwtRef.current) {
        await logout();
        return;
      }

      try {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        const nextSigner = await browserProvider.getSigner(nextAddress);
        setProvider(browserProvider);
        setSigner(nextSigner);
        setAddress(nextAddress);
      } catch {
        setAddress(null);
        setSigner(null);
        setProvider(null);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [logout]);

  return (
    <Web3AuthContext.Provider value={{ provider, signer, address, jwt, role, connect, setJwt, signAndVerifyNonce, logout }}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  const ctx = useContext(Web3AuthContext);
  if (!ctx) throw new Error("useWeb3Auth must be used within Web3AuthProvider");
  return ctx;
};
