import { Header } from 'components/Header';
import { Profile } from './sections/Profile';
import { TechnichalSkills } from './sections/TechnichalSkills';
import { Projects } from './sections/Projects';
import { Footer } from 'components/Footer';

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
