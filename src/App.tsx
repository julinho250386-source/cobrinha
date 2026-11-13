import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gamepad2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { LevelsGuide } from './components/LevelsGuide';
import { RankingPanel } from './components/RankingPanel';
import { TouchControls } from './components/TouchControls';
import {
  CREATOR_INFO,
  GOLDEN_FOOD_DURATION_MS,
  GRID_SIZE,
  LEVELS,
  POINTS_PER_FOOD,
  POINTS_PER_GOLDEN_FOOD,
  getLevelForScore,
} from './config/gameConfig';
import { Direction, FoodItem, GameState, LevelConfig, Point, RankingEntry } from './types/game';
import { soundFX } from './utils/sound';
import {
  clearRanking,
  loadLastPlayerName,
  loadRanking,
  loadSoundMuted,
  saveLastPlayerName,
  saveScoreToRanking,
  saveSoundMuted,
} from './utils/storage';

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const INITIAL_DIRECTION: Direction = 'RIGHT';

function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

function getNextHead(head: Point, dir: Direction): Point {
  switch (dir) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
      return { x: head.x + 1, y: head.y };
  }
}

function filterSafeObstacles(
  rawObstacles: Point[],
  snake: Point[],
  direction: Direction
): Point[] {
  const head = snake[0];
  const aheadCells: Point[] = [];
  let probe = head;
  for (let step = 1; step <= 3; step++) {
    probe = getNextHead(probe, direction);
    aheadCells.push(probe);
  }

  return rawObstacles.filter((obs) => {
    const hitsSnake = snake.some((seg) => pointsEqual(seg, obs));
    if (hitsSnake) return false;

    const manhattanFromHead = Math.abs(obs.x - head.x) + Math.abs(obs.y - head.y);
    if (manhattanFromHead <= 2) return false;

    const inFrontPath = aheadCells.some((cell) => pointsEqual(cell, obs));
    if (inFrontPath) return false;

    return true;
  });
}

