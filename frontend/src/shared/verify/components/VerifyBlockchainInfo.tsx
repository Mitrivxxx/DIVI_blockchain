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
    <section aria-label="Informacje z blockchain">
      <h2>Informacje z blockchain</h2>

      <dl>
        {transactionHash && (
          <div>
            <dt>Transaction hash</dt>
            <dd>{formatTransactionHash(transactionHash)}</dd>
          </div>
        )}

        {blockNumber != null && (
          <div>
            <dt>Block number</dt>
            <dd>{blockNumber}</dd>
          </div>
        )}

        {blockTimestamp && (
          <div>
            <dt>Block timestamp</dt>
            <dd>{dateFormatter.format(new Date(blockTimestamp))}</dd>
          </div>
        )}

        {networkName && (
          <div>
            <dt>Sieć</dt>
            <dd>{networkName}</dd>
          </div>
        )}
      </dl>

      <a href={getContractExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
        Pokaż w eksplorze
      </a>
    </section>
  );
};
