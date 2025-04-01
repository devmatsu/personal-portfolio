import { Header } from 'components/Header';
import { Title } from 'components/Title';
import { TicTacToeApp } from './TicTacToeApp';
import { Footer } from 'components/Footer';

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
