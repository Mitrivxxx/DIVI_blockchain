import { VerifyBlockchainInfo } from "./components/VerifyBlockchainInfo";
import { VerifyFileInfo } from "./components/VerifyFileInfo";
import { VerifyDropzone } from "./components/VerifyDropzone";
import { VerifyResult } from "./components/VerifyResult";
import { useVerify } from "./hooks/useVerify";

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
    <div className="p-5 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Publiczna weryfikacja · bez logowania
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[28px]">
            Sprawdź dokument PDF
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Ethereum Sepolia
        </span>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <VerifyDropzone
          fileName={file?.name}
          fileSize={file?.size}
          hasFile={Boolean(file)}
          disabled={isVerifying}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onOpen={openFileDialog}
          onDropFile={handleDrop}
          onClear={handleReset}
        />

        {status && !verificationOutcome && (
          <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {status}
          </p>
        )}

        {isVerifying ? (
          <VerifyResult
            variant="verifying"
            title="Weryfikuję dokument…"
            description="Liczę SHA-256 i sprawdzam zapis w smart kontrakcie."
          />
        ) : verificationOutcome ? (
          <VerifyResult
            variant={verificationOutcome.kind}
            title={verificationOutcome.title}
            description={verificationOutcome.description}
          >
            <button
              type="button"
              onClick={handleReset}
              className="rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:border-neutral-900"
            >
              Sprawdź kolejny
            </button>
          </VerifyResult>
        ) : (
          <button
            type="submit"
            disabled={!file}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-neutral-950 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Zweryfikuj dokument
            <span aria-hidden="true">→</span>
          </button>
        )}
      </form>

      {verificationData && file && selectedAt && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <VerifyFileInfo
            file={file}
            selectedAt={selectedAt}
            integrityPercent={
              verificationOutcome?.kind === "missing" || verificationOutcome?.kind === "error" ? 0 : 100
            }
          />
          <VerifyBlockchainInfo
            transactionHash={verificationData.transactionHash}
            blockNumber={verificationData.blockNumber}
            blockTimestamp={verificationData.blockTimestamp}
            networkName={verificationData.networkName}
            status={verificationData.status}
            isRevoked={verificationData.isRevoked}
          />
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-neutral-400">
        Plik służy tylko do policzenia hasha SHA-256 i nie jest zapisywany. Wynik porównujemy z rejestrem w
        smart kontrakcie.
      </p>
    </div>
  );
};

export default Verify;
