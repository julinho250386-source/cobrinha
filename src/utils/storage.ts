import { STORAGE_KEYS } from '../config/gameConfig';
import { RankingEntry } from '../types/game';

const MAX_RANKING_ENTRIES = 10;

export function loadRanking(): RankingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ranking);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortRanking(
      parsed.filter(
        (item): item is RankingEntry =>
          typeof item?.id === 'string' &&
          typeof item?.playerName === 'string' &&
          typeof item?.score === 'number' &&
          typeof item?.level === 'number' &&
          typeof item?.playedAt === 'string'
      )
    );
  } catch {
    return [];
  }
}

export function sortRanking(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime();
  });
}

export function saveScoreToRanking(
  playerName: string,
  score: number,
  level: number
): { ranking: RankingEntry[]; savedEntry: RankingEntry | null } {
  if (score <= 0) {
    return { ranking: loadRanking(), savedEntry: null };
  }

  const newEntry: RankingEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName: playerName.trim() || 'Jogador',
    score,
    level,
    playedAt: new Date().toISOString(),
  };

  const current = loadRanking();
  const updated = sortRanking([...current, newEntry]).slice(0, MAX_RANKING_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEYS.ranking, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors gracefully
  }

  const isInTop = updated.some((entry) => entry.id === newEntry.id);
  return { ranking: updated, savedEntry: isInTop ? newEntry : null };
}

export function clearRanking(): RankingEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEYS.ranking);
  } catch {
    // Ignore storage errors
  }
  return [];
}

export function loadLastPlayerName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.playerName) ?? '';
  } catch {
    return '';
  }
}

export function saveLastPlayerName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.playerName, name);
  } catch {
    // Ignore storage errors
  }
}

export function loadSoundMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.soundMuted) === 'true';
  } catch {
    return false;
  }
}

export function saveSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.soundMuted, String(muted));
  } catch {
    // Ignore storage errors
  }
}
