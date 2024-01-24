import { Header } from '../General/Header';
import { Footer } from '../General/Footer';

import styles from './TicTacToe.module.css';

export function TicTacToe() {
  return (
    <div>
      <Header />
      <div className={styles.tictactoe}>
        <header className={`title ${styles}`}>
          <p className={`chevron ${styles}`}>&lt;</p>
          TicTacToe
          <p className={`chevron ${styles}`}>&#47;&gt;</p>
        </header>

        <strong> 🚧 ... In construction ... 🚧 </strong>
      </div>
      <Footer />
    </div>
  );
}
