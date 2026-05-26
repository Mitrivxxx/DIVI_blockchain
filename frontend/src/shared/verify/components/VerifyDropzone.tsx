import { type RefObject } from 'react';
import styles from '../Verify.module.scss';

type VerifyDropzoneProps = {
  fileName?: string;
  hasFile: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (selectedFile: File | null) => void;
  onOpen: () => void;
  onDropFile: (droppedFile: File | null) => void;
};

export const VerifyDropzone = ({
  fileName,
  hasFile,
  fileInputRef,
  onFileSelect,
  onOpen,
  onDropFile,
}: VerifyDropzoneProps) => (
  <>
    <input
      ref={fileInputRef}
      id="verify-file"
      type="file"
      accept="application/pdf,.pdf"
      className={styles.fileInput}
      onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
    />

    <div
      className={[styles.dropzone, hasFile ? styles.dropzoneHasFile : ''].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropFile(event.dataTransfer.files?.[0] ?? null);
      }}
      aria-label={hasFile ? 'Przeciągnij i upuść plik PDF lub kliknij, aby zmienić' : 'Przeciągnij plik lub kliknij, aby przesłać'}
    >
      {hasFile ? (
        <>
          <div className={styles.fileBadge}>
            <span aria-hidden="true">✓</span>
            <span>Plik wybrany</span>
          </div>

          <p className={styles.fileName}>{fileName}</p>

          <p className={styles.dropHint}>Przeciągnij i upuść lub kliknij, aby zmienić · PDF, maks. 5 MB</p>
        </>
      ) : (
        <>
          <div className={styles.dropzoneIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className={styles.dropzoneTitle}>Przeciągnij plik lub kliknij, aby przesłać</p>
          <p className={styles.dropHint}>PDF, maks. 5 MB</p>
        </>
      )}
    </div>
  </>
);
