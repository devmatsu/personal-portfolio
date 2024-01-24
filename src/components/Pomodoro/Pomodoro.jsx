import { PomodoroApp } from './PomodoroApp.jsx';
import { Header } from '../General/Header';
import { Footer } from '../General/Footer';

export function Pomodoro() {
 
  return (
    <div>
      <Header />
      <PomodoroApp />
      <Footer />
    </div>
  );
}
