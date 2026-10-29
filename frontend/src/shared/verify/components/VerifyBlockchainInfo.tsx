import { type ReactNode } from "react";
import { formatIssuerLabel, shortHex } from "@/types/documents";

type VerifyBlockchainInfoProps = {
  transactionHash?: string | null;
  blockNumber?: number | null;
  blockTimestamp?: string | null;
  networkName?: string | null;
  status?: number | null;
  isRevoked?: boolean;
  issuerAddress?: string | null;
  issuerDisplayName?: string | null;
};

const statusLabel = (status: number | null | undefined, isRevoked?: boolean): string | null => {
  if (isRevoked || status === 2) return "Revoked";
  if (status === 1) return "Confirmed";
  if (status === 0) return "Pending";
  return null;
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatTransactionHash = (transactionHash: string): string => {
  if (transactionHash.length <= 10) return transactionHash;
  return `${transactionHash.slice(0, 6)}…${transactionHash.slice(-4)}`;
};

const CONTRACT_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS ?? "";
const EXPLORER_BASE_URL = "https://sepolia.etherscan.io";

const getExplorerUrl = (transactionHash?: string | null): string => {
  if (transactionHash) return `${EXPLORER_BASE_URL}/tx/${transactionHash}`;
  const trimmedAddress = CONTRACT_ADDRESS.trim();
  return trimmedAddress ? `${EXPLORER_BASE_URL}/address/${trimmedAddress}` : EXPLORER_BASE_URL;
};

const Row = ({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <dt className="text-sm text-neutral-500">{label}</dt>
    <dd className={`text-right text-sm text-neutral-900 ${mono ? "font-mono text-xs" : ""}`}>{children}</dd>
  </div>
);

export const VerifyBlockchainInfo = ({
  transactionHash,
  blockNumber,
  blockTimestamp,
  networkName,
  status,
  isRevoked,
  issuerAddress,
  issuerDisplayName,
}: VerifyBlockchainInfoProps) => {
  const documentStatus = statusLabel(status, isRevoked);
  const issuerLabel =
    issuerDisplayName || issuerAddress
      ? formatIssuerLabel(issuerDisplayName, issuerAddress)
      : null;

  if (
    !transactionHash &&
    blockNumber == null &&
    !blockTimestamp &&
    !networkName &&
    !documentStatus &&
    !issuerLabel
  ) {
    return null;
  }

  return (
    <section aria-label="Dane z blockchain" className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Blockchain</h3>
      <dl className="mt-2 divide-y divide-neutral-100">
        {documentStatus && <Row label="Status">{documentStatus}</Row>}
        {issuerLabel && (
          <Row label="Wystawca">
            <span title={issuerAddress ?? undefined}>
              {issuerLabel}
              {issuerDisplayName && issuerAddress ? (
                <span className="mt-0.5 block font-mono text-xs text-neutral-500">
                  {shortHex(issuerAddress)}
                </span>
              ) : null}
            </span>
          </Row>
        )}
        {transactionHash && (
          <Row label="Transakcja" mono>
            {formatTransactionHash(transactionHash)}
          </Row>
        )}
        {blockNumber != null && (
          <Row label="Blok" mono>
            {blockNumber.toLocaleString("pl-PL")}
          </Row>
        )}
        {blockTimestamp && <Row label="Czas bloku">{dateFormatter.format(new Date(blockTimestamp))}</Row>}
        {networkName && (
          <Row label="Sieć">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {networkName}
            </span>
          </Row>
        )}
      </dl>
      <a
        href={getExplorerUrl(transactionHash)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-900"
      >
        Zobacz w Etherscan
        <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
};
