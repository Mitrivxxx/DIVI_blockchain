import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { ethers } from "ethers";
import { API_URL } from "../../types/api";


interface Web3AuthContextProps {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  jwt: string | null;
  connect: () => Promise<void>;
  setJwt: (token: string) => void;
  signAndVerifyNonce: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextProps | undefined>(undefined);

export const Web3AuthProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem("token"));




  const connect = useCallback(async () => {
    console.log("[Web3Auth] Próba połączenia z portfelem...");
    if (!window.ethereum) throw new Error("MetaMask not found");
    const prov = new ethers.BrowserProvider(window.ethereum);
    await prov.send("eth_requestAccounts", []);
    const sign = await prov.getSigner();
    const addr = await sign.getAddress();
    setProvider(prov);
    setSigner(sign);
    setAddress(addr);
    console.log("[Web3Auth] Połączono z portfelem:", addr);
  }, []);

  // Funkcja do pobrania nonce, podpisania i wysłania do backendu
  const signAndVerifyNonce = useCallback(async () => {
    if (!signer || !address) throw new Error("Brak połączenia z portfelem");
    console.log("[Web3Auth] Rozpoczynam pobieranie nonce dla adresu:", address);
    // 1. Pobierz nonce z backendu (POST, body address, ścieżka /Auth/nonce)
    const nonceRes = await fetch(`${API_URL}/Auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    console.log("[Web3Auth] Odpowiedź z pobierania nonce:", nonceRes);
    if (!nonceRes.ok) throw new Error("Nie udało się pobrać nonce");
    const { nonce } = await nonceRes.json();
    console.log("[Web3Auth] Otrzymany nonce:", nonce);
    if (!nonce) throw new Error("Brak nonce w odpowiedzi");
    // 2. Podpisz nonce
    let signature;
    try {
      signature = await signer.signMessage(nonce);
      console.log("[Web3Auth] Podpisano nonce:", signature);
    } catch (err) {
      console.error("[Web3Auth] Błąd podczas podpisywania nonce:", err);
      throw err;
    }
    // 3. Wyślij podpis, nonce i adres do backendu
    const verifyRes = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature, nonce }),
    });
    console.log("[Web3Auth] Odpowiedź z weryfikacji:", verifyRes);
    if (!verifyRes.ok) throw new Error("Weryfikacja nie powiodła się");
    const data = await verifyRes.json();
    console.log("[Web3Auth] Otrzymany JWT:", data.token);
    if (data.token) {
      setJwt(data.token);
      localStorage.setItem("token", data.token);
    } else throw new Error("Brak JWT w odpowiedzi");
  }, [signer, address]);

  return (
    <Web3AuthContext.Provider value={{ provider, signer, address, jwt, connect, setJwt, signAndVerifyNonce }}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  const ctx = useContext(Web3AuthContext);
  if (!ctx) throw new Error("useWeb3Auth must be used within Web3AuthProvider");
  return ctx;
};
