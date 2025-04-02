import PropTypes from 'prop-types';
import styles from './HeadingBadge.module.css';

const HeadingBadge = ({ title, icon }) => {
  return (
    <div className={styles.badge}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>{title}</span>
    </div>
  );
};

HeadingBadge.propTypes = {
  title: PropTypes.node.isRequired,
  icon: PropTypes.node.isRequired,
};

export default HeadingBadge;
