import { Link } from 'react-router-dom';

import { Title } from '../General/Title';
import styles from './Projects.module.css';

const projectsData = [
  {
    title: 'Pomodoro App',
    description: 'My personal take on the Pomodoro app, born out of a quest to learn React and a genuine love for efficient study sessions. Experience a sleek design, personalized Pomodoro cycles, and the perfect blend of productivity and learning. ',
    tryLink: '/pomodoro',
    repoLink: 'https://github.com/devmatsu/personal-portfolio',
    imageSrc: '/images/pomodoro_preview.png',
  },
  {
    title: 'Blog',
    description: 'Explore my personal blog, where I share insights, experiences, and thoughts on various topics. Dive into a collection of articles covering technology, life, and everything in between.',
    tryLink: '/blog',
    repoLink: 'https://github.com/devmatsu/personal-portfolio',
    imageSrc: '/images/blog_preview.png',
  },
  {
    title: 'Quote Generator for Instagram',
    description: 'Unleash the power of artificial intelligence with my Quote Generator for Instagram. Effortlessly create captivating and inspiring quotes. Elevate your content game and leave a lasting impression with unique and thought-provoking quotes.',
    tryLink: 'https://instagram.com/matsufit',
    repoLink: 'https://github.com/devmatsu/quote-generator',
    imageSrc: '/images/matsufit_preview.jpg',
  },
  {
    title: 'Tic Tac Toe',
    description: 'The Tic Tac Toe Game project is a simple yet classic implementation of the popular Tic Tac Toe game using React. The project provides a visually appealing user interface where players can engage in a friendly match of Tic Tac Toe.',
    tryLink: '/tictactoe',
    repoLink: 'https://github.com/devmatsu/personal-portfolio',
    imageSrc: '/images/tictactoe_preview.png',
  },
];

export function Projects() {
  return (
    <div className={styles.projects}>
      <Title text="Projects" />

      <div className={styles.projectList}>
        {projectsData.map((project, index) => (
          <div key={index} className={styles.projectCard}>
            <img src={project.imageSrc} alt={project.title} className={styles.projectImage} />
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div className={styles.buttonContainer}>
              <a href={project.repoLink} className={styles.repoButton} target="_blank" rel="noopener noreferrer">
                Repository
              </a>
              {project.tryLink ? (
                <Link to={project.tryLink} className={styles.tryButton}>
                  Check it out
                </Link>
              ) : (
                <a href={project.tryLink} className={styles.tryButton} target="_blank" rel="noopener noreferrer">
                  Check it out
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
