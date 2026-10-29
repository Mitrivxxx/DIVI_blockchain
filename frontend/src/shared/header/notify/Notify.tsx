import React from "react";
import PendingIssuerApplications from "./components/PendingIssuerApplications";
import { usePendingIssuerApplications } from "./hooks/usePendingIssuerApplications";

interface NotifyProps {
  userRole?: string | null;
}

const Notify: React.FC<NotifyProps> = ({ userRole }) => {
  const { pending, loading, error, handleUpdateStatus } = usePendingIssuerApplications();
  const role = userRole?.toLowerCase();
  const canReviewIssuerApps = role === "admin" || role === "owner";

  if (!canReviewIssuerApps) {
    return (
      <div>
        <h1>Powiadomienia</h1>
        <p>Brak powiadomień do przeglądu dla tej roli.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Powiadomienia</h1>
      <PendingIssuerApplications
        pending={pending}
        loading={loading}
        error={error}
        onApprove={id => handleUpdateStatus(id, 'Approved')}
        onReject={id => handleUpdateStatus(id, 'Rejected')}
      />
    </div>
  );
};

export default Notify;
