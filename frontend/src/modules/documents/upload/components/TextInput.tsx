import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, label, required, className, labelClassName, inputClassName }) => (
  <div className={className}>
    <label className={labelClassName}>{label}</label>
    <input
      className={inputClassName}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
    />
  </div>
);
