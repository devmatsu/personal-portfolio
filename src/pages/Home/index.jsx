import { useEffect } from 'react';

import Header from 'components/Header';
import Introduction from './sections/Introduction';
import About from './sections/About';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Experience from './sections/Experience';
import Contact from './sections/Contact';
import Footer from 'components/Footer';

export function Home() {
  useEffect(() => {
    document.title = 'Devmatsu | Software Engineer';
  }, []);

  return (
    <div>
      <Header />
      <Introduction />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
    </div>
  )
}
