import { VerifyBlockchainInfo } from './components/VerifyBlockchainInfo';
import { VerifyFileInfo } from './components/VerifyFileInfo';
import { VerifyDropzone } from './components/VerifyDropzone';
import { VerifyResult } from './components/VerifyResult';
import { VerifyHeader } from './components/VerifyHeader';
import { useVerify } from './hooks/useVerify';
import styles from './Verify.module.scss';

const Verify: React.FC = () => {
  const {
    file,
    selectedAt,
    verificationData,
    status,
    isVerifying,
    verificationOutcome,
    fileInputRef,
    handleFileSelect,
    openFileDialog,
    handleDrop,
    handleSubmit,
    handleReset,
  } = useVerify();

  return (
    <div className={styles.page}>
      <VerifyHeader />
      <form className={styles.form} onSubmit={handleSubmit}>
        <VerifyDropzone
          fileName={file?.name}
          hasFile={Boolean(file)}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onOpen={openFileDialog}
          onDropFile={handleDrop}
        />

        <div>
          {isVerifying ? (
            <VerifyResult
              variant="verifying"
              title="Weryfikuję"
              className={`${styles.statusCard} ${styles.cardVerifying}`}
              leftClassName={styles.statusLeft}
              iconClassName={styles.statusIcon}
              spinnerClassName={styles.spinner}
              textClassName={styles.statusText}
              titleClassName={styles.statusTitle}
              actionClassName={styles.statusAction}
            />
          ) : verificationOutcome ? (
            <VerifyResult
              variant={verificationOutcome.kind}
              title={verificationOutcome.title}
              className={`${styles.statusCard} ${
                verificationOutcome.kind === 'verified'
                  ? styles.cardVerified
                  : verificationOutcome.kind === 'missing'
                    ? styles.cardNoResult
                    : styles.cardError
              }`}
              leftClassName={styles.statusLeft}
              iconClassName={styles.statusIcon}
              spinnerClassName={styles.spinner}
              textClassName={styles.statusText}
              titleClassName={styles.statusTitle}
              actionClassName={styles.statusAction}
            >
              <button className={styles.statusActionButton} type="button" onClick={handleReset}>
                Zweryfikuj kolejny dokument
              </button>
            </VerifyResult>
          ) : (
            <button className={styles.btnVerify} type="submit" disabled={!file || isVerifying}>
              Zweryfikuj dokument
            </button>
          )}
        </div>
      </form>

      {verificationData && file && selectedAt && (
        <div className={styles.infoGrid}>
          <VerifyFileInfo
            file={file}
            selectedAt={selectedAt}
            integrityPercent={verificationOutcome?.kind === 'missing' ? 0 : 100}
          />
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
