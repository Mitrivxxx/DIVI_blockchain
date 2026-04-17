import styles from '../Verify.module.scss';

type VerifyFileInfoProps = {
  file: File;
  selectedAt: Date;
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

export const VerifyFileInfo = ({ file, selectedAt }: VerifyFileInfoProps) => (
  <section className={styles.fileMetaCard} aria-label="Informacje o pliku">
    <h2 className={styles.fileMetaTitle}>Informacje o pliku</h2>

    <dl className={styles.fileMetaList}>
      <div className={styles.fileMetaRow}>
        <dt className={styles.fileMetaLabel}>Nazwa pliku</dt>
        <dd className={styles.fileMetaValue}>{file.name}</dd>
      </div>

      <div className={styles.fileMetaRow}>
        <dt className={styles.fileMetaLabel}>Rozmiar</dt>
        <dd className={styles.fileMetaValue}>{formatFileSize(file.size)}</dd>
      </div>

      <div className={styles.fileMetaRow}>
        <dt className={styles.fileMetaLabel}>Data uploadu</dt>
        <dd className={styles.fileMetaValue}>{dateFormatter.format(selectedAt)}</dd>
      </div>
    </dl>
  </section>
);