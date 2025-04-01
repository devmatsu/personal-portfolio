import { Header } from 'components/Header';
import { Title } from 'components/Title';
import { Footer } from 'components/Footer';
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
