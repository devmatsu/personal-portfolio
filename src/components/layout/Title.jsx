import PropTypes from 'prop-types';
import styles from './Title.module.css';

export function Title({ text, className }) {
  return (
    <div className={className}>
      <header className={`title ${styles.title}`}>
        <p className={`chevron ${styles.chevron}`}>&lt;</p>
        {text}
        <p className={`chevron ${styles.chevron}`}>&#47;&gt;</p>
      </header>
    </div>
  );
}

Title.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};