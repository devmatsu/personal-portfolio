import { Header } from 'components/Header';
import { Title } from 'components/Title';
import { PomodoroApp } from './PomodoroApp';
import { Footer } from 'components/Footer';

export function Pomodoro() {
 
  return (
    <div>
      <Header />
      <Title text="Pomodoro" />
      <PomodoroApp />
      <Footer />
    </div>
  );
}
