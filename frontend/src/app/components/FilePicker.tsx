import React, { useState } from 'react';

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
  hint = 'Obsługiwane: PDF · max 20 MB'
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  const formatFileSize = (size: number) => {
    return (size / 1024).toFixed(0) + ' KB';
  };

  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      
      <div 
        className={`file-picker ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {!file ? (
          <div className="file-picker__dropzone">
            <div className="file-picker__dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <span className="file-picker__dropzone-title">Przeciągnij plik {accept.replace('.', '').toUpperCase()} lub</span>
            <span className="file-picker__dropzone-btn">Wybierz plik</span>
            <span className="file-picker__dropzone-hint">{hint}</span>
          </div>
        ) : (
          <div className="file-picker__selected">
            <div className="file-picker__selected-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div className="file-picker__selected-meta">
              <span className="file-picker__selected-name">{file.name}</span>
              <span className="file-picker__selected-size">{formatFileSize(file.size)}</span>
            </div>
            <span className="file-picker__selected-badge">Gotowy</span>
            <span className="file-picker__selected-change">Zmień</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePicker;
