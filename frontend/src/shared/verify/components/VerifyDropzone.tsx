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
      className={styles.dropzone}
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
      aria-label="Przeciągnij i upuść plik PDF lub kliknij, aby wybrać"
    >
      <div className={[styles.fileBadge, hasFile ? styles.fileBadgeSelected : ''].filter(Boolean).join(' ')}>
        <span aria-hidden="true">✓</span>
        <span>{hasFile ? 'Plik wybrany' : 'Brak wybranego pliku'}</span>
      </div>

      <p className={styles.fileName}>{fileName ?? 'Wybierz plik PDF'}</p>

      <p className={styles.dropHint}>Przeciągnij i upuść lub kliknij, aby zmienić · PDF, maks. 5 MB</p>
    </div>
  </>
);
