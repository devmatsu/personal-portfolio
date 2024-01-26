import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { TicTacToeApp } from './TicTacToeApp';
import { Footer } from '../General/Footer';

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
