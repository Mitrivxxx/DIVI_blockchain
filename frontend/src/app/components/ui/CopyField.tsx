import React, { useState } from 'react';

interface CopyFieldProps {
  label?: string;
  value: string;
}

const CopyField: React.FC<CopyFieldProps> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="hash-row">
      {label && <div className="hash-label">{label}</div>}
      
      <div className="copy-field">
        <div className="copy-field-value" title={value}>
          {value}
        </div>

        <button 
          type="button"
          className={`copy-field-btn ${copied ? 'is-copied' : ''}`}
          onClick={handleCopy}
          aria-label="Kopiuj"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>

        <div className={`copy-field-tooltip ${copied ? 'show' : ''}`}>
          Skopiowano!
        </div>
      </div>
    </div>
  );
};

export default CopyField;