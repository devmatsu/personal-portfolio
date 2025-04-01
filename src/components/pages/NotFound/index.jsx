import { Header } from '../../layout/Header';
import { Title } from '../../layout/Title';
import { Footer } from '../../layout/Footer';
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
