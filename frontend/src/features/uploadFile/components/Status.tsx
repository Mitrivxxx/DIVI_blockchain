import React from 'react';

interface StatusProps {
  status: string;
  className?: string;
}

export const Status: React.FC<StatusProps> = ({ status, className }) => (
  status ? <p className={className}>{status}</p> : null
);
