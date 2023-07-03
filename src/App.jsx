import { Header } from './components/Header';
import { Profile } from './components/Profile';
import { TechnichalSkills } from './components/TechnichalSkills';
import { Projects } from './components/Projects';
import { Footer } from './components/Footer';

import './global.css';

export function App() {
  return (
    <div>
      <Header />
      <Profile />
      <TechnichalSkills />
      <Projects />
      <Footer />
    </div>
  )
}
