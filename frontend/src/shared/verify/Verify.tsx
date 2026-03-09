import styles from './Verify.module.scss';
import { VerifyDropzone } from './components/VerifyDropzone';
import { VerifyResult } from './components/VerifyResult';
import { useVerify } from './hooks/useVerify';

const Verify: React.FC = () => {
  const {
    file,
    isDragging,
    status,
    result,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    openFileDialog,
    handleDrop,
    handleSubmit,
  } = useVerify();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Weryfikacja dokumentu</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="verify-file">Wybierz plik PDF:</label>
        <VerifyDropzone
          isDragging={isDragging}
          fileName={file?.name}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onOpen={openFileDialog}
          onDragStateChange={setIsDragging}
          onDropFile={handleDrop}
          inputClassName={styles.fileInput}
          dropzoneClassName={styles.dropzone}
          fileNameClassName={styles.fileName}
        />

        <button className={styles.button} type="submit">Sprawdź autentyczność</button>
      </form>

      {status && <p className={styles.status}>{status}</p>}

      {result && <VerifyResult result={result} className={styles.result} titleClassName={styles.resultTitle} />}
    </div>
  );
};

export default Verify;
