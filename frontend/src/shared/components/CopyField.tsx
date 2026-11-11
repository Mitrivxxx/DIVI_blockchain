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
    <div className="space-y-1">
      {label ? <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p> : null}
      <div className="flex items-start gap-2">
        <code
          title={value}
          className="min-w-0 flex-1 break-all rounded-lg border border-hairline bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-800"
        >
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Kopiuj"
          className="shrink-0 rounded-lg border border-hairline bg-white px-3 py-2 text-xs font-medium text-neutral-800 shadow-soft hover:bg-neutral-50"
        >
          {copied ? 'Skopiowano' : 'Kopiuj'}
        </button>
      </div>
    </div>
  );
};

export default CopyField;
