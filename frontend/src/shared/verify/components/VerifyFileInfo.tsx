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

export const VerifyFileInfo = ({
  file,
  selectedAt,
}: VerifyFileInfoProps) => (
  <section aria-label="Informacje o pliku">
    <h2>Informacje o pliku</h2>

    <dl>
      <div>
        <dt>Nazwa pliku</dt>
        <dd>{file.name}</dd>
      </div>

      <div>
        <dt>Rozmiar</dt>
        <dd>{formatFileSize(file.size)}</dd>
      </div>

      <div>
        <dt>Data uploadu</dt>
        <dd>{dateFormatter.format(selectedAt)}</dd>
      </div>
    </dl>
  </section>
);