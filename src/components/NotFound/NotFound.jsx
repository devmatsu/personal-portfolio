import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { Footer } from '../General/Footer';
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <div>
      <Header />
      <Title text="NotFound" className={styles.notFound} />
      <Footer className={styles.footer} />
    </div>
  )
}
