import { useState } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import styles from './Header.module.css';
import { useActiveSection } from '../hooks/useActiveSection';

const navItems = [
  { label: 'About', to: 'about' },
  { label: 'Skills', to: 'skills' },
  { label: 'Projects', to: 'projects' },
  { label: 'Experience', to: 'experience' },
  { label: 'Contact', to: 'contact' },
];

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isOpen, setIsOpen] = useState(false);

  const activeSection = useActiveSection(navItems.map(item => item.to));

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {isHome ? (
          <ScrollLink
            to="home"
            smooth={true}
            duration={500}
            className={styles.logo}
          >
            devmatsu
          </ScrollLink>
        ) : (
          <RouterLink to="/" className={styles.logo}>
            devmatsu
          </RouterLink>
        )}

        {isHome && (
          <nav className={styles.navDesktop}>
            {navItems.map(({ label, to }) => (
              <ScrollLink
                key={to}
                to={to}
                smooth={true}
                duration={500}
                className={`${styles.navItem} ${
                  activeSection === to ? styles.active : ''
                }`}
              >
                {label}
              </ScrollLink>
            ))}
          </nav>
        )}

        <button
          className={styles.mobileToggle}
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {isHome && isOpen && (
        <div className={styles.mobileMenu}>
          {navItems.map(({ label, to }) => (
            <ScrollLink
              key={to}
              to={to}
              smooth={true}
              duration={500}
              className={`${styles.mobileNavItem} ${
                activeSection === to ? styles.active : ''
              }`}
              onClick={() => setIsOpen(false)}
            >
              {label}
            </ScrollLink>
          ))}
        </div>
      )}
    </header>
  );
}
