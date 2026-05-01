import React from 'react';
import { useIssuerRoleForm } from '../hooks/useIssuerRoleForm';
import { useEthereumAddress } from '../hooks/useEthereumAddress';
import styles from '../IssuerRole.module.scss';

const IssuerRoleForm: React.FC = () => {
  const {
    institutionName,
    setInstitutionName,
    email,
    setEmail,
    description,
    setDescription,
    success,
    error,
    validationErrors,
    handleSubmit
  } = useIssuerRoleForm();

  const {
    ethereumAddress,
    setEthereumAddress,
    ethEditable,
    setEthEditable
  } = useEthereumAddress();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit({
      institutionName,
      email,
      description,
      ethereumAddress
    });
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className={`field ${validationErrors.institutionName ? 'is-error' : ''}`}>
        <label>Nazwa instytucji</label>
        <input 
          type="text"
          value={institutionName} 
          onChange={e => setInstitutionName(e.target.value)} 
          placeholder="Np. Uniwersytet Warszawski"
        />
        {validationErrors.institutionName && <div className="error-message">{validationErrors.institutionName}</div>}
      </div>

      <div className={`field ${validationErrors.ethereumAddress ? 'is-error' : ''}`}>
        <label>Adres Ethereum</label>
        <input
          type="text"
          value={ethereumAddress}
          onChange={e => setEthereumAddress(e.target.value)}
          disabled={!ethEditable}
          placeholder="0x..."
        />

        {!ethEditable && (
          <button type="button" onClick={() => setEthEditable(true)} className={styles['eth-edit-btn']}>
            Zmień adres Ethereum
          </button>
        )}
        {ethEditable && (
          <div className={styles['eth-warning']}>
            Uwaga: Upewnij się, że podany adres jest poprawny i należy do Ciebie.
          </div>
        )}
        {validationErrors.ethereumAddress && <div className="error-message">{validationErrors.ethereumAddress}</div>}
      </div>

      <div className={`field ${validationErrors.email ? 'is-error' : ''}`}>
        <label>Email kontaktowy</label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="kontakt@instytucja.pl"
        />
        {validationErrors.email && <div className="error-message">{validationErrors.email}</div>}
      </div>

      <div className={`field ${validationErrors.description ? 'is-error' : ''}`}>
        <label>Opis i cel wniosku</label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Krótki opis Twojej instytucji..."
          rows={4}
        />
        {validationErrors.description && <div className="error-message">{validationErrors.description}</div>}
      </div>

      <button type="submit" className="btn">Wyślij wniosek</button>

      {(success || error) && (
        <div className={`validation-box ${error ? 'is-error' : 'is-success'}`}>
          <div className="validation-box-icon">
            {error ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <div className="validation-box-content">
            <span className="validation-box-title">
              {error ? 'Wystąpił błąd' : 'Sukces'}
            </span>
            <span className="validation-box-message">
              {error || 'Wniosek został wysłany poprawnie!'}
            </span>
          </div>
        </div>
      )}
    </form>
  );
};

export default IssuerRoleForm;