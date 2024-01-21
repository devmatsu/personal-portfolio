import { FaLinkedinIn, FaGithub, FaEnvelope } from "react-icons/fa";
import styles from './Header.module.css'

import logo from '../assets/devmatsu-logo.svg'

export function Header() {
  const handleLinkClick = (url) => {
    window.open(url, "_blank");
  };

  const handleLogoClick = () => {
    window.location.reload();
  };

  const URLs = {
    LinkedIn: 'https://www.linkedin.com/in/rodrigo-matagawa/',
    GitHub: 'https://github.com/devmatsu',
    Email: 'rodrigo.matagawa@gmail.com'
  }

  return (
    <header className={styles.header}>
      <div>
        <img src={logo} onClick={handleLogoClick} draggable={false}/>
      </div>
      <div className={styles.icon}>
        <button onClick={() => handleLinkClick(URLs.LinkedIn)}>
          <FaLinkedinIn size={32} />
        </button>
        <button onClick={() => handleLinkClick(URLs.GitHub)}>
          <FaGithub size={32} />
        </button>
        <button>
          <FaEnvelope size={32}/>
        </button>
      </div>
    </header>
  )
}
