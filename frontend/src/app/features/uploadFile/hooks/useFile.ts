import { useState } from 'react';

export function useFile() {
  const [file, setFile] = useState<File | null>(null);
  return { file, setFile };
}
