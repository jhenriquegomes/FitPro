import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Dumbbell, Info, Check, Plus, Minus, RotateCcw } from 'lucide-react';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  onApplyWeight?: (weight: number) => void;
}

interface PlateConfig {
  weight: number;
  color: string;
  borderColor: string;
  textColor: string;
  heightClass: string;
}

const AVAILABLE_PLATES: PlateConfig[] = [
  { weight: 25, color: 'bg-red-600', borderColor: 'border-red-400', textColor: 'text-white', heightClass: 'h-36' },
  { weight: 20, color: 'bg-blue-600', borderColor: 'border-blue-400', textColor: 'text-white', heightClass: 'h-32' },
  { weight: 15, color: 'bg-amber-400', borderColor: 'border-amber-300', textColor: 'text-neutral-900', heightClass: 'h-28' },
  { weight: 10, color: 'bg-emerald-600', borderColor: 'border-emerald-400', textColor: 'text-white', heightClass: 'h-24' },
  { weight: 5, color: 'bg-neutral-200', borderColor: 'border-neutral-300', textColor: 'text-neutral-900', heightClass: 'h-20' },
  { weight: 2.5, color: 'bg-neutral-700', borderColor: 'border-neutral-500', textColor: 'text-white', heightClass: 'h-16' },
  { weight: 1.25, color: 'bg-neutral-500', borderColor: 'border-neutral-400', textColor: 'text-white', heightClass: 'h-12' },
];

const BAR_OPTIONS = [
  { label: 'Olímpica Padrão (20 kg)', weight: 20 },
  { label: 'Barra Feminina (15 kg)', weight: 15 },
  { label: 'Barra W / Técnica (10 kg)', weight: 10 },
  { label: 'Máquina Smith / Cabo (0 kg)', weight: 0 },
];

