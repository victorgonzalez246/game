import { useState, useEffect, useRef, useCallback } from 'react';
import './SnakeGame.css';

// ─── Constants ───────────────────────────────────────────────────────────────
const GRID_SIZE = 20;
const CELL_SIZE = 28;
const INITIAL_SPEED = 160;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 50;

const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const GAME_STATE = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateFood(snake) {
  const occupied = new Set(snake.map((seg) => `${seg.x},${seg.y}`));
  const available = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}

function getOpposite(dir) {
  if (dir === DIRECTION.UP) return DIRECTION.DOWN;
  if (dir === DIRECTION.DOWN) return DIRECTION.UP;
  if (dir === DIRECTION.LEFT) return DIRECTION.RIGHT;
  if (dir === DIRECTION.RIGHT) return DIRECTION.LEFT;
  return null;
}

function getDirectionName(dir) {
  if (dir === DIRECTION.UP) return 'up';
  if (dir === DIRECTION.DOWN) return 'down';
  if (dir === DIRECTION.LEFT) return 'left';
  if (dir === DIRECTION.RIGHT) return 'right';
  return 'right';
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SnakeGame() {
  // ── State ────────────────────────────────────────────────────────────────
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(() => generateFood(INITIAL_SNAKE));
  const [direction, setDirection] = useState(DIRECTION.RIGHT);
  const [gameState, setGameState] = useState(GAME_STATE.START);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // ── Refs (avoid stale closures) ──────────────────────────────────────────
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const speedRef = useRef(speed);
  const gameStateRef = useRef(gameState);
  const inputQueueRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // ── Reset game ───────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    const newSnake = [...INITIAL_SNAKE];
    setSnake(newSnake);
    setFood(generateFood(newSnake));
    setDirection(DIRECTION.RIGHT);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    inputQueueRef.current = [];
    setGameState(GAME_STATE.PLAYING);
  }, []);

  // ── Keyboard handler ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const state = gameStateRef.current;

    // Start game on any arrow / WASD from start screen
    if (state === GAME_STATE.START) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        resetGame();
        return;
      }
    }

    // Toggle pause
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (state === GAME_STATE.PLAYING) {
        setGameState(GAME_STATE.PAUSED);
      } else if (state === GAME_STATE.PAUSED) {
        setGameState(GAME_STATE.PLAYING);
      }
      return;
    }

    if (state !== GAME_STATE.PLAYING) return;

    let newDir = null;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W':
        newDir = DIRECTION.UP; break;
      case 'ArrowDown': case 's': case 'S':
        newDir = DIRECTION.DOWN; break;
      case 'ArrowLeft': case 'a': case 'A':
        newDir = DIRECTION.LEFT; break;
      case 'ArrowRight': case 'd': case 'D':
        newDir = DIRECTION.RIGHT; break;
      default: return;
    }

    e.preventDefault();

    // Use an input queue to handle rapid key presses between ticks
    const queue = inputQueueRef.current;
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current;

    // Block opposite direction
    if (newDir !== getOpposite(lastDir) && newDir !== lastDir) {
      queue.push(newDir);
    }
  }, [resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Game Loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING) return;

    const tick = () => {
      // Process input queue
      let currentDir = directionRef.current;
      if (inputQueueRef.current.length > 0) {
        currentDir = inputQueueRef.current.shift();
        setDirection(currentDir);
        directionRef.current = currentDir;
      }

      const currentSnake = snakeRef.current;
      const head = currentSnake[0];
      const newHead = {
        x: head.x + currentDir.x,
        y: head.y + currentDir.y,
      };

      // ── Wall collision ───────────────────────────────────────────────────
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        setGameState(GAME_STATE.GAME_OVER);
        const currentScore = scoreRef.current;
        const currentHigh = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
        if (currentScore > currentHigh) {
          localStorage.setItem('snake-high-score', currentScore.toString());
          setHighScore(currentScore);
        }
        return;
      }

      // ── Self collision ───────────────────────────────────────────────────
      for (let i = 0; i < currentSnake.length; i++) {
        if (currentSnake[i].x === newHead.x && currentSnake[i].y === newHead.y) {
          setGameState(GAME_STATE.GAME_OVER);
          const currentScore = scoreRef.current;
          const currentHigh = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
          if (currentScore > currentHigh) {
            localStorage.setItem('snake-high-score', currentScore.toString());
            setHighScore(currentScore);
          }
          return;
        }
      }

      // ── Move snake ──────────────────────────────────────────────────────
      const currentFood = foodRef.current;
      const ate = newHead.x === currentFood.x && newHead.y === currentFood.y;
      let newSnake;

      if (ate) {
        newSnake = [newHead, ...currentSnake]; // grow
        const newScore = scoreRef.current + 10;
        setScore(newScore);
        scoreRef.current = newScore;

        // Speed up
        const newSpeed = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
        setSpeed(newSpeed);
        speedRef.current = newSpeed;

        // New food
        const newFood = generateFood(newSnake);
        setFood(newFood);
        foodRef.current = newFood;
      } else {
        newSnake = [newHead, ...currentSnake.slice(0, -1)]; // move
      }

      setSnake(newSnake);
      snakeRef.current = newSnake;
    };

    const interval = setInterval(tick, speedRef.current);
    return () => clearInterval(interval);
  }, [gameState, speed]); // restart interval when speed changes

  // ── Render helpers ───────────────────────────────────────────────────────
  const snakeSet = new Set(snake.map((s, i) => `${s.x},${s.y},${i}`));

  const getCellClass = (x, y) => {
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === x && snake[i].y === y) {
        if (i === 0) return 'cell snake-head';
        return 'cell snake-body';
      }
    }
    if (food.x === x && food.y === y) return 'cell food';
    return 'cell';
  };

  const headDir = getDirectionName(direction);

  // Build cells array
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isHead = snake[0].x === x && snake[0].y === y;
      const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
      const isFood = food.x === x && food.y === y;

      let className = 'cell';
      let dataDir = undefined;

      if (isHead) {
        className = 'cell snake-head';
        dataDir = headDir;
      } else if (isBody) {
        className = 'cell snake-body';
      } else if (isFood) {
        className = 'cell food';
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={className}
          data-dir={dataDir}
        />
      );
    }
  }

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="snake-game-container">
      {/* Header / Scoreboard */}
      <header className="game-header">
        <div className="header-left">
          <span className="game-logo">🐍</span>
          <h1>Snake Game</h1>
        </div>
        <div className="header-right">
          <div className="score-badge">
            <span className="score-label">Puntos</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-badge high">
            <span className="score-label">Récord</span>
            <span className="score-value">{highScore}</span>
          </div>
        </div>
      </header>

      {/* Game Speed Indicator */}
      <div className="speed-bar-wrapper">
        <div className="speed-label">Velocidad</div>
        <div className="speed-bar">
          <div
            className="speed-fill"
            style={{ width: `${((INITIAL_SPEED - speed) / (INITIAL_SPEED - MIN_SPEED)) * 100}%` }}
          />
        </div>
      </div>

      {/* Board */}
      <div className="board-wrapper">
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {cells}
        </div>

        {/* Overlays */}
        {gameState === GAME_STATE.START && (
          <div className="overlay">
            <div className="overlay-content start">
              <div className="overlay-icon">🐍</div>
              <h2>Snake Game</h2>
              <p className="subtitle">El clásico juego de la serpiente</p>
              <div className="controls-info">
                <div className="key-group">
                  <span className="key">↑</span>
                  <div className="key-row">
                    <span className="key">←</span>
                    <span className="key">↓</span>
                    <span className="key">→</span>
                  </div>
                </div>
                <span className="or-text">ó</span>
                <div className="key-group">
                  <span className="key">W</span>
                  <div className="key-row">
                    <span className="key">A</span>
                    <span className="key">S</span>
                    <span className="key">D</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-start" onClick={resetGame}>
                <span className="btn-icon">▶</span> Iniciar Juego
              </button>
              <p className="hint">Presiona cualquier tecla de dirección para comenzar</p>
            </div>
          </div>
        )}

        {gameState === GAME_STATE.PAUSED && (
          <div className="overlay">
            <div className="overlay-content paused">
              <div className="overlay-icon">⏸️</div>
              <h2>Juego Pausado</h2>
              <p className="subtitle">Tómate un respiro</p>
              <button className="btn btn-resume" onClick={() => setGameState(GAME_STATE.PLAYING)}>
                <span className="btn-icon">▶</span> Continuar
              </button>
              <p className="hint">Presiona <span className="key-inline">ESC</span> o <span className="key-inline">P</span> para reanudar</p>
            </div>
          </div>
        )}

        {gameState === GAME_STATE.GAME_OVER && (
          <div className="overlay game-over">
            <div className="overlay-content game-over-content">
              <div className="overlay-icon">💀</div>
              <h2>¡Game Over!</h2>
              <div className="final-scores">
                <div className="final-score-item">
                  <span className="final-label">Puntuación</span>
                  <span className="final-value">{score}</span>
                </div>
                <div className="final-score-divider" />
                <div className="final-score-item">
                  <span className="final-label">Récord</span>
                  <span className="final-value record">{Math.max(score, highScore)}</span>
                </div>
              </div>
              {score >= highScore && score > 0 && (
                <div className="new-record-badge">🏆 ¡Nuevo Récord!</div>
              )}
              <button className="btn btn-restart" onClick={resetGame}>
                <span className="btn-icon">🔄</span> Reiniciar Partida
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {gameState === GAME_STATE.PLAYING && (
        <p className="footer-hint">
          Presiona <span className="key-inline">ESC</span> para pausar
        </p>
      )}
    </div>
  );
}
