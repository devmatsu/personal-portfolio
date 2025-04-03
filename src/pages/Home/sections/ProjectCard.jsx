import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './Projects.module.css';
import { ExternalLink } from 'lucide-react';

export default function ProjectCard({ title, description, image, stack, link }) {
  const isExternal = link.startsWith('http');

  return (
    <div className={styles.card}>
      <img className={styles.image} src={image} alt={title} />

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>

        <div className={styles.cardFooter}>
          <div className={styles.stackTags}>
            {stack.map((tech, i) => (
              <span key={i} className={styles.tag}>{tech}</span>
            ))}
          </div>

          {isExternal ? (
            <a href={link} target="_blank" rel="noreferrer" className={styles.link}>
              View Project <ExternalLink size={14} />
            </a>
          ) : (
            <Link to={link} className={styles.link}>
              View Project
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

ProjectCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  stack: PropTypes.arrayOf(PropTypes.string).isRequired,
  link: PropTypes.string.isRequired,
};
