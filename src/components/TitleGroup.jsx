import PropTypes from 'prop-types';
import styles from './TitleGroup.module.css';

export default function TitleGroup({ title, highlight, subtitle }) {
  return (
    <div className={styles.titleGroup}>
      <h2 className={styles.title}>
        {title} <span>{highlight}</span>
      </h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}

TitleGroup.propTypes = {
  title: PropTypes.string.isRequired,
  highlight: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
};
