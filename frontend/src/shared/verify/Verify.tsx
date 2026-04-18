import styles from './Verify.module.scss';
import { VerifyBlockchainInfo } from './components/VerifyBlockchainInfo';
import { VerifyFileInfo } from './components/VerifyFileInfo';
import { VerifyDropzone } from './components/VerifyDropzone';
import { VerifyResult } from './components/VerifyResult';
import { useVerify } from './hooks/useVerify';

const Verify: React.FC = () => {
  const {
    file,
    selectedAt,
    showFileInfo,
    verificationData,
    isDragging,
    status,
    isVerifying,
    verificationOutcome,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    openFileDialog,
    handleDrop,
    handleSubmit,
    handleReset,
  } = useVerify();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Weryfikacja dokumentu</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <VerifyDropzone
          isDragging={isDragging}
          fileName={file?.name}
          hasFile={Boolean(file)}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onOpen={openFileDialog}
          onDragStateChange={setIsDragging}
          onDropFile={handleDrop}
          inputClassName={styles.fileInput}
          dropzoneClassName={styles.dropzone}
          fileNameClassName={styles.fileName}
        />

        <p className={styles.fileInfo}>Obsługiwane pliki: PDF, maks. 5 MB</p>

        <div className={styles.formFooter} data-variant={verificationOutcome ? 'result' : 'action'}>
          {isVerifying ? (
            <VerifyResult
              variant="verifying"
              title="WERYFIKUJĘ"
              description="Sprawdzam dokument w blockchain..."
              className={styles.verificationBanner}
              contentClassName={styles.verificationContent}
              titleClassName={styles.verificationTitle}
              descriptionClassName={styles.verificationDescription}
            />
          ) : verificationOutcome ? (
            <VerifyResult
              variant={verificationOutcome.kind}
              title={verificationOutcome.title}
              description={verificationOutcome.description}
              className={styles.verificationBanner}
              contentClassName={styles.verificationContent}
              titleClassName={styles.verificationTitle}
              descriptionClassName={styles.verificationDescription}
              actionsClassName={styles.verificationActions}
            >
              <button className={styles.resetButton} type="button" onClick={handleReset}>
                Zweryfikuj kolejny dokument
              </button>
            </VerifyResult>
          ) : (
            <button className={styles.verifyButton} type="submit" disabled={!file || isVerifying}>
              Zweryfikuj dokument
            </button>
          )}
        </div>
      </form>

      {showFileInfo && file && selectedAt && (
        <div className={styles.fileInfoGrid}>
          <VerifyFileInfo file={file} selectedAt={selectedAt} />
          <VerifyBlockchainInfo
            transactionHash={verificationData?.transactionHash}
            blockNumber={verificationData?.blockNumber}
            blockTimestamp={verificationData?.blockTimestamp}
            networkName={verificationData?.networkName}
          />
        </div>
      )}

      {status && !verificationOutcome && <p className={styles.status}>{status}</p>}
    </div>
  );
};

export default Verify;
