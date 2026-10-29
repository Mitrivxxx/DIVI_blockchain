import React from "react";
import { NotifyList } from "./IssuerList";

interface PendingIssuerApplicationsProps {
  pending: any[];
  loading: boolean;
  error: string | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const PendingIssuerApplications: React.FC<PendingIssuerApplicationsProps> = ({
  pending,
  loading,
  error,
  onApprove,
  onReject,
}) => (
  <div>
    <h2>Pending Issuer Applications</h2>
    {loading && <p>Loading...</p>}
    {error && <p>{error}</p>}
    {!loading && pending.length === 0 && <p>No pending applications.</p>}
    {!loading && pending.length > 0 && (
      <NotifyList
        pending={pending}
        onApprove={onApprove}
        onReject={onReject}
      />
    )}
  </div>
);

export default PendingIssuerApplications;
