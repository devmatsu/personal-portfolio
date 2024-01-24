import { FaPlay, FaPause, FaRedo, FaCog } from "react-icons/fa";
import { useState, useEffect, useCallback } from 'react';

import styles from './Pomodoro.module.css';

const TIMES = {
  MINUTES_IN_SECONDS: 60
}

const LABEL = {
  FOCUS: "FOCUS SESSION",
  BREAK: "BREAK SESSION",
}

export function PomodoroApp() {
  let defaultFocusTime = 25;
  let defaultBreakTime = 5;
  const [audio] = useState(new Audio('/sounds/notification.mp3'));

  const [isFocusMode, setIsFocusMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(defaultFocusTime * TIMES.MINUTES_IN_SECONDS);
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [focusTime, setFocusTime] = useState(defaultFocusTime);
  const [breakTime, setBreakTime] = useState(defaultBreakTime);
  const [focusTimeError, setFocusTimeError] = useState('');
  const [breakTimeError, setBreakTimeError] = useState('');
  const [sessionLabel, setSessionLabel] = useState(LABEL.FOCUS);

  const handlePlayPauseClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleResetClick = () => {
    setIsPlaying(false);
    setTimer(isFocusMode ? focusTime * TIMES.MINUTES_IN_SECONDS : breakTime * TIMES.MINUTES_IN_SECONDS);
  };

  const handleConfigClick = () => {
    if (!isPlaying) {
      setIsConfigMenuOpen(!isConfigMenuOpen);
    }
  };

  const validateAndSetFocusTime = (value) => {
    const newFocusTime = parseInt(value, 10);
    if (newFocusTime > 0 && newFocusTime <= 60 && newFocusTime >= breakTime) {
      setFocusTimeError('');
      setFocusTime(newFocusTime);
    } else {
      setFocusTimeError('Invalid value. Focus time must be greater than 0, less than or equal to 60, and not less than break time.');
    }
  };

  const validateAndSetBreakTime = (value) => {
    const newBreakTime = parseInt(value, 10);
    if (newBreakTime > 0 && newBreakTime <= 60 && newBreakTime <= focusTime) {
      setBreakTimeError('');
      setBreakTime(newBreakTime);
    } else {
      setBreakTimeError('Invalid value. Break time must be greater than 0, less than or equal to 60, and not greater than focus time.');
    }
  };

  const toggleMode = useCallback(() => {
    setIsFocusMode((prevIsFocusMode) => {
      const newIsFocusMode = !prevIsFocusMode;
      setTimer(newIsFocusMode ? focusTime * TIMES.MINUTES_IN_SECONDS : breakTime * TIMES.MINUTES_IN_SECONDS);
      setSessionLabel(newIsFocusMode ? LABEL.FOCUS : LABEL.BREAK);
      return newIsFocusMode;
    });
  }, [focusTime, breakTime]);

  const closeConfigMenu = () => {
    setIsConfigMenuOpen(false);
  };
  
  useEffect(() => {
    if (!isConfigMenuOpen) {
      setFocusTimeError('');
      setBreakTimeError('');
    }
  }, [isConfigMenuOpen]);

  useEffect(() => {
    setTimer(isFocusMode ? focusTime * TIMES.MINUTES_IN_SECONDS : breakTime * TIMES.MINUTES_IN_SECONDS);
    setSessionLabel(isFocusMode ? LABEL.FOCUS : LABEL.BREAK);
  }, [focusTime, breakTime, isFocusMode]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer > 0) {
            return prevTimer - 1;
          } else {
            clearInterval(interval);
            toggleMode();
            audio.play();

            if (!isFocusMode) {
              setIsPlaying(true);
              audio.play();
            } else {
              setIsFocusMode(!isFocusMode);
            }
  
            return isFocusMode ? focusTime * TIMES.MINUTES_IN_SECONDS : breakTime * TIMES.MINUTES_IN_SECONDS;
          }
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
  
    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, focusTime, breakTime, isFocusMode, toggleMode, audio]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.pomodoro}>
        <div className={`${styles.sessionLabel} ${isFocusMode ? styles.focusSession : styles.breakSession}`}>
          {sessionLabel}
        </div>
        <div className={styles.time}>
          {formatTime(timer)}
        </div>
        <div className={styles.controller}>
          <div className={styles.circle}>
            <button onClick={() => handlePlayPauseClick()}>
              {isPlaying ? <FaPause size={32} /> : <FaPlay size={32} />}
            </button>
          </div>
          <div className={styles.circle}>
            <button onClick={() => handleResetClick()}>
              <FaRedo size={32} />
            </button>
          </div>
        </div>
        <button onClick={() => toggleMode()} className={`${styles.toggleModeButton} ${isPlaying ? styles.disabled : ''}`} disabled={isPlaying}>
            Toggle Mode
          </button>
        <div className={`${styles.circle} ${isPlaying ? styles.disabled : ''} ${styles.config}`}>
          <button onClick={() => handleConfigClick()}>
            <FaCog size={32} />
          </button>
          {isConfigMenuOpen && (
            <div className={styles.configMenu}>
              <label>
                Focus Time (minutes):
                <input
                  type="number"
                  value={focusTime}
                  onChange={(e) => validateAndSetFocusTime(e.target.value)}
                />
                <div className={styles.error}>{focusTimeError}</div>
              </label>
              <label>
                Break Time (minutes):
                <input
                  type="number"
                  value={breakTime}
                  onChange={(e) => validateAndSetBreakTime(e.target.value)}
                />
                <div className={styles.error}>{breakTimeError}</div>
              </label>
              <button onClick={() => closeConfigMenu()}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
