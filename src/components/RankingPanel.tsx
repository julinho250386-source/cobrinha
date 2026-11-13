import React, { useState } from 'react';
import { Trash2, Trophy } from 'lucide-react';
import { RankingEntry } from '../types/game';

interface RankingPanelProps {
  entries: RankingEntry[];
  highlightedId: string | null;
  onClearRanking: () => void;
}

export const RankingPanel: React.FC<RankingPanelProps> = ({
  entries,
  highlightedId,
  onClearRanking,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleConfirmClear = () => {
    onClearRanking();
    setConfirmClear(false);
  };

  return (
    <section className="rounded-xl bg-[#19222C] border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-slate-100">
            Ranking dos Jogadores
          </h2>
        </div>

        {entries.length > 0 && !confirmClear && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            aria-label="Limpar ranking"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Limpar
          </button>
        )}

        {confirmClear && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleConfirmClear}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Confirmar
            </button>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center space-y-1 border-t border-white/8">
          <p className="text-sm text-slate-300">Nenhuma pontuação registrada ainda.</p>
          <p className="text-xs text-slate-400">
            Complete uma partida para entrar no Top 10.
          </p>
        </div>
      ) : (
        <div className="border-t border-white/8 divide-y divide-white/6">
          {entries.map((entry, index) => {
            const isHighlighted = entry.id === highlightedId;
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg transition-colors ${
                  isHighlighted ? 'bg-emerald-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-xs font-mono font-semibold tabular-nums shrink-0 ${
                      index === 0
                        ? 'text-amber-400'
                        : index === 1
                          ? 'text-slate-200'
                          : index === 2
                            ? 'text-amber-600'
                            : 'text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {entry.playerName}
                    </p>
                    <p className="text-xs text-slate-400">Nível {entry.level}</p>
                  </div>
                </div>

                <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums shrink-0">
                  {entry.score} pts
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
