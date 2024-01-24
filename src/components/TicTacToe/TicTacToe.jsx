import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { Footer } from '../General/Footer';

import styles from './TicTacToe.module.css';

export function TicTacToe() {
  return (
    <div>
      <Header />
      <Title text="TicTacToe" className={styles.tictactoe} />
      <strong> 🚧 ... In construction ... 🚧 </strong>
      <Footer />
    </div>
  );
}
