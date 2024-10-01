import { FaCloudDownloadAlt } from "react-icons/fa";

import profilePicture from '../../assets/devmatsu-pp.jpeg'
import styles from './Profile.module.css'
import resume from '../../assets/documents/CV_RODRIGO_MATAGAWA.pdf'

export function Profile() {
  function downloadResume() {
    window.open(resume);
  }

  return (
    <div className={styles.profile}>
      <section className={styles.info}>
        <p>  Hello world! </p>
        <div className={styles.name}>
          <p className={styles.firstName}> I&apos;m Rodrigo </p>
          <p> Mɑtɑgɑwɑ </p>
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
