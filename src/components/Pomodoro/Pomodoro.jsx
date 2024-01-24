import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { PomodoroApp } from './PomodoroApp';
import { Footer } from '../General/Footer';

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
