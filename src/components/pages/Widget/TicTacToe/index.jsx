import { Header } from '../../../layout/Header';
import { Title } from '../../../layout/Title';
import { TicTacToeApp } from './TicTacToeApp';
import { Footer } from '../../../layout/Footer';

export function TicTacToe() {
  return (
    <div>
      <Header />
      <Title text="TicTacToe" />
      <TicTacToeApp />
      <Footer />
    </div>
  );
}
