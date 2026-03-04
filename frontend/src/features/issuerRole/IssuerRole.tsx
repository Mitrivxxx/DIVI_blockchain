
import styles from './IssuerRole.module.scss';
import IssuerRoleForm from './components/IssuerRoleForm';

const IssuerRole: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2>Wniosek o rolę Issuera</h2>
      <IssuerRoleForm />
    </div>
  );
};

export default IssuerRole;
