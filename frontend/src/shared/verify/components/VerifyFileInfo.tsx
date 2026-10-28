import { formatFileSize } from "../utils/formatFileSize";

type VerifyFileInfoProps = {
  file: File;
  selectedAt: Date;
  integrityPercent?: number;
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <dt className="text-sm text-neutral-500">{label}</dt>
    <dd className={`truncate text-right text-sm text-neutral-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
  </div>
);

export const VerifyFileInfo = ({ file, selectedAt, integrityPercent = 100 }: VerifyFileInfoProps) => (
  <section aria-label="Informacje o pliku" className="rounded-lg border border-neutral-200 bg-white p-5">
    <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Plik</h3>
    <dl className="mt-2 divide-y divide-neutral-100">
      <Row label="Nazwa" value={file.name} mono />
      <Row label="Rozmiar" value={formatFileSize(file.size)} />
      <Row label="Wybrano" value={dateFormatter.format(selectedAt)} />
    </dl>
    <div className="mt-4">
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-neutral-500">Zgodność SHA-256</span>
        <span className="font-mono font-semibold text-neutral-900">{integrityPercent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full ${integrityPercent === 100 ? "bg-emerald-500" : "bg-neutral-300"}`}
          style={{ width: `${Math.max(integrityPercent, 4)}%` }}
        />
      </div>
    </div>
  </section>
);
