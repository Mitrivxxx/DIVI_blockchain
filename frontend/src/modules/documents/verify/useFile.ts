import { useState } from 'react';

export const useFile = () => {
  const [file, setFile] = useState<File | null>(null);
  return { file, setFile };
};
