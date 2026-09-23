import { useState, useEffect, useRef, useCallback } from 'react';
import './SnakeGame.css';

// ─── Constants ───────────────────────────────────────────────────────────────
const GRID_SIZE = 20;
const CELL_SIZE = 22;
const INITIAL_SPEED = 200;
const SPEED_INCREMENT = 1;
const MIN_SPEED = 100;

const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const CROWN_MILESTONES = [
  { score: 800, tier: 1, name: 'Corona de Bronce', icon: '👑', color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.6)' },
  { score: 1600, tier: 2, name: 'Corona de Plata', icon: '👑', color: '#e2e8f0', glow: 'rgba(226, 232, 240, 0.8)' },
  { score: 3500, tier: 3, name: 'Corona de Oro Real', icon: '👑', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.9)' },
];

function getActiveCrown(currentScore) {
  if (currentScore >= 3500) return CROWN_MILESTONES[2];
  if (currentScore >= 1600) return CROWN_MILESTONES[1];
  if (currentScore >= 800) return CROWN_MILESTONES[0];
  return null;
}

function getProgressPercentage(currentScore) {
  const maxScore = 3500;
  return Math.min(100, Math.max(0, (currentScore / maxScore) * 100));
}

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

  // ── Player & Leaderboard State ───────────────────────────────────────────
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('snake-player-name') || '';
  });
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('snake-leaderboard');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', name: 'ProGamer', score: 180, date: '2026-09-20' },
      { id: '2', name: 'CyberSnake', score: 140, date: '2026-09-21' },
      { id: '3', name: 'ViperKing', score: 90, date: '2026-09-21' },
    ];
  });

  // Helper to format date cleanly
  const formatLeaderboardDate = (dateStr) => {
    if (!dateStr) return '';
    // If it's already HH:mm
    if (/^\d{2}:\d{2}$/.test(dateStr)) return dateStr;
    // If it contains time (like 21/09/2026, 14:03 or similar)
    const timeMatch = dateStr.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) return timeMatch[1];
    // If it's YYYY-MM-DD
    const dateMatch = dateStr.match(/\d{4}-(\d{2}-\d{2})/);
    if (dateMatch) return dateMatch[1];
    return dateStr.slice(-5);
  };

  // Save leaderboard helper
  const saveScoreToLeaderboard = useCallback((finalScore) => {
    const activeName = (playerName || 'Jugador').trim();
    const now = new Date();
    const entry = {
      id: Date.now().toString(),
      name: activeName,
      score: finalScore,
      date: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    };

    setLeaderboard((prev) => {
      const updated = [...prev, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // top 10
      localStorage.setItem('snake-leaderboard', JSON.stringify(updated));
      return updated;
    });
  }, [playerName]);

  // Handle player name update
  const handleSavePlayerName = (nameToSave) => {
    const cleanName = (nameToSave || tempPlayerName || '').trim() || 'Jugador';
    setPlayerName(cleanName);
    localStorage.setItem('snake-player-name', cleanName);
    setIsEditingPlayer(false);
  };

  // ── Refs (avoid stale closures) ──────────────────────────────────────────
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const speedRef = useRef(speed);
  const gameStateRef = useRef(gameState);
  const inputQueueRef = useRef([]);
  const saveScoreRef = useRef(saveScoreToLeaderboard);

  // Keep refs in sync
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { saveScoreRef.current = saveScoreToLeaderboard; }, [saveScoreToLeaderboard]);

  // ── Reset game ───────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    if (!playerName.trim()) {
      setIsEditingPlayer(true);
      return;
    }
    const newSnake = [...INITIAL_SNAKE];
    setSnake(newSnake);
    setFood(generateFood(newSnake));
    setDirection(DIRECTION.RIGHT);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    inputQueueRef.current = [];
    setShowLeaderboard(false);
    setGameState(GAME_STATE.PLAYING);
  }, [playerName]);

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
        saveScoreRef.current(currentScore);
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
          saveScoreRef.current(currentScore);
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
  const headDir = getDirectionName(direction);
  const activeCrown = getActiveCrown(score);
  const progressPercent = getProgressPercentage(score);

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
        className = `cell snake-head ${activeCrown ? `crowned crown-tier-${activeCrown.tier}` : ''}`;
        dataDir = headDir;
      } else if (isBody) {
        className = `cell snake-body ${activeCrown ? `body-tier-${activeCrown.tier}` : ''}`;
      } else if (isFood) {
        className = 'cell food';
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={className}
          data-dir={dataDir}
        >
          {isHead && activeCrown && (
            <span className="snake-crown-icon" title={activeCrown.name}>
              {activeCrown.icon}
            </span>
          )}
        </div>
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
          <div>
            <div className="header-title-row">
              <h1>Snake Game</h1>
              {activeCrown && (
                <span className={`crown-header-badge tier-${activeCrown.tier}`}>
                  {activeCrown.icon} {activeCrown.name}
                </span>
              )}
            </div>
            <div className="player-indicator" onClick={() => { setTempPlayerName(playerName); setIsEditingPlayer(true); }} title="Haz clic para cambiar jugador">
              <span className="player-icon">👤</span>
              <span className="player-name">{playerName || 'Sin nombre (Clic aquí)'}</span>
              <span className="player-edit-hint">✏️</span>
            </div>
          </div>
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
          <button
            className={`btn-icon-leaderboard ${showLeaderboard ? 'active' : ''}`}
            onClick={() => setShowLeaderboard((prev) => !prev)}
            title="Ver Tabla de Calificaciones"
          >
            🏆 <span className="btn-text-responsive">Calificaciones</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Game Board and Side Leaderboard */}
      <div className="game-main-content">
        <div className="game-play-area">
          {/* Crown Progress Bar */}
          <div className="crown-progress-section">
            <div className="crown-progress-header">
              <span className="crown-progress-title">Progreso a las Coronas</span>
              <span className="crown-progress-score">{score} / 3500 pts</span>
            </div>
            <div className="crown-progress-track">
              <div
                className="crown-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
              {CROWN_MILESTONES.map((m) => {
                const milestonePercent = (m.score / 3500) * 100;
                const isReached = score >= m.score;
                return (
                  <div
                    key={m.score}
                    className={`crown-milestone-marker tier-${m.tier} ${isReached ? 'reached' : ''}`}
                    style={{ left: `${milestonePercent}%` }}
                    title={`${m.name}: ${m.score} pts`}
                  >
                    <span className="milestone-crown">{m.icon}</span>
                    <span className="milestone-pts">{m.score}</span>
                  </div>
                );
              })}
            </div>
          </div>

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

                  {/* Player input inside start menu */}
                  <div className="player-start-box">
                    <label htmlFor="start-player-name">Jugador:</label>
                    <div className="player-input-row">
                      <input
                        id="start-player-name"
                        type="text"
                        maxLength={18}
                        value={playerName}
                        placeholder="Ingresa tu nombre..."
                        onChange={(e) => {
                          setPlayerName(e.target.value);
                          localStorage.setItem('snake-player-name', e.target.value);
                        }}
                      />
                    </div>
                  </div>

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
                  <p className="hint">Presiona cualquier tecla de dirección o el botón para comenzar</p>
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
                  <p className="player-gameover-tag">Jugador: <strong>{playerName || 'Jugador'}</strong></p>
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
                  {activeCrown && (
                    <div className={`gameover-crown-badge tier-${activeCrown.tier}`}>
                      {activeCrown.icon} ¡Obtuviste la {activeCrown.name}!
                    </div>
                  )}
                  <div className="game-over-buttons">
                    <button className="btn btn-restart" onClick={resetGame}>
                      <span className="btn-icon">🔄</span> Reintentar
                    </button>
                    <button className="btn btn-view-scores" onClick={() => setShowLeaderboard(true)}>
                      <span className="btn-icon">🏆</span> Ver Calificaciones
                    </button>
                  </div>
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

        {/* Calificaciones / Leaderboard Panel */}
        {showLeaderboard && (
          <aside className="leaderboard-panel animate-slide">
            <div className="leaderboard-header">
              <div className="leaderboard-title-group">
                <span className="leaderboard-trophy">🏆</span>
                <h3>Calificaciones</h3>
              </div>
              <button
                className="btn-close-leaderboard"
                onClick={() => setShowLeaderboard(false)}
                title="Cerrar calificaciones"
              >
                ✕
              </button>
            </div>

            <p className="leaderboard-subtitle">Top mejores puntuaciones de los jugadores</p>

            {/* Quick Player Switch / Add in leaderboard */}
            <div className="leaderboard-current-player">
              <span className="player-tag-label">Jugador actual:</span>
              <div className="player-badge-pill">
                <span>{playerName || 'Sin asignar'}</span>
                <button
                  className="btn-mini-edit"
                  onClick={() => { setTempPlayerName(playerName); setIsEditingPlayer(true); }}
                >
                  Cambiar
                </button>
              </div>
            </div>

            <div className="leaderboard-table-container">
              {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                  <span>🎮</span>
                  <p>Aún no hay calificaciones registradas. ¡Sé el primero en jugar!</p>
                </div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Jugador</th>
                      <th>Puntos</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item, index) => {
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;
                      const isCurrentPlayer = item.name.toLowerCase() === playerName.trim().toLowerCase();

                      return (
                        <tr
                          key={item.id}
                          className={`leaderboard-row ${isCurrentPlayer ? 'highlight-player' : ''}`}
                        >
                          <td className="rank-cell">
                            {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `${index + 1}°`}
                          </td>
                          <td className="player-cell">
                            <span className="player-table-name" title={item.name}>{item.name}</span>
                            {isCurrentPlayer && <span className="you-pill">Tú</span>}
                          </td>
                          <td className="score-cell">{item.score}</td>
                          <td className="date-cell">{formatLeaderboardDate(item.date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="leaderboard-footer">
              <button
                className="btn-clear-scores"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas reiniciar las calificaciones?')) {
                    setLeaderboard([]);
                    localStorage.removeItem('snake-leaderboard');
                  }
                }}
              >
                🗑️ Limpiar historial
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Edit Player Name Modal */}
      {isEditingPlayer && (
        <div className="modal-backdrop" onClick={() => setIsEditingPlayer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 Ingresar Jugador</h3>
              <button className="modal-close" onClick={() => setIsEditingPlayer(false)}>✕</button>
            </div>
            <p className="modal-desc">
              Ingresa el nombre o apodo del jugador para registrar sus calificaciones en cada partida:
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePlayerName(tempPlayerName);
              }}
            >
              <input
                type="text"
                autoFocus
                maxLength={20}
                className="player-name-input"
                placeholder="Nombre del jugador..."
                value={tempPlayerName}
                onChange={(e) => setTempPlayerName(e.target.value)}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditingPlayer(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Guardar Jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
