import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Direction } from '../types/game';

interface TouchControlsProps {
  disabled: boolean;
  onDirection: (dir: Direction) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ disabled, onDirection }) => {
  const buttonBase =
    'flex items-center justify-center w-14 h-12 rounded-xl bg-[#19222C] border border-white/10 text-slate-100 active:bg-emerald-500 active:text-slate-950 active:border-emerald-400 disabled:opacity-40 disabled:pointer-events-none transition-colors select-none cursor-pointer touch-manipulation';

  const handlePress = (dir: Direction) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) {
      onDirection(dir);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 pt-2 select-none" aria-label="Controles direcionais">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={handlePress('UP')}
        className={buttonBase}
        aria-label="Mover para cima"
      >
        <ArrowUp className="w-5 h-5" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onPointerDown={handlePress('LEFT')}
          className={buttonBase}
          aria-label="Mover para a esquerda"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onPointerDown={handlePress('DOWN')}
          className={buttonBase}
          aria-label="Mover para baixo"
        >
          <ArrowDown className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onPointerDown={handlePress('RIGHT')}
          className={buttonBase}
          aria-label="Mover para a direita"
        >
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
