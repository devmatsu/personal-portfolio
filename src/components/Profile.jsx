import { FaCloudDownloadAlt } from "react-icons/fa";
import profilePicture from '../assets/devmatsu-pp.jpeg'
import styles from './Profile.module.css'

export function Profile() {
  function downloadResume() {
    const resumeLink = ``;
    window.open(resumeLink);
  }

  return (
    <div className={styles.profile}>
      <section className={styles.info}>
        <p>  Hello world! </p>
        <div className={styles.name}>
          <p className={styles.firstName}> I&apos;m Rodrigo </p>
          <p> Matagawa </p>
        </div>
        <p className={styles.role}> Software Engineer </p>
        <button className={styles.resume} onClick={downloadResume}>
          <FaCloudDownloadAlt style={{ marginRight: '1rem' }}/> Resume
        </button>
      </section>

      <section className={styles.picture}>
        <img src={profilePicture} draggable={false}/>
      </section>
    </div>
  )
}
