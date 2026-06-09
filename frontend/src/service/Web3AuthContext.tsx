import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { ethers } from "ethers";
import {
  getJwtExpiryMs,
  getAddressFromJwt,
  getRoleFromJwt,
} from "./utils/jwt";
import { connectToWallet, signAndVerifyNonce as web3SignAndVerifyNonce } from "./web3/web3Utils";

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

  const setJwt = useCallback((token: string) => {
    setJwtState(token);

    const tokenAddress = getAddressFromJwt(token);
    if (tokenAddress) {
      setAddress(tokenAddress);
    }

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
  }, []);

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
      logout();
      return;
    }

    const timer = window.setTimeout(() => logout(), remainingTime);
    return () => window.clearTimeout(timer);
  }, [jwt, logout]);

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
