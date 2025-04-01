import styles from './Footer.module.css'
import { URLs } from 'assets/constants';
import logo from 'assets/devmatsu-logo.svg'

export function Footer() {

  const currentYear = new Date().getFullYear();

  const handleLinkClick = (url) => {
    window.open(url, "_blank");
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}?subject=A good opportunity for you!&body=Hello Matsu! (:`)
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
            <a onClick={() => handleEmailClick(URLs.Email)}>
                Email
              </a>
            </li>
          </ul>
        </div>

        <hr className={styles.separator} />
        <span className={styles.copyright}>
          © {currentYear} devmatsu. All Rights Reserved.
        </span>
      </div>
    </footer>
  )
}
