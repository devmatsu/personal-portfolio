import { useState } from 'react';
import styles from './TicTacToeApp.module.css';

export function TicTacToeApp() {
  const [gameState, setGameState] = useState({
    board: Array(9).fill(null),
    xIsNext: true,
    winner: null,
    gameOver: false,
    player: { 'X': 'Player 1', 'O': 'Player 2'},
    scores: { 'Player 1': 0, 'Player 2': 0 },
    currentPlayer: 'Player 1',
  });

  const handleClick = (index) => {
    const { board, xIsNext, gameOver, winner } = gameState;
    if (winner || board[index] || gameOver) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';

    const calculatedWinner = calculateWinner(newBoard, newBoard[index]);
    setGameState({
      ...gameState,
      board: newBoard,
      winner: calculatedWinner,
      xIsNext: !xIsNext,
      currentPlayer: xIsNext ? 'Player 2' : 'Player 1',
      gameOver: calculatedWinner || newBoard.every((value) => value),
    });
    
    if (calculatedWinner) {
      updateScores(calculatedWinner);
    }
  };

  const updateScores = (winnerPlayer) => {
    setGameState((prevGameState) => ({
      ...prevGameState,
      scores: {
        ...prevGameState.scores,
        [winnerPlayer]: prevGameState.scores[winnerPlayer] + 1,
      },
    }));
  };

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
  
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return gameState.player[squares[a]];
      }
    }
  
    return null;
  };
  
  const handlePlayAgain = () => {
    const newPlayerX = gameState.player['X'] === 'Player 1' ? 'Player 2' : 'Player 1';
    const newPlayerO = gameState.player['O'] === 'Player 1' ? 'Player 2' : 'Player 1';
  
    setGameState((prevGameState) => ({
      ...prevGameState,
      board: Array(9).fill(null),
      winner: null,
      xIsNext: true,
      gameOver: false,
      player: { 'X': newPlayerX, 'O': newPlayerO },
      currentPlayer: newPlayerX,
    }));
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.boardContainer} ${gameState.gameOver ? styles.gameOver : ''}`}>
        <div className={styles.currentPlayer}>
          Current Player: {gameState.currentPlayer}
        </div>
        <div className={styles.board}>
          <div className={styles.boardRow}>
            {gameState.board.slice(0, 3).map((value, index) => (
              <button
                key={index}
                className={styles.square}
                onClick={() => handleClick(index)}
                disabled={gameState.winner || value || gameState.gameOver}
              >
                {value}
              </button>
            ))}
          </div>
          <div className={styles.boardRow}>
            {gameState.board.slice(3, 6).map((value, index) => (
              <button
                key={index + 3}
                className={styles.square}
                onClick={() => handleClick(index + 3)}
                disabled={gameState.winner || value || gameState.gameOver}
              >
                {value}
              </button>
            ))}
          </div>
          <div className={styles.boardRow}>
            {gameState.board.slice(6, 9).map((value, index) => (
              <button
                key={index + 6}
                className={styles.square}
                onClick={() => handleClick(index + 6)}
                disabled={gameState.winner || value || gameState.gameOver}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
      {gameState.gameOver && (
        <div className={styles.status}>
          {gameState.winner && `Winner: ${gameState.winner}`}
          {!gameState.winner && gameState.board.every((value) => value) && 'It is a draw!'}
          {(gameState.winner || gameState.board.every((value) => value)) && (
            <button className={styles.playAgainButton} onClick={handlePlayAgain}>
              Play Again
            </button>
          )}
        </div>
      )}
      <div className={styles.scores}>
        Scores
        <div className={styles.scoresContent}>
          <div>Player 1: {gameState.scores['Player 1']}</div>
          <div>Player 2: {gameState.scores['Player 2']}</div>
        </div>
      </div>
    </div>
  );
}
