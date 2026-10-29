import React from 'react';
import { useIssuerRoleForm } from '../hooks/useIssuerRoleForm';
import { useEthereumAddress } from '../hooks/useEthereumAddress';
import { buttonDark } from '@/shared/ui';

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-300';

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
    <form onSubmit={handleFormSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-neutral-800">
        Nazwa instytucji
        <input
          type="text"
          value={institutionName}
          onChange={e => setInstitutionName(e.target.value)}
          placeholder="Np. Uniwersytet Warszawski"
          className={fieldClass}
        />
        {validationErrors.institutionName ? (
          <span className="mt-1 block text-xs text-red-600">{validationErrors.institutionName}</span>
        ) : null}
      </label>

      <div>
        <label className="block text-sm font-medium text-neutral-800">
          Adres Ethereum
          <input
            type="text"
            value={ethereumAddress}
            onChange={e => setEthereumAddress(e.target.value)}
            disabled={!ethEditable}
            placeholder="0x..."
            className={`${fieldClass} disabled:bg-neutral-50 disabled:text-neutral-500`}
          />
        </label>
        {!ethEditable ? (
          <button
            type="button"
            onClick={() => setEthEditable(true)}
            className="mt-2 text-sm font-medium text-neutral-950 underline"
          >
            Zmień adres Ethereum
          </button>
        ) : (
          <p className="mt-2 text-xs text-amber-700">
            Uwaga: Upewnij się, że podany adres jest poprawny i należy do Ciebie.
          </p>
        )}
        {validationErrors.ethereumAddress ? (
          <span className="mt-1 block text-xs text-red-600">{validationErrors.ethereumAddress}</span>
        ) : null}
      </div>

      <label className="block text-sm font-medium text-neutral-800">
        Email kontaktowy
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="kontakt@instytucja.pl"
          className={fieldClass}
        />
        {validationErrors.email ? (
          <span className="mt-1 block text-xs text-red-600">{validationErrors.email}</span>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-neutral-800">
        Opis i cel wniosku
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Krótki opis Twojej instytucji..."
          rows={4}
          className={fieldClass}
        />
        {validationErrors.description ? (
          <span className="mt-1 block text-xs text-red-600">{validationErrors.description}</span>
        ) : null}
      </label>

      <button type="submit" className={buttonDark}>
        Wyślij wniosek
      </button>

      {success || error ? (
        <p className={`text-sm font-medium ${error ? 'text-red-600' : 'text-emerald-600'}`}>
          [{error ? 'Błąd' : 'Sukces'}] {error || 'Wniosek został wysłany poprawnie!'}
        </p>
      ) : null}
    </form>
  );
};

export default IssuerRoleForm;
