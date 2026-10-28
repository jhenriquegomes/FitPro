import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Dumbbell, Check, Calculator, Sparkles } from 'lucide-react';

interface OneRepMaxCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialReps?: number;
  exerciseName?: string;
  onApplyLoad?: (loadKg: number) => void;
}

export function OneRepMaxCalculatorModal({
  isOpen,
  onClose,
  initialWeight = 80,
  initialReps = 8,
  exerciseName,
  onApplyLoad
}: OneRepMaxCalculatorModalProps) {
  const [weight, setWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);
  const [reps, setReps] = useState<number>(initialReps > 0 ? initialReps : 8);

  // Calculate 1RM using Epley & Brzycki formulas
  const stats = useMemo(() => {
    if (weight <= 0 || reps <= 0) {
      return { epley: 0, brzycki: 0, average: 0 };
    }
    if (reps === 1) {
      return { epley: weight, brzycki: weight, average: weight };
    }

    const epley = weight * (1 + reps / 30);
    const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley;
    const average = Math.round(((epley + brzycki) / 2) * 10) / 10;

    return {
      epley: Math.round(epley * 10) / 10,
      brzycki: Math.round(brzycki * 10) / 10,
      average
    };
  }, [weight, reps]);

  // Breakdown percentages
  const percentages = [
    { pct: 100, reps: '1 RM', desc: 'Força Máxima' },
    { pct: 95, reps: '2 reps', desc: 'Potência' },
    { pct: 90, reps: '3-4 reps', desc: 'Força Pura' },
    { pct: 85, reps: '5-6 reps', desc: 'Força / Hipertrofia' },
    { pct: 80, reps: '7-8 reps', desc: 'Hipertrofia Média' },
    { pct: 75, reps: '9-10 reps', desc: 'Hipertrofia Padrão' },
    { pct: 70, reps: '11-12 reps', desc: 'Resistência / Bomba' },
    { pct: 65, reps: '15 reps', desc: 'Resistência Muscular' },
    { pct: 60, reps: '20 reps', desc: 'Condicionamento' },
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        id="lyfta-1rm-calculator-modal"
        className="w-full max-w-lg bg-[#0d121c] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black uppercase tracking-wider text-white">Calculadora 1RM (Força Máxima)</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  Lyfta Power
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {exerciseName ? `Estimativa para: ${exerciseName}` : 'Estimativa de repetição máxima e faixas de treino'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#141a27] border border-neutral-800 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Carga Realizada (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min={1}
              value={weight}
              onChange={e => setWeight(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-center text-2xl font-black font-mono bg-neutral-900 border border-neutral-700 rounded-xl py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#141a27] border border-neutral-800 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Repetições Feitas
            </label>
            <input
              type="number"
              step="1"
              min={1}
              max={30}
              value={reps}
              onChange={e => setReps(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              className="w-full text-center text-2xl font-black font-mono bg-neutral-900 border border-neutral-700 rounded-xl py-2 text-cyan-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Big 1RM Card Highlight */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#101726] to-blue-950/60 border-2 border-cyan-500/40 text-center space-y-1 shadow-lg">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            1 Repetição Máxima Estimada (1RM)
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
            {stats.average} <span className="text-xl font-bold text-cyan-400">kg</span>
          </div>
          <p className="text-[11px] text-neutral-400 pt-1">
            Fórmulas Epley ({stats.epley} kg) & Brzycki ({stats.brzycki} kg)
          </p>
        </div>

        {/* Percentage Table (Lyfta Style) */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Tabela de Intensidade e Cargas (% de 1RM)</span>
            <span className="text-[11px] text-cyan-400 font-semibold">Selecione para aplicar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {percentages.map(item => {
              const targetKg = Math.round((stats.average * (item.pct / 100)) * 2) / 2;
              return (
                <div
                  key={item.pct}
                  onClick={() => onApplyLoad && onApplyLoad(targetKg)}
                  className={`p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-all ${
                    onApplyLoad ? 'hover:bg-cyan-500/10' : ''
                  }`}
                  title={onApplyLoad ? `Clique para usar ${targetKg} kg na série atual` : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {item.pct}%
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{item.reps}</div>
                      <div className="text-[9px] text-neutral-400">{item.desc}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-cyan-400">
                      {targetKg} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
          {onApplyLoad && (
            <button
              onClick={() => {
                onApplyLoad(stats.average);
                onClose();
              }}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Usar {stats.average} kg</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
