
import React from "react";
import { NotifyList } from "./components/IssuerList";
import { usePendingIssuerApplications } from "./hooks/usePendingIssuerApplications";
import styles from "./Notify.module.scss";

const Notify: React.FC = () => {
  const { pending, loading, error, handleUpdateStatus } = usePendingIssuerApplications();

  return (
    <div className={styles.container}>
      <h2>Pending Issuer Applications</h2>
      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && pending.length === 0 && <p>No pending applications.</p>}
      {!loading && pending.length > 0 && (
        <NotifyList
          pending={pending}
          onApprove={id => handleUpdateStatus(id, 'Approved')}
          onReject={id => handleUpdateStatus(id, 'Rejected')}
        />
      )}
    </div>
  );
};

export default Notify;
