export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export interface FoodItem extends Point {
  type: 'normal' | 'golden';
  expiresAt?: number;
}

export interface LevelConfig {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  subtitle: string;
  minScore: number;
  nextScore: number | null;
  tickMs: number;
  hasGoldenFood: boolean;
  obstacles: Point[];
  ruleSummary: string;
}

export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  level: number;
  playedAt: string;
}
