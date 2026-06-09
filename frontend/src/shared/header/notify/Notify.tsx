import React from "react";
import PendingIssuerApplications from "./components/PendingIssuerApplications";
import { usePendingIssuerApplications } from "./hooks/usePendingIssuerApplications";

interface NotifyProps {
  userRole?: string | null;
}

const Notify: React.FC<NotifyProps> = ({ userRole }) => {
  const { pending, loading, error, handleUpdateStatus } = usePendingIssuerApplications();
  const isAdmin = userRole?.toLowerCase() === "admin";

  if (!isAdmin) {
    return <h1>Powiadomienia</h1>;
  }

  return (
    <PendingIssuerApplications
      pending={pending}
      loading={loading}
      error={error}
      onApprove={id => handleUpdateStatus(id, 'Approved')}
      onReject={id => handleUpdateStatus(id, 'Rejected')}
    />
  );
};

export default Notify;
