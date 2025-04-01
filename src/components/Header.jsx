import { Link } from 'react-router-dom'
import { FaLinkedinIn, FaGithub, FaEnvelope, FaBlogger } from 'react-icons/fa';

import styles from './Header.module.css'
import { URLs } from 'assets/constants';
import logo from 'assets/devmatsu-logo.svg'

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
        <Link to="/blog" className={styles.headerLink}>
          <FaBlogger size={32} />
        </Link>
        <Link to="#" className={styles.headerLink} onClick={() => handleLinkClick(URLs.LinkedIn)}>
          <FaLinkedinIn size={32} />
        </Link>
        <Link to="#" className={styles.headerLink} onClick={() => handleLinkClick(URLs.GitHub)}>
          <FaGithub size={32} />
        </Link>
        <Link to="#" className={styles.headerLink} onClick={() => handleEmailClick(URLs.Email)}>
          <FaEnvelope size={32} />
        </Link>
      </div>
    </header>
  )
}
