import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './TechTags.module.css';

const TechTags = ({ tags }) => {
  const [showMore, setShowMore] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const visibleTags = tags.slice(0, 7);
  const othersTags = tags.slice(7);


  const animationDuration = othersTags.length * 50 + 100;
  const handleToggleTags = () => {
    if (showMore) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setShowMore(false);
        setIsAnimatingOut(false);
      }, animationDuration);
    } else {
      setShowMore(true);
    }
  };

  return (
    <div>
      <div className={styles.tagsContainerWrapper}>
        <div className={styles.tagsContainer}>
          {visibleTags.map((tag) => (
            <span key={tag} className={styles.tagOpened}>
              {tag}
            </span>
          ))}

          {othersTags.map((tag, index) => {
            const reversedIndex = (othersTags.length - 1) - index;
            return (
              <span
                key={tag}
                className={
                  showMore && !isAnimatingOut
                    ? styles.tagOpened
                    : isAnimatingOut
                    ? styles.tagClosing
                    : styles.tagClosed
                }
                style={{
                  transitionDelay: `${
                    showMore && !isAnimatingOut
                      ? index * 0.05
                      : isAnimatingOut
                      ? reversedIndex * 0.05
                      : 0
                  }s`,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <div className={styles.showMoreBtnWrapper}>
          <button
            onClick={handleToggleTags}
            className={styles.showMoreBtn}
          >
            {showMore && !isAnimatingOut ? 'Show less tags' : 'Show more tags'}
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
