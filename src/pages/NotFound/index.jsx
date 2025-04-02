import Header from 'components/Header';
import Footer from 'components/Footer';
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <div>
      <Header />
      <Footer className={styles.footer} />
    </div>
  )
}
