import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

export default function Breadcrumb({ paths }) {
  const navigate = useNavigate();

  return (
    <nav className={styles.breadcrumb}>
      {paths.map((item, index) => {
        const isLast = index === paths.length - 1;

        return (
          <span key={index} className={styles.item}>
            {!isLast ? (
              <span className={styles.link} onClick={() => navigate(item.path)}>
                {item.label}
              </span>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}
            {!isLast && <span className={styles.separator}>›</span>}
          </span>
        );
      })}
    </nav>
  );
}

Breadcrumb.propTypes = {
  paths: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ).isRequired,
};