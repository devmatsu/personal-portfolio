import { useState, useEffect, useCallback } from "react";

import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { Toast } from "../General/Toast";
import styles from "./GitHubGraph.module.css";

export function GitHubGraph() {
  const [years, setYears] = useState([]);
  const [grid, setGrid] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2019);
  const [selectedLevel, setSelectedLevel] = useState(4);
  const [jsonValue, setJsonValue] = useState("");
  const [toasts, setToasts] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const isLeapYear = useCallback((year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }, []);

  const populateYears = useCallback((startYear) => {
    const currentYear = new Date().getFullYear() + 1;
    const yearArray = [];
    for (let year = startYear; year < currentYear; year++) {
      yearArray.push(year);
    }
    setYears(yearArray);
  }, []);

  const createGrid = useCallback(
    (year) => {
      const daysInYear = isLeapYear(year) ? 366 : 365;
      const startDate = new Date(year, 0, 1);
      const startDay = startDate.getDay();

      const squares = [];
      for (let i = 0; i < startDay; i++) {
        squares.push({ type: "empty" });
      }

      for (let i = 0; i < daysInYear; i++) {
        const date = new Date(year, 0, i + 1);
        squares.push({
          type: "day",
          level: 0,
          title: date.toISOString().split("T")[0],
        });
      }

      const endDay = (startDay + daysInYear) % 7;
      for (let i = endDay; i < 7 && endDay !== 0; i++) {
        squares.push({ type: "empty" });
      }

      setGrid(squares);
    },
    [isLeapYear]
  );

  const handleJsonValueChange = (e) => {
    setJsonValue(e.target.value);
  };

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value, 10);
    setSelectedYear(year);
  };
  
  const handleApplyJson = () => {
    try {
      const jsonData = JSON.parse(jsonValue.trim());
      const selectedYearInt = parseInt(selectedYear, 10);
  
      if (!Array.isArray(jsonData.weeks)) {
        showToast('Invalid JSON format: Missing "weeks" array.', "warning");
        return;
      }
  
      const allDatesValid = jsonData.weeks.every(week =>
        week.contributionDays.every(day => {
          if (!day.date) return false;
          const year = parseInt(day.date.slice(0, 4), 10);
          return year === selectedYearInt;
        })
      );
  
      if (!allDatesValid) {
        showToast(`Error: The JSON contains dates that do not belong to the year ${selectedYear}.`, "warning");
        return;
      }
  
      let maxContributionCount = 0;
      jsonData.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          if (day.contributionCount > maxContributionCount) {
            maxContributionCount = day.contributionCount;
          }
        });
      });
  
      if (maxContributionCount === 0) {
        showToast('Error: No contributions found in the JSON.', "warning");
        return;
      }
  
      const daysInYear = isLeapYear(selectedYearInt) ? 366 : 365;
      const startDate = new Date(selectedYearInt, 0, 1);
      const startDayOffset = startDate.getDay();
  
      const squares = [];
      for (let i = 0; i < startDayOffset; i++) {
        squares.push({ type: 'empty' });
      }
  
      for (let i = 0; i < daysInYear; i++) {
        const date = new Date(selectedYearInt, 0, i + 1);
        const dayEntry = jsonData.weeks
          .flatMap(week => week.contributionDays)
          .find(day => day.date === date.toISOString().split('T')[0]);
  
        const level = dayEntry
          ? Math.ceil((dayEntry.contributionCount / maxContributionCount) * 4)
          : 0;
  
        squares.push({
          type: 'day',
          level: Math.min(level, 4),
          title: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        });
      }
  
      const endDayOffset = (startDayOffset + daysInYear) % 7;
      for (let i = endDayOffset; i < 7 && endDayOffset !== 0; i++) {
        squares.push({ type: 'empty' });
      }
  
      setGrid(squares);
  
      showToast('JSON applied successfully!', "success");
    } catch (error) {
      showToast('Invalid JSON! Please check your input.', "error");
    }
  };

  const handleGenerateJSON = () => {
    const jsonOutput = { weeks: [] };
    let currentWeek = [];
  
    grid.forEach((square) => {
      if (square.type === "day") {
        currentWeek.push({
          date: square.title,
          contributionCount: square.level,
        });
  
        if (currentWeek.length === 7) {
          jsonOutput.weeks.push({ contributionDays: currentWeek });
          currentWeek = [];
        }
      }
    });
  
    if (currentWeek.length > 0) {
      jsonOutput.weeks.push({ contributionDays: currentWeek });
    }
  
    setJsonValue(JSON.stringify(jsonOutput, null, 2));
  };

  const handleCopyJSON = () => {
    if (!jsonValue.trim()) {
      showToast("No JSON content to copy. Please generate or enter JSON first.", "warning");
      return;
    }
  
    navigator.clipboard
      .writeText(jsonValue.trim())
      .then(() => {
        showToast("JSON copied to clipboard!", "success");
      })
      .catch(() => {
        showToast("Failed to copy JSON. Please try again.", "error");
      });
  };
  
  const handleDownloadJSON = () => {
    if (!jsonValue.trim()) {
      showToast("No JSON available to download. Generate the JSON first!", "warning");
      return;
    }
  
    try {
      JSON.parse(jsonValue);
      const blob = new Blob([jsonValue.trim()], { type: "application/json" });
  
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "sketch.json";
  
      link.click();
      URL.revokeObjectURL(link.href);
  
      showToast("JSON downloaded successfully!", "success");
    } catch (error) {
      showToast("The JSON is invalid. Please fix it before downloading.", "error");
    }
  };

  const handleSquareUpdate = (index) => {
    setGrid((prevGrid) =>
      prevGrid.map((square, i) =>
        i === index && square.type === "day"
          ? { ...square, level: selectedLevel }
          : square
      )
    );
  };

  const handleMouseDown = (index) => {
    setIsMouseDown(true);
    handleSquareUpdate(index);
  };

  const handleMouseOver = (index) => {
    if (isMouseDown) {
      handleSquareUpdate(index);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);
  
    if (years.length === 0) {
      populateYears(2008);
    }
    createGrid(selectedYear);
  
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [populateYears, createGrid, selectedYear, years.length]);

  const levels = [0, 1, 2, 3, 4];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <div>
      <div className={styles.toastContainer}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            index={index}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
      
      <Header />
      <Title text="GitHubGraph" className={styles.title} />

      <div className={styles.container}>
        <div className={styles.graphContainer}>
          <div className={styles.graph}>
            <ul className={styles.months}>
              {months.map((month, index) => (
                <li key={index}>{month}</li>
              ))}
            </ul>

            <div className={styles.weekdaysAndSquares}>
              <ul className={styles.days}>
                {weekdays.map((day, index) => (
                  <li key={index}>{day}</li>
                ))}
              </ul>

              <ul className={styles.squares}>
                {grid.map((square, index) => (
                  <li
                    key={index}
                    className={square.type === "empty" ? styles.empty : styles.square}
                    title={square.title || ""}
                    data-level={square.type === "day" ? square.level : undefined}
                    onMouseDown={() => handleMouseDown(index)}
                    onMouseOver={() => handleMouseOver(index)}
                  ></li>
                ))}
              </ul>
            </div>
            <div className={styles.controlsScale}>
              <div className={styles.controls}>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={handleYearChange}
                  className={styles.yearSelect}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.scale}>
                <span>Less</span>
                {levels.map((level) => (
                  <div
                    key={level}
                    className={`${styles.box} ${styles[`level${level}`]} ${
                      level === selectedLevel ? styles.selected : ""
                    }`}
                    onClick={() => handleLevelSelect(level)}
                  ></div>
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.jsonGenerator}>
          <textarea
            id="json-input"
            className={styles.jsonValue}
            placeholder="Paste your JSON here..."
            rows="10"
            value={jsonValue}
            onChange={handleJsonValueChange}
          />
          <div className={styles.jsonButtons}>
            <button onClick={handleApplyJson}>Apply JSON</button>
            <button
              id="generate-json"
              className={styles.jsonButton}
              onClick={handleGenerateJSON}
            >
              Generate JSON
            </button>
            <button
              id="copy-json"
              className={styles.jsonButton}
              onClick={handleCopyJSON}
            >
              Copy JSON
            </button>
            <button
              id="download-json"
              className={styles.jsonButton}
              onClick={handleDownloadJSON}
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
