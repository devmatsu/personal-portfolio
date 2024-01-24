import { Pomodoro } from './components/Pomodoro/Pomodoro.jsx';
import { Home } from './components/Home/Home.jsx';

import './global.css';

export function App() {
  return (
    <div>
      <Home />
      <Pomodoro />
    </div>
  )
}
