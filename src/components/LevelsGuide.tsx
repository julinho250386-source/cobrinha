import React from 'react';
import { LEVELS } from '../config/gameConfig';

interface LevelsGuideProps {
  activeLevel: number;
}

export const LevelsGuide: React.FC<LevelsGuideProps> = ({ activeLevel }) => {
  return (
    <section className="rounded-xl bg-[#19222C] border border-white/10 p-5 space-y-4">
      <div className="space-y-0.5">
        <h2 className="font-display text-base font-semibold text-slate-100">
          Progressão de Níveis
        </h2>
        <p className="text-xs text-slate-400">
          A velocidade e os obstáculos aumentam conforme sua pontuação.
        </p>
      </div>

      <div className="border-t border-white/8 divide-y divide-white/6">
        {LEVELS.map((lvl) => {
          const isActive = lvl.level === activeLevel;
          return (
            <div
              key={lvl.level}
              className={`py-2.5 px-2.5 -mx-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    0{lvl.level}.
                  </span>
                  <span
                    className={`text-sm font-medium truncate ${
                      isActive ? 'text-slate-50' : 'text-slate-200'
                    }`}
                  >
                    {lvl.name}
                  </span>
                </div>

                <span className="font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {lvl.minScore}+ pts
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400 leading-relaxed pl-6">
                {lvl.ruleSummary}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
