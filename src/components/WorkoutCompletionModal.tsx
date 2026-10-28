import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { WorkoutHistoryItem, User } from '../types';
import { SocialShareModal } from './SocialShareModal';
import { soundService } from '../services/sound';
import { 
  Trophy, 
  Clock, 
  Dumbbell, 
  Flame, 
  Share2, 
  Home, 
  CheckCircle2, 
  Sparkles,
  Camera,
  FileText
} from 'lucide-react';

interface WorkoutCompletionModalProps {
  historyItem: WorkoutHistoryItem;
  user: User;
  onFinish: () => void;
}

export function WorkoutCompletionModal({ historyItem, user, onFinish }: WorkoutCompletionModalProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFormat, setShareFormat] = useState<'photo' | 'text'>('photo');

  useEffect(() => {
    soundService.playPrVictory();
    
    // Confetti effect
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#ffffff', '#34d399', '#f59e0b']
      });
    } catch {
      // ignore
    }
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    return `${mins} min`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="workout-completion-modal"
        className="relative w-full max-w-lg my-6 bg-[#12161d] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white text-center animate-in fade-in zoom-in-95"
      >
        {/* Confetti celebration icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-radial from-emerald-500/30 to-emerald-950/40 border border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Trophy className="w-10 h-10 text-emerald-400 stroke-[2.2]" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            FitPro Performance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-3">
            TREINO CONCLUÍDO! 💪
          </h1>
          <p className="text-base font-semibold text-emerald-400 mt-1">
            {historyItem.workoutTitle}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {new Date(historyItem.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {historyItem.startTime} às {historyItem.endTime}
          </p>
        </div>

        {/* PR celebration banner if user beat records */}
        {historyItem.newPrs && historyItem.newPrs.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="text-left text-xs">
              <span className="font-extrabold uppercase text-amber-400 text-sm block">🏆 NOVO RECORDE PESSOAL!</span>
              <span>Você superou sua marca em {historyItem.newPrs[0].exerciseName}: <strong>{historyItem.newPrs[0].loadKg} kg</strong>!</span>
            </div>
          </div>
        )}

        {/* 4 Core Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-neutral-400 uppercase">Tempo</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{formatDuration(historyItem.durationSeconds)}</div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-neutral-400 uppercase">Séries</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{historyItem.totalSets}</div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <Dumbbell className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-neutral-400 uppercase">Carga Total</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{historyItem.totalVolumeKg} <span className="text-xs font-normal">kg</span></div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <Flame className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-neutral-400 uppercase">Calorias</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">~{historyItem.estimatedCalories} <span className="text-xs font-normal">kcal</span></div>
          </div>
        </div>

        {/* Detailed breakdown list */}
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 text-left text-xs space-y-2 max-h-40 overflow-y-auto">
          <div className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] mb-1">
            Resumo dos Exercícios ({historyItem.totalExercises})
          </div>
          {historyItem.exercisesLog.map((log, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-neutral-800/60 last:border-0 text-neutral-300">
              <span className="font-medium text-white">{log.exerciseName}</span>
              <span className="text-neutral-400 font-mono">
                {log.sets.filter(s => s.completed).length} séries • max {Math.max(...log.sets.map(s => s.loadKg), 0)}kg
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons with Photo or Written options */}
        <div className="space-y-2.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="btn-share-workout-photo"
              onClick={() => {
                setShareFormat('photo');
                setShowShareModal(true);
              }}
              className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>COMPARTILHAR FOTO</span>
            </button>

            <button
              id="btn-share-workout-text"
              onClick={() => {
                setShareFormat('text');
                setShowShareModal(true);
              }}
              className="py-3.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs sm:text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <FileText className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>COMPARTILHAR ESCRITO</span>
            </button>
          </div>

          <button
            onClick={onFinish}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-neutral-800"
          >
            <Home className="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      </div>

      {/* Social Share Modal */}
      {showShareModal && (
        <SocialShareModal
          historyItem={historyItem}
          user={user}
          initialFormat={shareFormat}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
