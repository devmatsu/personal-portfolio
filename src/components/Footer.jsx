import styles from './Footer.module.css'

import logo from '../assets/devmatsu-logo.svg'

export function Footer() {

  const handleLinkClick = (url) => {
    window.open(url, "_blank");
  };

  const URLs = {
    LinkedIn: 'https://www.linkedin.com/in/rodrigo-matagawa/',
    GitHub: 'https://github.com/devmatsu',
    Email: 'rodrigo.matagawa@gmail.com'
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <footer>
      <div className={styles.container}>
        <div className={styles.contents}>
          <div className={styles.logo}>
            <img src={logo} onClick={scrollToTop} draggable={false}/>
          </div>

          <ul>
            <li>
              <a onClick={() => handleLinkClick(URLs.LinkedIn)}>
                LinkedIn
              </a>
            </li>
            <li>
            <a onClick={() => handleLinkClick(URLs.GitHub)}>
                GitHub
              </a>
            </li>
            <li>
            <a onClick={() => handleLinkClick(URLs.Email)}>
                Email
              </a>
            </li>
          </ul>
        </div>

        <hr className={styles.separator} />
        <span className={styles.copyright}>
          © 2024 devmatsu. All Rights Reserved.
        </span>
      </div>
    </footer>
  )
}
