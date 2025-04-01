import { useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Toast.module.css";

export const Toast = ({ message, type, index, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      style={{ top: `${index * 60}px` }}
    >
      {message}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "warning"]).isRequired,
  index: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};
