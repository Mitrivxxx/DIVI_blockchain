
import React from "react";
import PendingIssuerApplications from "./components/PendingIssuerApplications";
import { usePendingIssuerApplications } from "./hooks/usePendingIssuerApplications";
import styles from "./Notify.module.scss";
import { parseJwt } from '@/app/utils/jwt';



const Notify: React.FC = () => {
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);
  console.log('Notify token:', token);
  console.log('Notify decoded:', decoded);
  const { pending, loading, error, handleUpdateStatus } = usePendingIssuerApplications();
  const isAdmin = decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] !== "Admin";


if (isAdmin) {
    return null;
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
