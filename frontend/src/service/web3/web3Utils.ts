import { ethers } from "ethers";
import { API_URL } from "@/types/api";

export async function connectToWallet(): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}> {
  console.log("[Web3Auth] Próba połączenia z portfelem...");
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  console.log("[Web3Auth] Połączono z portfelem:", address);

  return { provider, signer, address };
}

export async function signAndVerifyNonce(
  signer: ethers.JsonRpcSigner,
  address: string
): Promise<string> {
  console.log("[Web3Auth] Rozpoczynam pobieranie nonce dla adresu:", address);

  // 1. Pobierz nonce z backendu
  const nonceRes = await fetch(`${API_URL}/Auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ address }),
  });
  console.log("[Web3Auth] Odpowiedź z pobierania nonce:", nonceRes);
  if (!nonceRes.ok) throw new Error("Nie udało się pobrać nonce");

  const { nonce } = await nonceRes.json();
  console.log("[Web3Auth] Otrzymany nonce:", nonce);
  if (!nonce) throw new Error("Brak nonce w odpowiedzi");

  // 2. Podpisz nonce
  let signature: string;
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
    credentials: "include",
    body: JSON.stringify({ address, signature, nonce }),
  });
  console.log("[Web3Auth] Odpowiedź z weryfikacji:", verifyRes);
  if (!verifyRes.ok) throw new Error("Weryfikacja nie powiodła się");

  const data = await verifyRes.json();
  console.log("[Web3Auth] Otrzymany JWT:", data.token);
  if (!data.token) throw new Error("Brak JWT w odpowiedzi");

  return data.token;
}