export function PlateCalculatorModal({
  isOpen,
  onClose,
  initialWeight = 60,
  onApplyWeight
}: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);
  const [barWeight, setBarWeight] = useState<number>(20);

  // Calculate plates per side
  const calculation = useMemo(() => {
    const netWeight = Math.max(0, targetWeight - barWeight);
    const weightPerSide = netWeight / 2;

    let remaining = weightPerSide;
    const platesPerSide: { plate: PlateConfig; count: number }[] = [];

    for (const plate of AVAILABLE_PLATES) {
      if (remaining >= plate.weight) {
        const count = Math.floor(remaining / plate.weight);
        platesPerSide.push({ plate, count });
        remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
      }
    }

    const calculatedTotal = barWeight + platesPerSide.reduce((sum, p) => sum + p.plate.weight * p.count * 2, 0);

    return {
      weightPerSide,
      platesPerSide,
      remainingUnmatched: remaining * 2,
      calculatedTotal
    };
  }, [targetWeight, barWeight]);

  if (!isOpen) return null;

  const quickIncrements = [-10, -5, -2.5, +2.5, +5, +10];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        id="lyfta-plate-calculator-modal"
        className="w-full max-w-lg bg-[#0d121c] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black uppercase tracking-wider text-white">Calculadora de Anilhas</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  Lyfta Style
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Distribuição exata para cada lado da barra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Weight Input & Steppers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Carga Alvo Total (kg)
            </label>
            <span className="text-xs font-semibold text-cyan-400">
              {calculation.weightPerSide > 0 ? `${calculation.weightPerSide} kg por lado` : 'Apenas a barra'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTargetWeight(prev => Math.max(barWeight, Math.round((prev - 5) * 10) / 10))}
              className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-800 text-neutral-200 flex items-center justify-center active:scale-95 transition-all text-lg font-black"
            >
              -5
            </button>
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.5"
                min={barWeight}
                max={500}
                value={targetWeight}
                onChange={e => setTargetWeight(Math.max(0, Number(e.target.value) || 0))}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#141a27] border-2 border-cyan-500/40 text-center text-3xl font-black font-mono text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                kg
              </span>
            </div>
            <button
              onClick={() => setTargetWeight(prev => Math.round((prev + 5) * 10) / 10)}
              className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-800 text-neutral-200 flex items-center justify-center active:scale-95 transition-all text-lg font-black"
            >
              +5
            </button>
          </div>

          {/* Quick Increment Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {quickIncrements.map(inc => (
              <button
                key={inc}
                onClick={() => setTargetWeight(prev => Math.max(barWeight, Math.round((prev + inc) * 10) / 10))}
                className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-cyan-500/20 border border-neutral-800 hover:border-cyan-500/40 text-[11px] font-bold text-neutral-300 hover:text-cyan-300 transition-colors"
              >
                {inc > 0 ? `+${inc} kg` : `${inc} kg`}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Tipo de Barra
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BAR_OPTIONS.map(opt => (
              <button
                key={opt.weight}
                onClick={() => {
                  setBarWeight(opt.weight);
                  if (targetWeight < opt.weight) setTargetWeight(opt.weight);
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                  barWeight === opt.weight
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Barbell Representation */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Visualização na Barra (Um Lado)</span>
            <span className="text-cyan-400 font-mono">
              Total Montado: {calculation.calculatedTotal} kg
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090d14] border border-neutral-800 flex items-center justify-center min-h-[140px] overflow-x-auto">
            {/* Barbell sleeve graphic */}
            <div className="flex items-center">
              {/* Center collar */}
              <div className="w-5 h-20 bg-neutral-700 rounded-sm border-r-2 border-neutral-500 flex items-center justify-center">
                <div className="w-1.5 h-16 bg-neutral-500 rounded-full" />
              </div>

              {/* Plates on sleeve */}
              <div className="flex items-center gap-1 px-1 bg-neutral-900/90 h-10 border-y border-neutral-700 rounded-r-md">
                {calculation.platesPerSide.flatMap((p, pIdx) =>
                  Array.from({ length: p.count }, (_, cIdx) => (
                    <div
                      key={`${pIdx}-${cIdx}`}
                      className={`w-6 sm:w-7 rounded-sm flex flex-col items-center justify-center font-bold text-[9px] shadow-lg border ${p.plate.color} ${p.plate.borderColor} ${p.plate.textColor} ${p.plate.heightClass}`}
                      title={`Anilha de ${p.plate.weight} kg`}
                    >
                      <span>{p.plate.weight}</span>
                      <span className="text-[7px] opacity-80">kg</span>
                    </div>
                  ))
                )}

                {calculation.platesPerSide.length === 0 && (
                  <span className="text-[11px] text-neutral-500 px-3 italic">
                    Nenhuma anilha necessária
                  </span>
                )}
              </div>

              {/* Barbell tip / collar clip */}
              <div className="w-3 h-7 bg-neutral-600 rounded-r border-l border-neutral-500" />
            </div>
          </div>
        </div>

        {/* Detailed Plates List Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Anilhas para colocar em CADA lado:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {calculation.platesPerSide.map(item => (
              <div
                key={item.plate.weight}
                className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${item.plate.color} border ${item.plate.borderColor}`} />
                  <span className="text-xs font-bold text-white">
                    {item.plate.weight} kg
                  </span>
                </div>
                <span className="text-sm font-black font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                  {item.count}x
                </span>
              </div>
            ))}

            {calculation.platesPerSide.length === 0 && (
              <div className="col-span-full text-center text-xs text-neutral-400 py-2">
                Utilize apenas o peso da barra ({barWeight} kg).
              </div>
            )}
          </div>

          {calculation.remainingUnmatched > 0 && (
            <p className="text-[11px] text-amber-400 flex items-center gap-1.5 bg-amber-950/30 p-2 rounded-xl border border-amber-500/30">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Sobra de {calculation.remainingUnmatched.toFixed(2)} kg não atingível com as anilhas disponíveis.
            </p>
          )}
        </div>

        {/* Footer / Apply Action */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
          {onApplyWeight && (
            <button
              onClick={() => {
                onApplyWeight(targetWeight);
                onClose();
              }}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Usar {targetWeight} kg no Treino</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
