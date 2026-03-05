import { type RefObject } from 'react';

type VerifyDropzoneProps = {
  isDragging: boolean;
  fileName?: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (selectedFile: File | null) => void;
  onOpen: () => void;
  onDragStateChange: (isDragging: boolean) => void;
  onDropFile: (droppedFile: File | null) => void;
  inputClassName?: string;
  dropzoneClassName?: string;
  fileNameClassName?: string;
};

export const VerifyDropzone = ({
  isDragging,
  fileName,
  fileInputRef,
  onFileSelect,
  onOpen,
  onDragStateChange,
  onDropFile,
  inputClassName,
  dropzoneClassName,
  fileNameClassName,
}: VerifyDropzoneProps) => (
  <>
    <input
      ref={fileInputRef}
      id="verify-file"
      type="file"
      accept="application/pdf,.pdf"
      className={inputClassName}
      onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
    />

    <div
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
        onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDropFile(event.dataTransfer.files?.[0] ?? null);
      }}
      aria-label="Przeciągnij i upuść plik PDF lub kliknij, aby wybrać"
      data-dragging={isDragging}
      className={dropzoneClassName}
    >
      Przeciągnij i upuść plik lub kliknij, aby przesłać
    </div>

    {fileName && <p className={fileNameClassName}>Wybrany plik: {fileName}</p>}
  </>
);
