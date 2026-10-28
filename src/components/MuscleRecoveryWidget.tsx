import React from 'react';
import { db } from '../services/db';
import { Activity, ShieldCheck, Zap, BatteryCharging, AlertCircle } from 'lucide-react';

interface MuscleRecoveryWidgetProps {
  onSelectMuscle?: (muscle: string) => void;
}

export function MuscleRecoveryWidget({ onSelectMuscle }: MuscleRecoveryWidgetProps) {
  const recoveryData = db.getMuscleRecoveryStatus();

  return (
    <div 
      id="lyfta-muscle-recovery-widget"
      className="p-5 sm:p-6 rounded-3xl bg-[#0d121c] border border-cyan-500/20 shadow-xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Recuperação Muscular</h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Lyfta Dynamics
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Estado de fadiga e prontidão muscular</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 100% Pronto
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> Recuperando
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Fadigado
          </span>
        </div>
      </div>

      {/* Grid of Muscle Recovery Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {Object.entries(recoveryData).map(([muscle, data]) => {
          const isFull = data.status === 'recuperado';
          const isMid = data.status === 'recuperando';
          const barColor = isFull 
            ? 'bg-emerald-500' 
            : isMid 
            ? 'bg-cyan-500' 
            : 'bg-amber-500';
          const textColor = isFull 
            ? 'text-emerald-400' 
            : isMid 
            ? 'text-cyan-400' 
            : 'text-amber-400';
          const badgeBg = isFull 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
            : isMid 
            ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400' 
            : 'bg-amber-950/40 border-amber-500/30 text-amber-400';

          return (
            <div
              key={muscle}
              onClick={() => onSelectMuscle && onSelectMuscle(muscle)}
              className={`p-3 rounded-2xl bg-[#141a27] border border-neutral-800/80 hover:border-cyan-500/40 transition-all ${
                onSelectMuscle ? 'cursor-pointer hover:bg-neutral-800/50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[90px]">
                  {muscle}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${badgeBg}`}>
                  {data.recoveryPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${data.recoveryPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5 text-[9px] text-neutral-400">
                <span className={`font-semibold capitalize ${textColor}`}>
                  {data.status === 'recuperado' ? 'Pronto' : data.status === 'recuperando' ? 'Recuperando' : 'Fadigado'}
                </span>
                <span>
                  {data.lastTrainedHoursAgo !== null ? `há ${data.lastTrainedHoursAgo}h` : 'Descansado'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
