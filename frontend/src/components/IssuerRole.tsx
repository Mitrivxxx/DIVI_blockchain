import { API_URL } from '@/api';
import React, { useState, useEffect } from 'react';

const IssuerRole: React.FC = () => {
  const [institutionName, setInstitutionName] = useState('');
  const [ethereumAddress, setEthereumAddress] = useState('');
    useEffect(() => {
      const getAddress = async () => {
        if ((window as any).ethereum) {
          try {
            // ethers.js v6+ BrowserProvider
            const { ethers } = await import('ethers');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            if (accounts && accounts.length > 0) {
              setEthereumAddress(accounts[0]);
            }
          } catch {
            // ignore
          }
        }
      };
      getAddress();
    }, []);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/IssuerApplication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionName, ethereumAddress, email, description })
      });
      if (res.ok) {
        setSuccess(true);
        setInstitutionName('');
        setEthereumAddress('');
        setEmail('');
        setDescription('');
      } else {
        const data = await res.json();
        setError(data?.message || 'Błąd podczas wysyłania wniosku.');
      }
    } catch (err) {
      setError('Błąd sieci.');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Wniosek o rolę Issuera</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Nazwa instytucji:<br />
            <input value={institutionName} onChange={e => setInstitutionName(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Adres Ethereum:<br />
            <input value={ethereumAddress} onChange={e => setEthereumAddress(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Email:<br />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Opis:<br />
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit">Wyślij wniosek</button>
      </form>
      {success && <div style={{ color: 'green', marginTop: 16 }}>Wniosek został wysłany!</div>}
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default IssuerRole;
