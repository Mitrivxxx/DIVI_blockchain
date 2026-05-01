import React from 'react';
import styles from './IssuerRole.module.scss';
import IssuerRoleForm from './components/IssuerRoleForm';

const IssuerRole: React.FC = () => {
  return (
    <div className={styles.wrap}>
      <div className={styles['top-badge']}>
        <div className={styles.dot}></div>
        Issuer Registration
      </div>
      
      <h1>Wniosek o rolę Issuera</h1>
      
      <IssuerRoleForm />
    </div>
  );
};

export default IssuerRole;
