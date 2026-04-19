import styles from '../Verify.module.scss';

type VerifyFileInfoProps = {
  file: File;
  selectedAt: Date;
  integrityPercent?: number;
  className?: string;
};

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes >= 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toLocaleString('pl-PL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} MB`;
  }

  if (sizeInBytes >= 1024) {
    return `${Math.round(sizeInBytes / 1024)} KB`;
  }

  return `${sizeInBytes} B`;
};

export const VerifyFileInfo = ({
  file,
  selectedAt,
  integrityPercent = 100,
  className,
}: VerifyFileInfoProps) => (
  <section className={[styles.infoCard, className].filter(Boolean).join(' ')} aria-label="Informacje o pliku">
    <p className={styles.infoCardTitle}>Informacje o pliku</p>

    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>Nazwa</span>
      <span className={`${styles.infoValue} ${styles.infoValueMono}`}>{file.name}</span>
    </div>

    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>Rozmiar</span>
      <span className={styles.infoValue}>{formatFileSize(file.size)}</span>
    </div>

    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>Data uploadu</span>
      <span className={styles.infoValue}>{dateFormatter.format(selectedAt)}</span>
    </div>

    <div className={styles.infoDivider} />

    <p className={styles.integrityLabel}>Integralność pliku</p>
    <div className={styles.barTrack}>
      <div className={styles.barFill} style={{ width: `${integrityPercent}%` }} />
    </div>
    <p className={styles.barCaption}>SHA-256 · {integrityPercent}% zgodny</p>
  </section>
);