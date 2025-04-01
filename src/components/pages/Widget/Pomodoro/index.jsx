import { Header } from '../../../layout/Header';
import { Title } from '../../../layout/Title';
import { PomodoroApp } from './PomodoroApp';
import { Footer } from '../../../layout/Footer';

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
