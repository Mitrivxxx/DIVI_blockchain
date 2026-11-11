import React from 'react';

interface HashResultProps {
  hashResult: { hash: string, cid: string } | null;
  titleClassName?: string;
}

export const HashResult: React.FC<HashResultProps> = ({ hashResult, titleClassName }) => (
  hashResult ? (
    <div>
      <h3 className={titleClassName}>Wynik Pinata/IPFS:</h3>
      <p>Hash: {hashResult.hash}</p>
      <p>CID: {hashResult.cid}</p>
    </div>
  ) : null
);
