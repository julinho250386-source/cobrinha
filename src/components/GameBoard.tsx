import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, User } from 'lucide-react';
import { CREATOR_INFO, GRID_SIZE } from '../config/gameConfig';
import { Direction, FoodItem, GameState, LevelConfig, Point } from '../types/game';

interface GameBoardProps {
  gameState: GameState;
  snake: Point[];
  direction: Direction;
  food: FoodItem;
  goldenFood: FoodItem | null;
  obstacles: Point[];
  score: number;
  currentLevel: LevelConfig;
  playerName: string;
  nameError: string;
  isNewRecord: boolean;
  levelNotice: string | null;
  graceActive: boolean;
  onPlayerNameChange: (value: string) => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onReturnToMenu: () => void;
  onDirectionInput: (dir: Direction) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  snake,
  direction,
  food,
  goldenFood,
  obstacles,
  score,
  currentLevel,
  playerName,
  nameError,
  isNewRecord,
  levelNotice,
  graceActive,
  onPlayerNameChange,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onReturnToMenu,
  onDirectionInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const logicalSize = 560;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (canvas.width !== logicalSize * dpr || canvas.height !== logicalSize * dpr) {
      canvas.width = logicalSize * dpr;
      canvas.height = logicalSize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const cellSize = logicalSize / GRID_SIZE;

    // 1. Arena background & subtle alternating grid
    ctx.fillStyle = '#111820';
    ctx.fillRect(0, 0, logicalSize, logicalSize);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Subtle grid hairlines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, logicalSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(logicalSize, pos);
      ctx.stroke();
    }

    // 2. Obstacles (rendered with beveled slate geometry)
    obstacles.forEach((obs) => {
      const ox = obs.x * cellSize + 2;
      const oy = obs.y * cellSize + 2;
      const size = cellSize - 4;

      ctx.fillStyle = graceActive ? 'rgba(245, 158, 11, 0.25)' : '#2B3645';
      drawRoundedRect(ctx, ox, oy, size, size, 5);
      ctx.fill();

      ctx.strokeStyle = graceActive ? '#F59E0B' : '#475569';
      ctx.lineWidth = 1.25;
      drawRoundedRect(ctx, ox, oy, size, size, 5);
      ctx.stroke();

      // Inner subtle X mark for instant non-color-only obstacle distinction
      ctx.strokeStyle = graceActive ? 'rgba(251, 191, 36, 0.7)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ox + 6, oy + 6);
      ctx.lineTo(ox + size - 6, oy + size - 6);
      ctx.moveTo(ox + size - 6, oy + 6);
      ctx.lineTo(ox + 6, oy + size - 6);
      ctx.stroke();
    });

    // 3. Normal food (grape cluster with stem and leaf)
    {
      const cx = food.x * cellSize + cellSize / 2;
      const cy = food.y * cellSize + cellSize / 2;
      const grapeR = cellSize * 0.145;

      // Soft ambient halo
      ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - cellSize * 0.18);
      ctx.lineTo(cx + 1.5, cy - cellSize * 0.36);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.ellipse(cx + 4.5, cy - cellSize * 0.29, 3.8, 2, -0.45, 0, Math.PI * 2);
      ctx.fill();

      // Grape cluster (inverted triangle: 3 top, 2 middle, 1 bottom)
      const grapes = [
        { dx: -grapeR * 1.45, dy: -cellSize * 0.11, color: '#9333EA' },
        { dx: 0, dy: -cellSize * 0.12, color: '#A855F7' },
        { dx: grapeR * 1.45, dy: -cellSize * 0.11, color: '#9333EA' },
        { dx: -grapeR * 0.75, dy: cellSize * 0.08, color: '#A855F7' },
        { dx: grapeR * 0.75, dy: cellSize * 0.08, color: '#9333EA' },
        { dx: 0, dy: cellSize * 0.25, color: '#A855F7' },
      ];

