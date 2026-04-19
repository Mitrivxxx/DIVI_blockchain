import { useState } from 'react';

export function useDocumentType() {
  const [documentType, setDocumentType] = useState('');
  return { documentType, setDocumentType };
}
