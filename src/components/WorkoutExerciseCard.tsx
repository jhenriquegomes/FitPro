import React from 'react';
import { WorkoutExercise, Exercise, MuscleGroup } from '../types';
import { db } from '../services/db';
import { getSafeImageUrl } from '../services/imageUtils';
import { MuscleHighlightSvg } from './MuscleHighlightSvg';
import { Dumbbell, Repeat, Clock, Eye, Info } from 'lucide-react';

interface WorkoutExerciseCardProps {
  key?: React.Key;
  workoutExercise: WorkoutExercise;
  index: number;
  onViewDetails?: (exercise: Exercise) => void;
  compact?: boolean;
}

export function WorkoutExerciseCard({
  workoutExercise,
  index,
  onViewDetails,
  compact = false
}: WorkoutExerciseCardProps) {
  const fullExercise: Exercise = db.getExerciseById(workoutExercise.exerciseId) || {
    id: workoutExercise.exerciseId,
    name: workoutExercise.exerciseName || 'Exercício',
    primaryMuscle: 'Peito' as MuscleGroup,
    secondaryMuscles: [],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: '',
    executionSteps: ['Execute o movimento com controle e cadência adequada.'],
    initialPosition: 'Posição inicial padrão para este exercício.',
    movement: 'Movimento biomecânico controlado.',
    breathing: 'Expire na fase concêntrica e inspire na excêntrica.',
    commonMistakes: ['Evite usar impulsos corporais excessivos.'],
    executionTips: ['Mantenha a postura alinhada durante todas as repetições.'],
    recommendedSets: workoutExercise.sets || 3,
    recommendedReps: `${workoutExercise.reps || 10}`,
    recommendedRestSec: workoutExercise.restTimeSec || 60
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(fullExercise);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className="group relative flex items-center gap-3 p-2.5 rounded-2xl bg-[#141922] hover:bg-[#1a2230] border border-neutral-800/90 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
        title="Toque para ver detalhes do exercício e anatomia"
      >
        {/* Order Number Badge */}
        <div className="w-6 h-6 rounded-lg bg-black/60 text-emerald-400 border border-neutral-800 flex items-center justify-center text-xs font-black font-mono shrink-0">
          {index + 1}
        </div>

        {/* Thumbnail Image */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
          <img
            src={getSafeImageUrl(fullExercise.imageUrl)}
            alt={workoutExercise.exerciseName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {fullExercise.primaryMuscle}
            </span>
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate mt-0.5">
            {workoutExercise.exerciseName}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
            <span>{workoutExercise.sets}x{workoutExercise.reps}</span>
            {workoutExercise.loadKg > 0 && <span>• {workoutExercise.loadKg}kg</span>}
          </div>
        </div>

        <Eye className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between bg-gradient-to-b from-[#141922] to-[#0f131a] border border-neutral-800/90 hover:border-emerald-500/60 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-emerald-950/20 hover:-translate-y-0.5"
      title="Toque para visualizar detalhes biomecânicos e o boneco anatômico"
    >
      {/* Top Media Header */}
      <div className="relative h-36 w-full bg-neutral-900 overflow-hidden">
        <img
          src={getSafeImageUrl(fullExercise.imageUrl)}
          alt={workoutExercise.exerciseName}
          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f131a] via-[#0f131a]/30 to-black/40" />

        {/* Order Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-lg bg-black/80 backdrop-blur-xs text-white border border-neutral-700/80 flex items-center justify-center text-xs font-black font-mono shadow-md">
            {index + 1}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md">
            {fullExercise.primaryMuscle}
          </span>
        </div>

        {/* Mini Muscle Skeleton/Anatomy Icon Trigger */}
        <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 backdrop-blur-xs border border-neutral-700 text-emerald-400 group-hover:scale-110 transition-transform">
          <Eye className="w-3.5 h-3.5" />
        </div>

        {/* Equipment Chip */}
        {fullExercise.equipment && (
          <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-900/90 text-neutral-300 border border-neutral-700/80 backdrop-blur-xs">
            {fullExercise.equipment}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between space-y-3">
        <div>
          <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
            {workoutExercise.exerciseName}
          </h4>
          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
            {fullExercise.secondaryMuscles && fullExercise.secondaryMuscles.length > 0 
              ? `Secundários: ${fullExercise.secondaryMuscles.join(', ')}`
              : 'Foco principal: ' + fullExercise.primaryMuscle}
          </p>
        </div>

        {/* Execution Metrics Grid */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/40 border border-neutral-800/80 text-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Séries</span>
            <span className="text-xs font-mono font-black text-white">{workoutExercise.sets}</span>
          </div>
          <div className="border-x border-neutral-800/80">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Reps</span>
            <span className="text-xs font-mono font-black text-emerald-400">{workoutExercise.reps}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Carga</span>
            <span className="text-xs font-mono font-black text-cyan-400">{workoutExercise.loadKg}kg</span>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{workoutExercise.restTimeSec}s descanso</span>
          </span>
          <span className="text-emerald-400 group-hover:underline font-semibold flex items-center gap-0.5">
            <span>Ver detalhes</span>
            <span className="text-xs">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}