      grapes.forEach(({ dx, dy, color }) => {
        const gx = cx + dx;
        const gy = cy + dy;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(gx, gy, grapeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#581C87';
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // Subtle specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.beginPath();
        ctx.arc(gx - grapeR * 0.32, gy - grapeR * 0.32, grapeR * 0.28, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. Golden bonus food (Levels 4 & 5)
    if (goldenFood) {
      const gx = goldenFood.x * cellSize + cellSize / 2;
      const gy = goldenFood.y * cellSize + cellSize / 2;
      const r = cellSize * 0.37;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.beginPath();
      ctx.arc(gx, gy, r * 1.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F59E0B';
      drawDiamond(ctx, gx, gy, r);
      ctx.fill();

      ctx.fillStyle = '#FEF3C7';
      drawDiamond(ctx, gx, gy, r * 0.45);
      ctx.fill();
    }

    // 5. Snake body & head
    const total = snake.length;
    for (let i = total - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = i === 0;
      const pad = isHead ? 1.5 : 2.5;
      const sx = seg.x * cellSize + pad;
      const sy = seg.y * cellSize + pad;
      const sSize = cellSize - pad * 2;

      if (isHead) {
        ctx.fillStyle = graceActive ? '#34D399' : '#10B981';
        drawRoundedRect(ctx, sx, sy, sSize, sSize, 7);
        ctx.fill();

        // Directional eyes
        const eyeRadius = 2.4;
        const eyeOffsets = getEyeOffsets(direction, sSize);
        ctx.fillStyle = '#07130E';
        eyeOffsets.forEach((offset) => {
          ctx.beginPath();
          ctx.arc(sx + offset.x, sy + offset.y, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        const ratio = 1 - i / Math.max(total, 1);
        const alpha = 0.45 + ratio * 0.5;
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
        drawRoundedRect(ctx, sx, sy, sSize, sSize, 5.5);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [snake, direction, food, goldenFood, obstacles, graceActive]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING' || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const minSwipeDistance = 24;
    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      onDirectionInput(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      onDirectionInput(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame();
  };

  return (
    <div
      className="relative w-full aspect-square max-w-[560px] mx-auto rounded-xl overflow-hidden border border-white/10 bg-[#111820] shadow-xl select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="Tabuleiro do jogo Serpente"
      />

      {/* Non-intrusive level-up banner at top of arena */}
      {levelNotice && gameState === 'PLAYING' && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-[#19222C]/95 border border-emerald-500/40 text-xs font-medium text-emerald-300 shadow-lg whitespace-nowrap"
        >
          {levelNotice}
        </div>
      )}

      {/* Title Menu Overlay */}
      {gameState === 'TITLE_MENU' && (
        <div className="absolute inset-0 bg-[#0F1419]/92 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleMenuSubmit} className="w-full max-w-sm space-y-5">
            <div className="space-y-1.5 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-50 text-balance">
                Pronto para jogar?
              </h2>
              <p className="text-sm text-slate-400">
                Supere os 5 níveis progressivos e registre sua pontuação no ranking.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="player-name-input"
                className="block text-sm font-medium text-slate-200"
              >
                Nome do jogador
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="player-name-input"
                  type="text"
                  maxLength={20}
                  value={playerName}
                  onChange={(e) => onPlayerNameChange(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#19222C] border border-white/12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-colors"
                />
              </div>
              {nameError && (
                <p className="text-xs text-red-400" role="alert">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              Iniciar Partida
            </button>

            <p className="text-center text-xs text-slate-400">
              Use as setas do teclado, WASD ou deslize o dedo na tela.
            </p>
            <p className="text-center text-xs text-slate-500 pt-1 border-t border-white/8">
              Criado por <span className="text-slate-300 font-medium">{CREATOR_INFO.name}</span>
            </p>
          </form>
        </div>
      )}

      {/* Paused Overlay */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-[#0F1419]/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs text-center space-y-5">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-slate-50">Jogo Pausado</h2>
              <p className="text-sm text-slate-400">
                Nível {currentLevel.level} · {currentLevel.name}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResumeGame}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                Continuar
              </button>
              <button
                type="button"
                onClick={onRestartGame}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#19222C] hover:bg-[#222D3A] border border-white/10 text-slate-200 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Reiniciar Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-[#0F1419]/92 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="space-y-1.5">
              {isNewRecord && (
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                  Novo recorde no ranking
                </p>
              )}
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
                Fim de Jogo
              </h2>
              <p className="text-sm text-slate-400">
                Jogador: <span className="text-slate-200 font-medium">{playerName}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#19222C] border border-white/10">
              <div className="space-y-0.5">
                <span className="block text-xs text-slate-400">Pontuação Final</span>
                <span className="block font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                  {score}
                </span>
              </div>
              <div className="space-y-0.5 border-l border-white/10 pl-3">
                <span className="block text-xs text-slate-400">Nível Alcançado</span>
                <span className="block font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {currentLevel.level}/5
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onRestartGame}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Jogar Novamente
              </button>
              <button
                type="button"
                onClick={onReturnToMenu}
                className="inline-flex items-center justify-center px-4 py-3 rounded-lg bg-[#19222C] hover:bg-[#222D3A] border border-white/10 text-slate-200 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Trocar Nome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius, cy);
  ctx.closePath();
}

function getEyeOffsets(direction: Direction, size: number): Point[] {
  const near = size * 0.72;
  const far = size * 0.28;
  const sideA = size * 0.28;
  const sideB = size * 0.72;

  switch (direction) {
    case 'RIGHT':
      return [
        { x: near, y: sideA },
        { x: near, y: sideB },
      ];
    case 'LEFT':
      return [
        { x: far, y: sideA },
        { x: far, y: sideB },
      ];
    case 'UP':
      return [
        { x: sideA, y: far },
        { x: sideB, y: far },
      ];
    case 'DOWN':
      return [
        { x: sideA, y: near },
        { x: sideB, y: near },
      ];
  }
}
