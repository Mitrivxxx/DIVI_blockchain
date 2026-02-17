import React, { useState } from 'react';
import axios from 'axios';
import { BrowserProvider, Contract, id, toUtf8Bytes, zeroPadBytes } from 'ethers';
import { API_URL } from '../api';
//import MyContractAbi from '../../blockchain/artifacts/contracts/DocumentIssuer.sol/DocumentIssuer.json';
import MyContractAbi from '../../../blockchain/artifacts/contracts/DocumentIssuer.sol/DocumentIssuer.json';
const CONTRACT_ADDRESS = "0x004357D393D6e942bA8e5ca244965a413Fd12e34";
const CONTRACT_ABI = MyContractAbi.abi;


const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [hashResult, setHashResult] = useState<{ hash: string, cid: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Wybierz plik przed wysłaniem');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      setStatus('Wysyłanie pliku na backend / Pinata...');
      // 1️⃣ Wysyłamy plik na backend (Pinata/IPFS)
      const response = await axios.post(
        `${API_URL}/api/documents/upload-document`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const { hash, cid } = response.data;
      setHashResult({ hash, cid });
      setStatus('Plik zapisany w Pinata. Przygotowanie transakcji blockchain...');

      // 2️⃣ Łączymy się z MetaMask
      if (!(window as any).ethereum) throw new Error("Zainstaluj MetaMask!");
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // 3️⃣ Inicjalizacja kontraktu
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);


      setStatus('Wysyłanie dokumentu do blockchain...');

      // Konwersja hash (hex string) do bytes32
      let hashBytes32: string = hash;
      if (hash.startsWith('0x') && hash.length === 66) {
        hashBytes32 = hash;
      } else if (hash.length === 64) {
        hashBytes32 = '0x' + hash;
      } else {
        // fallback: hash jako string -> bytes32 (niezalecane, lepiej backend niech zwraca hex)
        hashBytes32 = zeroPadBytes(toUtf8Bytes(hash), 32);
      }

      // documentType na bytes32
      const documentTypeBytes32 = zeroPadBytes(toUtf8Bytes(documentType), 32);

      // Pobierz adres użytkownika z MetaMask
      const userAddress = await signer.getAddress();

      // Wywołanie issueDocument(hash, cid, documentOwner, documentType)
      const tx = await (contract as any).issueDocument(hashBytes32, cid, userAddress, documentTypeBytes32);

      setStatus('Transakcja w trakcie... czekaj na potwierdzenie');
      await tx.wait();

      setStatus('Hash zapisany w blockchain! Transakcja potwierdzona.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Błąd podczas wysyłania dokumentu');
    }
  };

  return (
    <div>
      <h1>Dodaj dokument z blockchain</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Wybierz plik PDF:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label>Typ dokumentu:</label>
          <input
            type="text"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            required
          />
        </div>

        <button type="submit">Wyślij dokument</button>
      </form>

      {status && <p>{status}</p>}
      {hashResult && (
        <div>
          <h3>Wynik Pinata/IPFS:</h3>
          <p>Hash: {hashResult.hash}</p>
          <p>CID: {hashResult.cid}</p>
        </div>
      )}
    </div>
  );
};

export default Upload;