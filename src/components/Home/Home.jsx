import { Header } from '../General/Header';
import { Profile } from './Profile';
import { TechnichalSkills } from './TechnichalSkills';
import { Projects } from './Projects';
import { Footer } from '../General/Footer';

export function Home() {
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
