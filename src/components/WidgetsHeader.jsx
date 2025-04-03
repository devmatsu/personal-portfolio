import { useNavigate } from 'react-router-dom';

import styles from './WidgetsHeader.module.css';

export default function WidgetsHeader() {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <nav className={styles.breadcrumb}>
        <span className={styles.link} onClick={() => navigate('/')}>
          Home
        </span>
        <span className={styles.separator}>›</span>
        <span className={styles.current}>Widgets</span>
      </nav>
      <h1 className={styles.title}>Select a Widget</h1>
      <p className={styles.subtitle}>Choose a tool below to get started.</p>
    </header>
  );
}
