import React from 'react';

interface FileInputProps {
  value: File | null;
  onChange: (file: File | null) => void;
  label: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const FileInput: React.FC<FileInputProps> = ({ value, onChange, label, className, labelClassName, inputClassName }) => (
  <div className={className}>
    <label className={labelClassName}>{label}</label>
    <input
      className={inputClassName}
      type="file"
      accept="application/pdf"
      onChange={e => onChange(e.target.files?.[0] || null)}
    />
  </div>
);
