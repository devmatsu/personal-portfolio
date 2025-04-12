import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './TechTags.module.css';

const TechTags = ({ tags }) => {
  const [showMore, setShowMore] = useState(false);

  const visibleTags = showMore ? tags : tags.slice(0, 7);

  return (
    <div>
      <div className={styles.tagsContainerWrapper}>
        <div className={styles.tagsContainer}>
          {visibleTags.map(tag => (
            <span className={styles.tag} key={tag}>{tag}</span>
          ))}
        </div>
        <div className={styles.showMoreBtnWrapper}>
          <button onClick={() => setShowMore(!showMore)} className={styles.showMoreBtn}>
            {showMore ? 'Show less tags' : 'Show more tags'}
          </button>
        </div>
      </div>
    </div>
  );  
};

export default TechTags;

TechTags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
};
