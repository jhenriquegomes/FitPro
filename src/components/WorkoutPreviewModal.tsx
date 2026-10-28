import React, { useState } from 'react';
import { Workout, Exercise, MuscleGroup } from '../types';
import { db } from '../services/db';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { MuscleHighlightSvg } from './MuscleHighlightSvg';
import { getSafeImageUrl } from '../services/imageUtils';
import { 
  X, 
  Play, 
  Dumbbell, 
  Clock, 
  Eye, 
  ChevronRight,
  Flame,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface WorkoutPreviewModalProps {
  workout: Workout | null;
  onClose: () => void;
  onStartWorkout: (workout: Workout) => void;
}

export function WorkoutPreviewModal({
  workout,
  onClose,
  onStartWorkout
}: WorkoutPreviewModalProps) {
  const [selectedExerciseForDetail, setSelectedExerciseForDetail] = useState<Exercise | null>(null);

  if (!workout) return null;

  // Extract all muscles worked in this workout
  const muscleGroupsInWorkout: MuscleGroup[] = Array.from(
    new Set(
      workout.exercises.map(item => {
        const ex = db.getExerciseById(item.exerciseId);
        return (ex?.primaryMuscle || 'Peito') as MuscleGroup;
      })
    )
  );

  const primaryMuscle = muscleGroupsInWorkout[0] || ('Peito' as MuscleGroup);
  const secondaryMuscles = muscleGroupsInWorkout.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container - Mobile Bottom Sheet on phone, Modal Dialog on desktop */}
      <div 
        id="workout-preview-modal"
        className="relative z-10 w-full sm:max-w-2xl bg-[#0f131a] border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-neutral-700/80" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-950/60 via-[#131922] to-[#0f131a] border-b border-neutral-800/80 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black">
                Visualização do Treino
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {workout.category}
              </span>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                ~{workout.estimatedDurationMin} min • {workout.exercises.length} exercícios
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white truncate tracking-tight">
              {workout.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            aria-label="Fechar visualização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anatomical Overview Banner - Optimized for Smartphone */}
        <div className="bg-[#0b0e14] border-b border-neutral-800/80 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <MuscleHighlightSvg
                primaryMuscle={primaryMuscle}
                secondaryMuscles={secondaryMuscles}
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Músculos Trabalhados
              </span>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {muscleGroupsInWorkout.map(m => (
                  <span key={m} className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-neutral-900 border border-neutral-800 text-neutral-200">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 shrink-0 hidden sm:inline">
            {workout.exercises.length} cards
          </span>
        </div>

        {/* Scrollable Exercise Cards Feed - Mobile First */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 pb-24">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              Exercícios que você irá fazer ({workout.exercises.length})
            </span>
            <span className="text-[11px] text-neutral-500">
              Toque no card para ver detalhes
            </span>
          </div>

          {workout.exercises.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs bg-neutral-900/40 rounded-2xl border border-neutral-800">
              Nenhum exercício cadastrado neste treino.
            </div>
          ) : (
            <div className="space-y-2.5">
              {workout.exercises.map((item, idx) => {
                const exData = db.getExerciseById(item.exerciseId);
                const primaryM = (exData?.primaryMuscle || 'Peito') as MuscleGroup;
                const photoUrl = exData?.imageUrl;

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      if (exData) {
                        setSelectedExerciseForDetail(exData);
                      }
                    }}
                    className="group relative flex items-center gap-3 p-3 rounded-2xl bg-[#141922] hover:bg-[#1a2230] border border-neutral-800/90 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    title="Toque para ver a biomecânica e o boneco anatômico"
                  >
                    {/* Index Number */}
                    <div className="w-6 h-6 rounded-lg bg-black/70 text-emerald-400 border border-neutral-800 flex items-center justify-center text-xs font-black font-mono shrink-0">
                      {idx + 1}
                    </div>

                    {/* Exercise Thumbnail Photo */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                      {photoUrl ? (
                        <img
                          src={getSafeImageUrl(photoUrl)}
                          alt={item.exerciseName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <Dumbbell className="w-6 h-6" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 p-0.5 rounded bg-black/70 text-emerald-400">
                        <Eye className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {primaryM}
                        </span>
                        {exData?.equipment && (
                          <span className="text-[10px] text-neutral-400 font-medium">
                            • {exData.equipment}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {item.exerciseName}
                      </h4>

                      {/* Series, Reps, Load & Rest Grid */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-300">
                        <span className="font-bold text-white bg-black/40 px-1.5 py-0.5 rounded border border-neutral-800">
                          {item.sets} séries × {item.reps} reps
                        </span>
                        {item.loadKg > 0 && (
                          <span className="text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {item.loadKg}kg
                          </span>
                        )}
                        <span className="text-neutral-400">
                          ⏱ {item.restTimeSec}s
                        </span>
                      </div>
                    </div>

                    {/* Arrow action */}
                    <div className="shrink-0 p-1 rounded-lg text-neutral-500 group-hover:text-emerald-400 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Sticky Bottom CTA */}
        <div className="p-3.5 sm:p-4 bg-[#0c1017]/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 hidden sm:block">
            <span>{workout.exercises.length} exercícios programados para este treino</span>
          </div>

          <button
            id="btn-preview-modal-start"
            onClick={() => {
              onClose();
              onStartWorkout(workout);
            }}
            className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black stroke-black" />
            <span>INICIAR TREINO AGORA</span>
          </button>
        </div>
      </div>

      {/* Individual Exercise Detail Modal */}
      {selectedExerciseForDetail && (
        <ExerciseDetailModal
          exercise={selectedExerciseForDetail}
          onClose={() => setSelectedExerciseForDetail(null)}
          onToggleFavorite={id => {
            db.toggleExerciseFavorite(id);
          }}
        />
      )}
    </div>
  );
}
