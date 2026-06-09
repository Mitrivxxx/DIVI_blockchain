import { ethers } from "ethers";
import { API_URL } from "@/types/api";

export async function connectToWallet(): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}> {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

export async function signAndVerifyNonce(
  signer: ethers.JsonRpcSigner,
  address: string
): Promise<string> {
  const nonceRes = await fetch(`${API_URL}/Auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ address }),
  });
  if (!nonceRes.ok) throw new Error("Nie udało się pobrać nonce");

  const { nonce } = await nonceRes.json();
  if (!nonce) throw new Error("Brak nonce w odpowiedzi");

  const signature = await signer.signMessage(nonce);

  const verifyRes = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ address, signature, nonce }),
  });
  if (!verifyRes.ok) throw new Error("Weryfikacja nie powiodła się");

  const data = await verifyRes.json();
  if (!data.token) throw new Error("Brak JWT w odpowiedzi");

  return data.token;
}
