import { Link } from 'react-router-dom'

import { FaLinkedinIn, FaGithub, FaEnvelope } from 'react-icons/fa';
import styles from './Header.module.css'

import { URLs } from '../../assets/constants';
import logo from '../../assets/devmatsu-logo.svg'

export function Header() {

  const handleLinkClick = (url) => {
    window.open(url, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}?subject=A good opportunity for you!&body=Hello Matsu! (:`)
  }

  return (
    <header className={styles.header}>
      <Link to="/">
        <img src={logo} draggable={false} alt="Logo" />
      </Link>
      <div className={styles.icon}>
        <button onClick={() => handleLinkClick(URLs.LinkedIn)}>
          <FaLinkedinIn size={32} />
        </button>
        <button onClick={() => handleLinkClick(URLs.GitHub)}>
          <FaGithub size={32} />
        </button>
        <button onClick={() => handleEmailClick(URLs.Email)}>
          <FaEnvelope size={32} />
        </button>
      </div>
    </header>
  )
}
