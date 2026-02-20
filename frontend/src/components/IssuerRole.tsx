import { API_URL } from '@/api';
import React, { useState, useEffect } from 'react';

const IssuerRole: React.FC = () => {
  const [institutionName, setInstitutionName] = useState('');
  const [ethereumAddress, setEthereumAddress] = useState('');
  const [ethEditable, setEthEditable] = useState(false);
    useEffect(() => {
      const getAddress = async () => {
        if ((window as any).ethereum) {
          try {
            const { ethers } = await import('ethers');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            if (accounts && accounts.length > 0) {
              setEthereumAddress(accounts[0]);
            setEthEditable(false);
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
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!institutionName.trim()) {
      errors.institutionName = 'Nazwa instytucji jest wymagana.';
    }
    if (!ethereumAddress.trim()) {
      errors.ethereumAddress = 'Adres Ethereum jest wymagany.';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(ethereumAddress.trim())) {
      errors.ethereumAddress = 'Nieprawidłowy adres Ethereum.';
    }
    if (!email.trim()) {
      errors.email = 'Email jest wymagany.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      errors.email = 'Nieprawidłowy adres email.';
    }
    if (!description.trim()) {
      errors.description = 'Opis jest wymagany.';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const errors = validate();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/issuer`, {
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
        setValidationErrors({});
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
            <input value={institutionName} onChange={e => setInstitutionName(e.target.value)} style={{ width: '100%' }} />
          </label>
          {validationErrors.institutionName && <div style={{ color: 'red', fontSize: 13 }}>{validationErrors.institutionName}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Adres Ethereum:<br />
            <input
              value={ethereumAddress}
              onChange={e => setEthereumAddress(e.target.value)}
              style={{ width: '100%' }}
              disabled={!ethEditable}
            />
          </label>
          {!ethEditable && (
            <div style={{ marginTop: 6 }}>
              <button type="button" onClick={() => setEthEditable(true)} style={{ fontSize: 13, padding: '2px 8px' }}>
                Zmień adres Ethereum
              </button>
            </div>
          )}
          {ethEditable && (
            <div style={{ color: 'orange', fontSize: 13, marginTop: 6 }}>
              Uwaga: Czy na pewno chcesz zmienić adres Ethereum? Upewnij się, że podany adres jest poprawny i należy do Ciebie.
            </div>
          )}
          {validationErrors.ethereumAddress && <div style={{ color: 'red', fontSize: 13 }}>{validationErrors.ethereumAddress}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Email:<br />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} />
          </label>
          {validationErrors.email && <div style={{ color: 'red', fontSize: 13 }}>{validationErrors.email}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Opis:<br />
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
          </label>
          {validationErrors.description && <div style={{ color: 'red', fontSize: 13 }}>{validationErrors.description}</div>}
        </div>
        <button type="submit">Wyślij wniosek</button>
      </form>
      {success && <div style={{ color: 'green', marginTop: 16 }}>Wniosek został wysłany!</div>}
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default IssuerRole;
