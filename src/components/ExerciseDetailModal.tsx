import { useState, useEffect, useMemo } from 'react';
import { Exercise, Workout, FavoriteCategory } from '../types';
import { MuscleHighlightSvg } from './MuscleHighlightSvg';
import { GoogleIcon } from './GoogleIcon';
import { ExercisePhotoModal } from './ExercisePhotoModal';
import { db } from '../services/db';
import { getSafeImageUrl } from '../services/imageUtils';
import { 
  X, 
  Dumbbell, 
  Flame, 
  Clock, 
  Repeat, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Wind, 
  Plus, 
  Check,
  Heart,
  ExternalLink,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Github,
  Share2,
  Star
} from 'lucide-react';
import { ExerciseShareModal } from './ExerciseShareModal';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onAddedToWorkout?: () => void;
  onToggleFavorite?: (id: string) => void;
}

export function ExerciseDetailModal({ exercise, onClose, onAddedToWorkout, onToggleFavorite }: ExerciseDetailModalProps) {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(exercise);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isFav, setIsFav] = useState(exercise?.isFavorite ?? false);
  const workouts = db.getWorkouts();
  const categoryNames = useMemo(() => db.getFavoriteCategoryNames(), []);

  // Sync if prop changes
  useEffect(() => {
    setCurrentExercise(exercise);
    setIsFav(exercise?.isFavorite ?? false);
  }, [exercise]);

  if (!currentExercise) return null;
  const activeEx = currentExercise;

  const handleFavoriteClick = () => {
    const updated = !isFav;
    setIsFav(updated);
    if (onToggleFavorite) {
      onToggleFavorite(activeEx.id);
    } else {
      db.toggleExerciseFavorite(activeEx.id);
    }
  };

  const handleSetCategory = (cat: FavoriteCategory) => {
    db.setExerciseFavoriteCategory(activeEx.id, cat);
    setCurrentExercise(prev => prev ? { ...prev, favoriteCategory: cat } : null);
  };

  const handleAddToWorkout = (workoutId: string) => {
    const workout = db.getWorkoutById(workoutId);
    if (!workout) return;

    const newItem = {
      id: 'we-' + Math.random().toString(36).substring(2, 9),
      exerciseId: activeEx.id,
      exerciseName: activeEx.name,
      sets: activeEx.recommendedSets,
      reps: parseInt(activeEx.recommendedReps.split('-')[0]) || 10,
      loadKg: 20,
      restTimeSec: activeEx.recommendedRestSec,
      order: workout.exercises.length
    };

    db.updateWorkout(workoutId, {
      exercises: [...workout.exercises, newItem]
    });

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setShowAddMenu(false);
      if (onAddedToWorkout) onAddedToWorkout();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="exercise-detail-modal"
        className="relative w-full max-w-3xl my-8 bg-[#12161c] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Button to share photo with all details for social networks */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Compartilhar foto com todos os detalhes para salvar nas redes sociais"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Salvar / Redes Sociais</span>
            <span className="sm:hidden">Redes Sociais</span>
          </button>

          {/* Button to alter photo from web */}
          <button
            onClick={() => setShowPhotoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-xs font-semibold backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Importar imagem do computador/celular ou atualizar da web"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Importar / Alterar Foto</span>
            <span className="sm:hidden">Importar Foto</span>
          </button>

          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
              isFav ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
            aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-red-400' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Header with Media */}
        <div className="relative h-64 sm:h-72 w-full bg-neutral-900 overflow-hidden">
          <img 
            src={getSafeImageUrl(activeEx.imageUrl)} 
            alt={activeEx.name}
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12161c] via-[#12161c]/40 to-transparent"></div>

          <div className="absolute bottom-4 left-4 sm:left-6 right-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeEx.primaryMuscle}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {activeEx.level}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800/80 text-neutral-400">
                  {activeEx.equipment}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeEx.name}
              </h2>
            </div>

            {/* Quick action: Add to workout button */}
            <div className="relative">
              {!showAddMenu ? (
                <button
                  id="btn-add-to-workout-trigger"
                  onClick={() => setShowAddMenu(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  ADICIONAR AO TREINO
                </button>
              ) : (
                <div className="bg-[#181f28] border border-neutral-700 p-3 rounded-xl shadow-2xl min-w-[240px]">
                  <p className="text-xs font-semibold text-neutral-300 mb-2">Selecione o treino:</p>
                  {workouts.length === 0 ? (
                    <p className="text-xs text-neutral-400">Nenhum treino criado ainda.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {workouts.map(w => (
                        <button
                          key={w.id}
                          onClick={() => handleAddToWorkout(w.id)}
                          className="w-full text-left text-xs px-2.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-emerald-500 hover:text-black text-neutral-200 transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium truncate mr-2">{w.title}</span>
                          <span className="text-[10px] opacity-70 whitespace-nowrap">{w.exercises.length} ex</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {addedSuccess && (
                    <div className="mt-2 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Adicionado com sucesso!
                    </div>
                  )}
                  <button
                    onClick={() => setShowAddMenu(false)}
                    className="w-full mt-2 text-[11px] text-neutral-400 hover:text-white text-center py-1"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 flex items-center gap-1 mb-1">
                <Repeat className="w-3.5 h-3.5 text-emerald-400" /> Séries Recom.
              </span>
              <span className="text-lg font-bold text-white">{activeEx.recommendedSets} séries</span>
            </div>
            <div className="flex flex-col items-center border-x border-neutral-800">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-emerald-400" /> Repetições
              </span>
              <span className="text-lg font-bold text-white">{activeEx.recommendedReps}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Descanso
              </span>
              <span className="text-lg font-bold text-white">{activeEx.recommendedRestSec}s</span>
            </div>
          </div>

          {/* Favorite Category Assignment (A, B, C, D) if favorited */}
          {isFav && (
            <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
                      Categoria nos Favoritos
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                      {(activeEx.favoriteCategory || 'A')} - {categoryNames[(activeEx.favoriteCategory || 'A') as FavoriteCategory]}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Organize este exercício em Favorito A, B, C ou D para iniciar como Treino Livre
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(['A', 'B', 'C', 'D'] as FavoriteCategory[]).map(cat => {
                  const isCurrent = (activeEx.favoriteCategory || 'A') === cat;
                  const label = categoryNames[cat] || `Favorito ${cat}`;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSetCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-black scale-105'
                          : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 hover:text-white'
                      }`}
                      title={`Atribuir este exercício à categoria ${label}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono ${
                        isCurrent ? 'bg-black text-amber-300 font-black' : 'bg-neutral-800 text-amber-400'
                      }`}>
                        {cat}
                      </span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Muscle Anatomy Diagram & Secondary Muscles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#0e1217] border border-neutral-800/60 items-center">
            <div className="flex justify-center">
              <MuscleHighlightSvg 
                primaryMuscle={activeEx.primaryMuscle} 
                secondaryMuscles={activeEx.secondaryMuscles} 
                className="w-36 h-48"
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Músculo Principal</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{activeEx.primaryMuscle}</p>
              </div>
              {activeEx.secondaryMuscles.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Músculos Secundários</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {activeEx.secondaryMuscles.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded-md text-xs bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Equipamento Necessário</span>
                <p className="text-sm text-neutral-200 flex items-center gap-1.5 mt-0.5">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  {activeEx.equipment}
                </p>
              </div>
            </div>
          </div>

          {/* Execution steps */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Como Executar
            </h3>
            
            {/* Visual execution phases (Phase 1 & Phase 2) if secondary image exists */}
            {activeEx.videoUrl && activeEx.videoUrl.startsWith('http') && (
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Fases do Movimento (Posição Inicial & Pico de Contração)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-center">
                    <div className="h-44 sm:h-48 rounded-xl overflow-hidden bg-black/60 border border-neutral-800 flex items-center justify-center">
                      <img 
                        src={getSafeImageUrl(activeEx.imageUrl)} 
                        alt={`${activeEx.name} - Fase 1 Posição Inicial`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-400">Fase 1: Posição Inicial</span>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <div className="h-44 sm:h-48 rounded-xl overflow-hidden bg-black/60 border border-neutral-800 flex items-center justify-center">
                      <img 
                        src={getSafeImageUrl(activeEx.videoUrl)} 
                        alt={`${activeEx.name} - Fase 2 Pico de Contração`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">Fase 2: Pico de Contração</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">1. Posição Inicial</span>
                <p className="text-sm text-neutral-300 mt-1 leading-relaxed">{activeEx.initialPosition}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">2. Movimento</span>
                <p className="text-sm text-neutral-300 mt-1 leading-relaxed">{activeEx.movement}</p>
              </div>
            </div>

            {/* Breathing */}
            <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-start gap-3">
              <Wind className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Respiração Correta</span>
                <p className="text-sm text-neutral-300 mt-0.5 leading-relaxed">{activeEx.breathing}</p>
              </div>
            </div>

            {/* Step by step checklist */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Passo a Passo</span>
              <ol className="space-y-2 text-sm text-neutral-300 list-decimal list-inside">
                {activeEx.executionSteps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Common Mistakes & Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common Mistakes */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40">
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                Erros Comuns
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300">
                {activeEx.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-red-400 font-bold">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Execution Tips */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2.5">
                <Lightbulb className="w-4 h-4" />
                Dicas de Execução
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300">
                {activeEx.executionTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
              title="Compartilhar foto com todos os detalhes para salvar nas redes sociais"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Salvar Foto para Redes Sociais</span>
            </button>

            <button
              onClick={() => setShowPhotoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 text-xs font-semibold text-blue-300 hover:text-blue-200 transition-colors cursor-pointer"
              title="Trocar foto por uma busca na internet"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Trocar Foto da Web</span>
            </button>

            {activeEx.source === 'google' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-[11px] font-bold text-blue-300">
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>Importado via Google</span>
              </span>
            )}

            {(activeEx.id?.startsWith('fedb-') || (activeEx.sourceUrl && activeEx.sourceUrl.includes('free-exercise-db'))) && (
              <a
                href={activeEx.sourceUrl || "https://yuhonas.github.io/free-exercise-db/"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/40 text-[11px] font-bold text-purple-300 hover:text-purple-200 hover:bg-purple-900/40 transition-colors"
                title="Ver no repositório GitHub Free Exercise DB"
              >
                <Github className="w-3.5 h-3.5" />
                <span>yuhonas/free-exercise-db</span>
                <ExternalLink className="w-3 h-3 text-purple-400" />
              </a>
            )}

            <a
              href={`https://www.google.com/search?q=${encodeURIComponent('exercicio ' + activeEx.name + ' biomecanica execucao')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <GoogleIcon className="w-3.5 h-3.5" />
              <span>Ver vídeos e dicas no Google</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Web Photo Selector Modal */}
        <ExercisePhotoModal
          isOpen={showPhotoModal}
          exercise={activeEx}
          onClose={() => setShowPhotoModal(false)}
          onPhotoUpdated={updated => {
            setCurrentExercise(updated);
          }}
        />

        {/* Social Network Photo & Details Share Modal */}
        {showShareModal && (
          <ExerciseShareModal
            exercise={activeEx}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    </div>
  );
}
