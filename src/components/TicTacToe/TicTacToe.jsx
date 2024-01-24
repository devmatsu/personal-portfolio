import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { Footer } from '../General/Footer';

import styles from './TicTacToe.module.css';

export function TicTacToe() {
  return (
    <div>
      <Header />
      <div className={styles.tictactoe}>
        <Title text="TicTacToe" />
        
        <strong> 🚧 ... In construction ... 🚧 </strong>
      </div>
      <Footer />
    </div>
  );
}
