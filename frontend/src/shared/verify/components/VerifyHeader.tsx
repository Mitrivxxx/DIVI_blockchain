import shieldIcon from '../../../assets/icons/verify-shield.svg';
import styles from './VerifyHeader.module.scss';

export const VerifyHeader = () => (
  <header className={styles.header}>
    <div className={styles.iconWrap} aria-hidden="true">
      <img className={styles.icon} src={shieldIcon} alt="" />
    </div>

    <div className={styles.textWrap}>
      <h1 className={styles.title}>Weryfikacja dokumentu</h1>
      <p className={styles.subtitle}>blockchain · ipfs · smart contract</p>
    </div>
  </header>
);