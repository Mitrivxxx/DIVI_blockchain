import styles from '../Verify.module.scss';

type VerifyBlockchainInfoProps = {
  transactionHash?: string | null;
  blockNumber?: number | null;
  blockTimestamp?: string | null;
  networkName?: string | null;
  className?: string;
};

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatTransactionHash = (transactionHash: string): string => {
  if (transactionHash.length <= 10) {
    return transactionHash;
  }

  return `${transactionHash.slice(0, 5)}...${transactionHash.slice(-4)}`;
};

const CONTRACT_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS ?? '';
const EXPLORER_BASE_URL = 'https://sepolia.etherscan.io';

const getContractExplorerUrl = (contractAddress: string): string => {
  const trimmedAddress = contractAddress.trim();

  if (!trimmedAddress) {
    return EXPLORER_BASE_URL;
  }

  return `${EXPLORER_BASE_URL}/address/${trimmedAddress}`;
};

export const VerifyBlockchainInfo = ({
  transactionHash,
  blockNumber,
  blockTimestamp,
  networkName,
  className,
}: VerifyBlockchainInfoProps) => {
  if (!transactionHash && blockNumber == null && !blockTimestamp && !networkName) {
    return null;
  }

  return (
    <section className={[styles.infoCard, className].filter(Boolean).join(' ')} aria-label="Dane z blockchain">
      <p className={styles.infoCardTitle}>Dane z blockchain</p>

      {transactionHash && (
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Hash transakcji</span>
          <span className={`${styles.infoValue} ${styles.infoValueMono}`}>{formatTransactionHash(transactionHash)}</span>
        </div>
      )}

      {blockNumber != null && (
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Numer bloku</span>
          <span className={`${styles.infoValue} ${styles.infoValueMono}`}>{blockNumber.toLocaleString('pl-PL')}</span>
        </div>
      )}

      {blockTimestamp && (
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Znacznik czasu bloku</span>
          <span className={styles.infoValue}>{dateFormatter.format(new Date(blockTimestamp))}</span>
        </div>
      )}

      {networkName && (
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Sieć</span>
          <span className={styles.infoValue}>
            <span className={styles.networkBadge}>
              <span className={styles.networkDot} />
              {networkName}
            </span>
          </span>
        </div>
      )}

      <a className={styles.btnExplorer} href={getContractExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
        ↗ Pokaż w eksploratorze
      </a>
    </section>
  );
};
