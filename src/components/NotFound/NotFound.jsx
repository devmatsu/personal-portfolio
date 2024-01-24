import { Header } from '../General/Header';
import { Footer } from '../General/Footer';
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <div>
      <Header />
      <div className={styles.notFound}>
        <header className={`title ${styles}`}>
          <p className={`chevron ${styles}`}>&lt;</p>
          NotFound
          <p className={`chevron ${styles}`}>&#47;&gt;</p>
        </header>
      <Footer className={styles.footer} />
      </div>
    </div>
  )
}
