import React from 'react';

interface FilePickerProps {
  file: File | null;
  setFile: (file: File | null) => void;
  label?: string;
  accept?: string;
  hint?: string;
}

const FilePicker: React.FC<FilePickerProps> = ({
  file,
  setFile,
  label = 'Plik',
  accept = '.pdf',
  hint = 'Obsługiwane: PDF · max 5 MB',
}) => {
  const formatFileSize = (size: number) => {
    return (size / 1024).toFixed(0) + ' KB';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-800">
        {label}
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1.5 block w-full text-sm text-neutral-600 file:mr-3 file:rounded file:border-0 file:bg-neutral-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </label>
      <p className="text-xs text-neutral-500">{hint}</p>
      {file ? (
        <p className="text-sm text-neutral-700">
          Wybrany: <strong>{file.name}</strong> ({formatFileSize(file.size)}){' '}
          <button
            type="button"
            className="font-medium text-neutral-950 underline"
            onClick={() => setFile(null)}
          >
            Wyczyść
          </button>
        </p>
      ) : (
        <p className="text-sm text-neutral-500">Brak wybranego pliku</p>
      )}
    </div>
  );
};

export default FilePicker;
