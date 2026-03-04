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
    // Pass ethereumAddress from state, not from form
    handleSubmit({
      institutionName,
      email,
      description,
      ethereumAddress
    });
  };


  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.field}>
        <label>Nazwa instytucji:<br />
          <input value={institutionName} onChange={e => setInstitutionName(e.target.value)} style={{ width: '100%' }} />
        </label>
        {validationErrors.institutionName && <div className={styles.error}>{validationErrors.institutionName}</div>}
      </div>
      <div className={styles.field}>
        <label>Adres Ethereum:<br />
          <input
            value={ethereumAddress}
            onChange={e => setEthereumAddress(e.target.value)}
            style={{ width: '100%' }}
            disabled={!ethEditable}
          />
        </label>
        {!ethEditable && (
          <div className={styles.ethEditButtonWrap}>
            <button type="button" onClick={() => setEthEditable(true)} className={styles.ethEditButton}>
              Zmień adres Ethereum
            </button>
          </div>
        )}
        {ethEditable && (
          <div className={styles.ethWarning}>
            Uwaga: Czy na pewno chcesz zmienić adres Ethereum? Upewnij się, że podany adres jest poprawny i należy do Ciebie.
          </div>
        )}
        {validationErrors.ethereumAddress && <div className={styles.error}>{validationErrors.ethereumAddress}</div>}
      </div>
      <div className={styles.field}>
        <label>Email:<br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} />
        </label>
        {validationErrors.email && <div className={styles.error}>{validationErrors.email}</div>}
      </div>
      <div className={styles.field}>
        <label>Opis:<br />
          <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
        </label>
        {validationErrors.description && <div className={styles.error}>{validationErrors.description}</div>}
      </div>
      <button type="submit" className={styles.submitButton}>Wyślij wniosek</button>
      {success && <div className={styles.success}>Wniosek został wysłany!</div>}
      {error && <div className={styles.errorGlobal}>{error}</div>}
    </form>
  );
};

export default IssuerRoleForm;