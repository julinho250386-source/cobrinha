import { LevelConfig } from '../types/game';

export const CREATOR_INFO = {
  name: 'Seu Nome',
  role: 'Criador & Desenvolvedor',
  year: new Date().getFullYear(),
};

export const GRID_SIZE = 20;
export const POINTS_PER_FOOD = 10;
export const POINTS_PER_GOLDEN_FOOD = 30;
export const GOLDEN_FOOD_DURATION_MS = 7000;

export const STORAGE_KEYS = {
  ranking: 'serpente_ranking_v1',
  playerName: 'serpente_last_player_v1',
  soundMuted: 'serpente_sound_muted_v1',
} as const;

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Clássico',
    subtitle: 'Ritmo inicial',
    minScore: 0,
    nextScore: 50,
    tickMs: 145,
    hasGoldenFood: false,
    obstacles: [],
    ruleSummary: 'Arena aberta sem obstáculos internos.',
  },
  {
    level: 2,
    name: 'Acelerado',
    subtitle: 'Mais velocidade',
    minScore: 50,
    nextScore: 120,
    tickMs: 118,
    hasGoldenFood: false,
    obstacles: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 14, y: 4 },
      { x: 15, y: 4 },
      { x: 4, y: 15 },
      { x: 5, y: 15 },
      { x: 14, y: 15 },
      { x: 15, y: 15 },
    ],
    ruleSummary: 'Velocidade aumentada e 4 barreiras nos cantos.',
  },
  {
    level: 3,
    name: 'Labirinto',
    subtitle: 'Corredores estreitos',
    minScore: 120,
    nextScore: 210,
    tickMs: 95,
    hasGoldenFood: false,
    obstacles: [
      { x: 7, y: 5 },
      { x: 8, y: 5 },
      { x: 9, y: 5 },
      { x: 10, y: 5 },
      { x: 11, y: 5 },
      { x: 12, y: 5 },
      { x: 7, y: 14 },
      { x: 8, y: 14 },
      { x: 9, y: 14 },
      { x: 10, y: 14 },
      { x: 11, y: 14 },
      { x: 12, y: 14 },
      { x: 4, y: 8 },
      { x: 4, y: 9 },
      { x: 4, y: 10 },
      { x: 4, y: 11 },
      { x: 15, y: 8 },
      { x: 15, y: 9 },
      { x: 15, y: 10 },
      { x: 15, y: 11 },
    ],
    ruleSummary: 'Muros centrais e passagens laterais rápidas.',
  },
  {
    level: 4,
    name: 'Campo Minado',
    subtitle: 'Alta precisão',
    minScore: 210,
    nextScore: 320,
    tickMs: 76,
    hasGoldenFood: true,
    obstacles: [
      { x: 3, y: 3 },
      { x: 16, y: 3 },
      { x: 3, y: 16 },
      { x: 16, y: 16 },
      { x: 9, y: 7 },
      { x: 10, y: 7 },
      { x: 9, y: 12 },
      { x: 10, y: 12 },
      { x: 6, y: 9 },
      { x: 6, y: 10 },
      { x: 13, y: 9 },
      { x: 13, y: 10 },
    ],
    ruleSummary: 'Pilares táticos e frutas douradas (+30 pts).',
  },
  {
    level: 5,
    name: 'Mestre',
    subtitle: 'Velocidade extrema',
    minScore: 320,
    nextScore: null,
    tickMs: 60,
    hasGoldenFood: true,
    obstacles: [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 15, y: 3 },
      { x: 16, y: 3 },
      { x: 16, y: 4 },
      { x: 3, y: 15 },
      { x: 3, y: 16 },
      { x: 4, y: 16 },
      { x: 16, y: 15 },
      { x: 15, y: 16 },
      { x: 16, y: 16 },
      { x: 8, y: 6 },
      { x: 11, y: 6 },
      { x: 8, y: 13 },
      { x: 11, y: 13 },
      { x: 6, y: 9 },
      { x: 6, y: 10 },
      { x: 13, y: 9 },
      { x: 13, y: 10 },
    ],
    ruleSummary: 'Ritmo máximo, bloqueios densos e aceleração contínua.',
  },
];

export function getLevelForScore(score: number): LevelConfig {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}
