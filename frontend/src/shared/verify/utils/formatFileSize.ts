export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes >= 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toLocaleString("pl-PL", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} MB`;
  }

  if (sizeInBytes >= 1024) {
    return `${Math.round(sizeInBytes / 1024)} KB`;
  }

  return `${sizeInBytes} B`;
};
