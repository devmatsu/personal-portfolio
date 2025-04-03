import PropTypes from 'prop-types';
import styles from './WidgetTile.module.css';

const WidgetTile = ({ size = 'medium', title, children }) => {
  return (
    <div className={`${styles.tile} ${styles[size]}`}>
      {title && <span className={styles.title}>{title}</span>}
      <div className={styles.content}>{children}</div>
    </div>
  );
};

WidgetTile.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default WidgetTile;
