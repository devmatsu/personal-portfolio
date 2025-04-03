import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import styles from './WidgetsHeader.module.css';

export default function WidgetPageHeader({ widgetName }) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <nav className={styles.breadcrumb}>
        <span className={styles.link} onClick={() => navigate('/widgets')}>
          Widgets
        </span>
        <span className={styles.separator}>›</span>
        <span className={styles.current}>{widgetName}</span>
      </nav>
      <h1 className={styles.title}>{widgetName}</h1>
    </header>
  );
}

WidgetPageHeader.propTypes = {
  widgetName: PropTypes.string.isRequired,
};