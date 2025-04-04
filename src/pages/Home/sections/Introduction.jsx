import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Typewriter } from 'react-simple-typewriter';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { BiSolidWidget } from 'react-icons/bi';
import { RiArticleLine } from "react-icons/ri";
import styles from './Introduction.module.css';
import profileImg from 'assets/devmatsu-pfp.png';
import { URLs } from 'assets/constants';

export default function Introduction() {
  return (
    <section id="home" className={styles.intro}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.headingWrapper}>
              <h1 className={styles.heading}>
                <span>
                  <Typewriter
                    words={['Rodrigo Matagawa', 'Matsu']}
                    loop={0}
                    cursor
                    cursorStyle="|"
                    typeSpeed={120}
                    deleteSpeed={60}
                    delaySpeed={4000}
                  />
                </span>
              </h1>
            </div>
    
            <p className={styles.role}>Software Engineer</p>
            <motion.p
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className={styles.description}
            >
              A Backend Engineer specialized in building scalable systems using <span>Node.js</span>, <span>TypeScript</span> and <span>AWS</span>. Experienced with <span>Serverless Framework</span>, <span>DevOps</span> and <span>Infrastructure as Code (IaC)</span> using <span>AWS CloudFormation</span>. Skilled in managing <span>SQL</span> and <span>NoSQL</span> databases. Focused on writing clean, maintainable code and delivering high performance solutions that follow engineering best practices.
            </motion.p>
          </div>
          <div className={styles.right}>
            <div className={styles.profilePicture}>
              <img src={profileImg} alt="Matsu" className={styles.image} />
            </div>
            <div className={styles.socialWrapper}>
              <a className={styles.iconButton} href={URLs.LinkedIn} target="_blank" rel="noreferrer">
                <FaLinkedinIn size={32} />
              </a>
              <a className={styles.iconButton} href={URLs.GitHub} target="_blank" rel="noreferrer">
                <FaGithub size={32} />
              </a>
              <Link to="/blog" className={styles.iconButton}>
                <RiArticleLine size={32} />
              </Link>
              <Link to="/widgets" className={styles.iconButton}>
                <BiSolidWidget size={32} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );  
}
