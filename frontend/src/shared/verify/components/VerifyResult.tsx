import { type VerifyResult as VerifyResultData } from '../api/verifyApi';

type VerifyResultProps = {
  result: VerifyResultData;
  className?: string;
  titleClassName?: string;
};

export const VerifyResult = ({ result, className, titleClassName }: VerifyResultProps) => (
  <div className={className}>
    <h2 className={titleClassName}>Wynik weryfikacji</h2>
    <p><strong>Hash:</strong> {result.hash}</p>
    <p><strong>Status:</strong> {result.isAuthentic ? 'Autentyczny' : 'Nieautentyczny'}</p>
  </div>
);
