import { type RefObject, useState } from "react";
import { formatFileSize } from "../utils/formatFileSize";

type VerifyDropzoneProps = {
  fileName?: string;
  fileSize?: number;
  hasFile: boolean;
  disabled?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (selectedFile: File | null) => void;
  onOpen: () => void;
  onDropFile: (droppedFile: File | null) => void;
  onClear: () => void;
};

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-6" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

const PdfIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const VerifyDropzone = ({
  fileName,
  fileSize,
  hasFile,
  disabled = false,
  fileInputRef,
  onFileSelect,
  onOpen,
  onDropFile,
  onClear,
}: VerifyDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!disabled) onDropFile(event.dataTransfer.files?.[0] ?? null);
      }}
    >
      <input
        ref={fileInputRef}
        id="verify-file"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />

      {hasFile ? (
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand/10 text-[#E8604A]">
              <PdfIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">{fileName}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {fileSize != null ? formatFileSize(fileSize) : "PDF"} · gotowy do weryfikacji
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onOpen}
              disabled={disabled}
              className="rounded border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Zmień
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="rounded px-3 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Usuń
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          className={`group flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition sm:py-14 ${
            isDragging
              ? "border-brand bg-brand/5"
              : "border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-white"
          }`}
        >
          <span
            className={`flex size-12 items-center justify-center rounded-full transition ${
              isDragging
                ? "bg-brand text-white"
                : "bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 group-hover:text-neutral-900"
            }`}
          >
            <UploadIcon />
          </span>
          <span className="mt-4 text-base font-semibold text-neutral-900">
            {isDragging ? "Upuść plik, aby go dodać" : "Przeciągnij PDF tutaj"}
          </span>
          <span className="mt-1 text-sm text-neutral-500">
            lub <span className="font-medium text-neutral-900 underline underline-offset-4">wybierz plik z dysku</span>
          </span>
          <span className="mt-4 text-xs font-medium tracking-wide text-neutral-400 uppercase">
            PDF · maks. 5 MB
          </span>
        </button>
      )}
    </div>
  );
};
