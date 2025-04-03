import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.line} />
        <p className={styles.copyright}>© {currentYear} devmatsu. All rights reserved.</p>
      </div>
    </footer>
  );
}
