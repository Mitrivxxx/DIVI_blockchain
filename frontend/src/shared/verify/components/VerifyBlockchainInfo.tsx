import styles from '../Verify.module.scss';

type VerifyBlockchainInfoProps = {
  transactionHash?: string | null;
  blockNumber?: number | null;
  blockTimestamp?: string | null;
  networkName?: string | null;
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
}: VerifyBlockchainInfoProps) => {
  if (!transactionHash && blockNumber == null && !blockTimestamp && !networkName) {
    return null;
  }

  return (
    <section className={styles.fileMetaCard} aria-label="Informacje z blockchain">
      <h2 className={styles.fileMetaTitle}>Informacje z blockchain</h2>

      <dl className={styles.fileMetaList}>
        {transactionHash && (
          <div className={styles.fileMetaRow}>
            <dt className={styles.fileMetaLabel}>Transaction hash</dt>
            <dd className={styles.fileMetaValue}>{formatTransactionHash(transactionHash)}</dd>
          </div>
        )}

        {blockNumber != null && (
          <div className={styles.fileMetaRow}>
            <dt className={styles.fileMetaLabel}>Block number</dt>
            <dd className={styles.fileMetaValue}>{blockNumber}</dd>
          </div>
        )}

        {blockTimestamp && (
          <div className={styles.fileMetaRow}>
            <dt className={styles.fileMetaLabel}>Block timestamp</dt>
            <dd className={styles.fileMetaValue}>{dateFormatter.format(new Date(blockTimestamp))}</dd>
          </div>
        )}

        {networkName && (
          <div className={styles.fileMetaRow}>
            <dt className={styles.fileMetaLabel}>Sieć</dt>
            <dd className={styles.fileMetaValue}>{networkName}</dd>
          </div>
        )}
      </dl>

      <a
        className={styles.explorerButton}
        href={getContractExplorerUrl(CONTRACT_ADDRESS)}
        target="_blank"
        rel="noreferrer"
      >
        Pokaż w eksplorze
      </a>
    </section>
  );
};