function spawnFreeFood(
  snake: Point[],
  obstacles: Point[],
  otherFood: Point | null,
  type: 'normal' | 'golden'
): FoodItem {
  const freeCells: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const candidate = { x, y };
      const occupiedBySnake = snake.some((seg) => pointsEqual(seg, candidate));
      const occupiedByObstacle = obstacles.some((obs) => pointsEqual(obs, candidate));
      const occupiedByOtherFood = otherFood ? pointsEqual(otherFood, candidate) : false;
      if (!occupiedBySnake && !occupiedByObstacle && !occupiedByOtherFood) {
        freeCells.push(candidate);
      }
    }
  }

  const chosen =
    freeCells.length > 0
      ? freeCells[Math.floor(Math.random() * freeCells.length)]
      : { x: 0, y: 0 };

  return type === 'golden'
    ? { ...chosen, type: 'golden', expiresAt: Date.now() + GOLDEN_FOOD_DURATION_MS }
    : { ...chosen, type: 'normal' };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [playerName, setPlayerName] = useState<string>(() => loadLastPlayerName());
  const [nameError, setNameError] = useState<string>('');
  const [muted, setMuted] = useState<boolean>(() => {
    const initial = loadSoundMuted();
    soundFX.setMuted(initial);
    return initial;
  });

  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [obstacles, setObstacles] = useState<Point[]>(LEVELS[0].obstacles);
  const [food, setFood] = useState<FoodItem>(() =>
    spawnFreeFood(INITIAL_SNAKE, LEVELS[0].obstacles, null, 'normal')
  );
  const [goldenFood, setGoldenFood] = useState<FoodItem | null>(null);

  const [score, setScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [levelNotice, setLevelNotice] = useState<string | null>(null);
  const [graceActive, setGraceActive] = useState<boolean>(false);

  const [ranking, setRanking] = useState<RankingEntry[]>(() => loadRanking());
  const [highlightedRankingId, setHighlightedRankingId] = useState<string | null>(null);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [showDesktopPad, setShowDesktopPad] = useState<boolean>(false);

  // Refs for deterministic tick execution without stale closures
  const snakeRef = useRef<Point[]>(snake);
  const directionRef = useRef<Direction>(direction);
  const directionQueueRef = useRef<Direction[]>([]);
  const obstaclesRef = useRef<Point[]>(obstacles);
  const foodRef = useRef<FoodItem>(food);
  const goldenFoodRef = useRef<FoodItem | null>(goldenFood);
  const scoreRef = useRef<number>(score);
  const levelRef = useRef<LevelConfig>(currentLevel);
  const graceRef = useRef<boolean>(graceActive);
  const playerNameRef = useRef<string>(playerName);

  const graceTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  snakeRef.current = snake;
  obstaclesRef.current = obstacles;
  foodRef.current = food;
  goldenFoodRef.current = goldenFood;
  scoreRef.current = score;
  levelRef.current = currentLevel;
  graceRef.current = graceActive;
  playerNameRef.current = playerName;

  const clearTimers = useCallback(() => {
    if (graceTimerRef.current !== null) {
      window.clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const resetMatchState = useCallback(() => {
    clearTimers();
    const initialSnake = [...INITIAL_SNAKE];
    const initialLevel = LEVELS[0];
    const initialObstacles = initialLevel.obstacles;
    const initialFood = spawnFreeFood(initialSnake, initialObstacles, null, 'normal');

    snakeRef.current = initialSnake;
    directionRef.current = INITIAL_DIRECTION;
    directionQueueRef.current = [];
    obstaclesRef.current = initialObstacles;
    foodRef.current = initialFood;
    goldenFoodRef.current = null;
    scoreRef.current = 0;
    levelRef.current = initialLevel;
    graceRef.current = false;

    setSnake(initialSnake);
    setDirection(INITIAL_DIRECTION);
    setObstacles(initialObstacles);
    setFood(initialFood);
    setGoldenFood(null);
    setScore(0);
    setCurrentLevel(initialLevel);
    setLevelNotice(null);
    setGraceActive(false);
    setIsNewRecord(false);
    setHighlightedRankingId(null);
  }, [clearTimers]);

  const handlePlayerNameChange = (value: string) => {
    setPlayerName(value);
    if (nameError && value.trim().length > 0) {
      setNameError('');
    }
  };

  const handleStartGame = useCallback(() => {
    const trimmed = playerNameRef.current.trim();
    if (!trimmed) {
      setNameError('Informe seu nome para registrar sua pontuação no ranking.');
      return;
    }
    setNameError('');
    setPlayerName(trimmed);
    saveLastPlayerName(trimmed);
    resetMatchState();
    setGameState('PLAYING');
  }, [resetMatchState]);

  const handleRestartGame = useCallback(() => {
    resetMatchState();
    setGameState('PLAYING');
  }, [resetMatchState]);

  const handleReturnToMenu = useCallback(() => {
    resetMatchState();
    setGameState('TITLE_MENU');
  }, [resetMatchState]);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      soundFX.setMuted(next);
      saveSoundMuted(next);
      return next;
    });
  };

  const enqueueDirection = useCallback((nextDir: Direction) => {
    const queue = directionQueueRef.current;
    const lastPlanned = queue.length > 0 ? queue[queue.length - 1] : directionRef.current;
    if (nextDir === lastPlanned || isOppositeDirection(nextDir, lastPlanned)) {
      return;
    }
    if (queue.length < 2) {
      queue.push(nextDir);
    }
  }, []);

  const finishGame = useCallback(() => {
    clearTimers();
    soundFX.playGameOver();

    const finalScore = scoreRef.current;
    const finalLevel = levelRef.current.level;
    const name = playerNameRef.current.trim() || 'Jogador';
    const previousTop = loadRanking()[0]?.score ?? 0;

    const { ranking: updatedRanking, savedEntry } = saveScoreToRanking(
      name,
      finalScore,
      finalLevel
    );
    setRanking(updatedRanking);
    setHighlightedRankingId(savedEntry?.id ?? null);
    setIsNewRecord(finalScore > 0 && finalScore >= previousTop && savedEntry?.id === updatedRanking[0]?.id);
    setGameState('GAME_OVER');
  }, [clearTimers]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (isTyping) return;

      if (gameState === 'PLAYING') {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            e.preventDefault();
            enqueueDirection('UP');
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            e.preventDefault();
            enqueueDirection('DOWN');
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            enqueueDirection('LEFT');
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            enqueueDirection('RIGHT');
            break;
          case ' ':
          case 'p':
          case 'P':
          case 'Escape':
            e.preventDefault();
            handleTogglePause();
            break;
        }
      } else if (gameState === 'PAUSED') {
        if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'Enter') {
          e.preventDefault();
          handleTogglePause();
        }
      } else if (gameState === 'GAME_OVER') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRestartGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, enqueueDirection, handleTogglePause, handleRestartGame]);

  // Dynamic tick interval based on level and extra Level 5 scaling
  const activeTickMs = useMemo(() => {
    if (currentLevel.level < 5) return currentLevel.tickMs;
    const extraSteps = Math.floor(Math.max(0, score - currentLevel.minScore) / 50);
    return Math.max(44, currentLevel.tickMs - extraSteps * 2);
  }, [currentLevel, score]);

  // Core game loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = window.setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentObs = obstaclesRef.current;
      const currentFood = foodRef.current;
      let activeGolden = goldenFoodRef.current;

      // Expire golden fruit if timer elapsed
      if (activeGolden?.expiresAt && Date.now() > activeGolden.expiresAt) {
        activeGolden = null;
        goldenFoodRef.current = null;
        setGoldenFood(null);
      }

      // Consume next buffered turn
      let nextDir = directionRef.current;
      if (directionQueueRef.current.length > 0) {
        nextDir = directionQueueRef.current.shift()!;
        directionRef.current = nextDir;
        setDirection(nextDir);
      }

      const nextHead = getNextHead(currentSnake[0], nextDir);

      // Wall collision
      if (
        nextHead.x < 0 ||
        nextHead.x >= GRID_SIZE ||
        nextHead.y < 0 ||
        nextHead.y >= GRID_SIZE
      ) {
        finishGame();
        return;
      }

      // Obstacle collision (forgiven briefly during level-up grace window)
      if (!graceRef.current && currentObs.some((obs) => pointsEqual(obs, nextHead))) {
        finishGame();
        return;
      }

      const ateNormal = pointsEqual(nextHead, currentFood);
      const ateGolden = activeGolden ? pointsEqual(nextHead, activeGolden) : false;
      const grew = ateNormal || ateGolden;

      // Self collision (ignore tail tip if not growing this tick)
      const bodyToCheck = grew ? currentSnake : currentSnake.slice(0, -1);
      if (bodyToCheck.some((seg) => pointsEqual(seg, nextHead))) {
        finishGame();
        return;
      }

      const nextSnake = [nextHead, ...currentSnake];
      if (!grew) {
        nextSnake.pop();
      }

      snakeRef.current = nextSnake;
      setSnake(nextSnake);

      if (grew) {
        const gained =
          (ateNormal ? POINTS_PER_FOOD : 0) + (ateGolden ? POINTS_PER_GOLDEN_FOOD : 0);
        const nextScore = scoreRef.current + gained;
        scoreRef.current = nextScore;
        setScore(nextScore);

        const nextLevel = getLevelForScore(nextScore);
        let updatedObstacles = currentObs;

        if (nextLevel.level > levelRef.current.level) {
          levelRef.current = nextLevel;
          setCurrentLevel(nextLevel);
          soundFX.playLevelUp();

          updatedObstacles = filterSafeObstacles(nextLevel.obstacles, nextSnake, nextDir);
          obstaclesRef.current = updatedObstacles;
          setObstacles(updatedObstacles);

          setGraceActive(true);
          graceRef.current = true;
          if (graceTimerRef.current !== null) window.clearTimeout(graceTimerRef.current);
          graceTimerRef.current = window.setTimeout(() => {
            graceRef.current = false;
            setGraceActive(false);
          }, 950);

          setLevelNotice(`Nível ${nextLevel.level} · ${nextLevel.name}`);
          if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = window.setTimeout(() => {
            setLevelNotice(null);
          }, 2200);
        } else {
          if (ateGolden) {
            soundFX.playGoldenEat();
          } else {
            soundFX.playEat();
          }
        }

        let nextGolden = activeGolden;
        if (ateGolden) {
          nextGolden = null;
          goldenFoodRef.current = null;
          setGoldenFood(null);
        }

        // Respawn normal food if eaten or covered by a newly added obstacle
        const normalBlockedByObstacle = updatedObstacles.some((obs) =>
          pointsEqual(obs, currentFood)
        );
        let nextNormal = currentFood;
        if (ateNormal || normalBlockedByObstacle) {
          nextNormal = spawnFreeFood(nextSnake, updatedObstacles, nextGolden, 'normal');
          foodRef.current = nextNormal;
          setFood(nextNormal);
        }

        // Spawn golden bonus fruit occasionally on Levels 4 & 5
        if (
          ateNormal &&
          nextLevel.hasGoldenFood &&
          !nextGolden &&
          Math.random() < 0.35
        ) {
          const spawnedGolden = spawnFreeFood(
            nextSnake,
            updatedObstacles,
            nextNormal,
            'golden'
          );
          goldenFoodRef.current = spawnedGolden;
          setGoldenFood(spawnedGolden);
        }
      }
    }, activeTickMs);

    return () => window.clearInterval(timer);
  }, [gameState, activeTickMs, finishGame]);

  // Level progress bar calculation
  const levelProgress = useMemo(() => {
    if (currentLevel.nextScore === null) {
      return { percent: 100, label: 'Nível máximo atingido' };
    }
    const span = currentLevel.nextScore - currentLevel.minScore;
    const currentInSpan = Math.max(0, score - currentLevel.minScore);
    const percent = Math.min(100, Math.round((currentInSpan / span) * 100));
    return {
      percent,
      label: `Próximo nível: ${score}/${currentLevel.nextScore} pts`,
    };
  }, [currentLevel, score]);

  const handleClearRanking = () => {
    setRanking(clearRanking());
    setHighlightedRankingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1419] text-slate-100">
      {/* Top Bar (3-zone contract) */}
      <header className="border-b border-white/8 bg-[#0F1419]/95 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#arena"
            className="font-display text-xl font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0"
          >
            Serpente
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <a
              href="#arena"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Arena
            </a>
            <a
              href="#ranking"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Ranking
            </a>
            <a
              href="#niveis"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Níveis
            </a>
            <a
              href="#creditos"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Créditos
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleToggleMute}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#19222C] hover:bg-[#222D3A] border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label={muted ? 'Ativar som' : 'Silenciar som'}
            >
              {muted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Sem Som</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>Som Ativo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Primary Column: HUD + Arena + Mobile Touch Controls */}
          <section id="arena" className="lg:col-span-7 space-y-4">
            {/* Active Match HUD */}
            <div className="max-w-[560px] mx-auto rounded-xl bg-[#19222C] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6 min-w-0">
                  <div>
                    <span className="block text-xs text-slate-400">Pontuação</span>
                    <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                      {score}
                    </span>
                  </div>

                  <div className="border-l border-white/10 pl-5 min-w-0">
                    <span className="block text-xs text-slate-400">
                      Nível {currentLevel.level}/5
                    </span>
                    <span className="block font-display text-base font-semibold text-slate-100 truncate">
                      {currentLevel.name}
                    </span>
                  </div>

                  {playerName.trim() && (
                    <div className="hidden sm:block border-l border-white/10 pl-5 min-w-0">
                      <span className="block text-xs text-slate-400">Jogador</span>
                      <span className="block text-sm font-medium text-slate-200 truncate max-w-[140px]">
                        {playerName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#222D3A] hover:bg-[#2B3848] border border-white/10 text-xs font-medium text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {gameState === 'PAUSED' ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                          <span>Retomar</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Pausar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Next level progression meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{currentLevel.subtitle}</span>
                  <span className="font-mono tabular-nums">{levelProgress.label}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#0F1419] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 ease-out"
                    style={{ width: `${levelProgress.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Game Canvas Arena */}
            <GameBoard
              gameState={gameState}
              snake={snake}
              direction={direction}
              food={food}
              goldenFood={goldenFood}
              obstacles={obstacles}
              score={score}
              currentLevel={currentLevel}
              playerName={playerName}
              nameError={nameError}
              isNewRecord={isNewRecord}
              levelNotice={levelNotice}
              graceActive={graceActive}
              onPlayerNameChange={handlePlayerNameChange}
              onStartGame={handleStartGame}
              onResumeGame={handleTogglePause}
              onRestartGame={handleRestartGame}
              onReturnToMenu={handleReturnToMenu}
              onDirectionInput={enqueueDirection}
            />

            {/* Touch D-Pad Controls (always visible on mobile/tablet, toggleable on desktop) */}
            <div className="max-w-[560px] mx-auto">
              <div className="lg:hidden">
                <TouchControls
                  disabled={gameState !== 'PLAYING'}
                  onDirection={enqueueDirection}
                />
              </div>

              <div className="hidden lg:flex flex-col items-center gap-3 pt-1">
                <div className="flex items-center justify-between w-full text-xs text-slate-400">
                  <span>Controles: Setas ou WASD · Espaço para pausar</span>
                  <button
                    type="button"
                    onClick={() => setShowDesktopPad((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{showDesktopPad ? 'Ocultar botões' : 'Botões na tela'}</span>
                  </button>
                </div>

                {showDesktopPad && (
                  <TouchControls
                    disabled={gameState !== 'PLAYING'}
                    onDirection={enqueueDirection}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Right / Secondary Column: Ranking + 5-Level Progression */}
          <aside className="lg:col-span-5 space-y-6">
            <div id="ranking">
              <RankingPanel
                entries={ranking}
                highlightedId={highlightedRankingId}
                onClearRanking={handleClearRanking}
              />
            </div>

            <div id="niveis">
              <LevelsGuide activeLevel={currentLevel.level} />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer with visible creator credit */}
      <footer id="creditos" className="border-t border-white/8 bg-[#0F1419] py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            Criado por <span className="text-slate-200 font-medium">{CREATOR_INFO.name}</span> ·{' '}
            {CREATOR_INFO.role}
          </p>
          <p>
            Serpente · Jogo Snake em 5 níveis · {CREATOR_INFO.year}
          </p>
        </div>
      </footer>
    </div>
  );
}
