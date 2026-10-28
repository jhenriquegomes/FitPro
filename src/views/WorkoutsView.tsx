import React, { useState } from 'react';
import { db } from '../services/db';
import { Workout, WorkoutExercise, Exercise } from '../types';
import { WeeklyScheduleView } from '../components/WeeklyScheduleView';
import { SocialShareModal } from '../components/SocialShareModal';
import { WorkoutExerciseCard } from '../components/WorkoutExerciseCard';
import { WorkoutPreviewModal } from '../components/WorkoutPreviewModal';
import { getSafeImageUrl } from '../services/imageUtils';
import { useTranslation, setAppLanguage } from '../services/i18n';
import { 
  translateAllWorkouts, 
  translateWorkout, 
  translateAllExercisesInLibrary, 
  isTextInEnglish 
} from '../services/workoutTranslator';
import { 
  Plus, 
  Play, 
  Star, 
  Copy, 
  Trash2, 
  Edit3, 
  Dumbbell, 
  Clock, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Save, 
  Sparkles,
  Search,
  Check,
  Share2,
  ChevronDown,
  Target,
  Languages,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface WorkoutsViewProps {
  onStartWorkout: (workout: Workout) => void;
  onStartEmptyWorkout?: () => void;
  onOpenGenerator: () => void;
  onOpenExerciseDetails: (exerciseId: string) => void;
}

export function WorkoutsView({
  onStartWorkout,
  onStartEmptyWorkout,
  onOpenGenerator,
  onOpenExerciseDetails
}: WorkoutsViewProps) {
  const { t, language } = useTranslation();
  const [subTab, setSubTab] = useState<'workouts' | 'schedule'>('workouts');
  const [workouts, setWorkouts] = useState<Workout[]>(() => db.getWorkouts());
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(() => db.getSelectedWorkoutId());
  const allExercises = db.getExercises();

  // Translation state & toast
  const [translationToast, setTranslationToast] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Check if any workout title or exercise name has english keywords
  const hasEnglishWorkouts = workouts.some(w => 
    isTextInEnglish(w.title) || 
    (w.description && isTextInEnglish(w.description)) ||
    w.exercises.some(ex => isTextInEnglish(ex.exerciseName))
  );

  // Create / Edit modal state
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  const [workoutCategory, setWorkoutCategory] = useState('Hipertrofia');
  const [workoutDuration, setWorkoutDuration] = useState(50);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);

  // Exercise picker drawer inside workout editor
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Share workout modal state
  const [shareWorkout, setShareWorkout] = useState<Workout | null>(null);
  // Workout preview with full exercise cards modal
  const [previewModalWorkout, setPreviewModalWorkout] = useState<Workout | null>(null);

  const refreshWorkouts = () => {
    const list = db.getWorkouts();
    setWorkouts(list);
    const currSelected = db.getSelectedWorkoutId();
    if (currSelected && list.some(w => w.id === currSelected)) {
      setSelectedWorkoutId(currSelected);
    } else if (list.length > 0) {
      setSelectedWorkoutId(list[0].id);
    }
  };

  const handleSelectAsActive = (workoutId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    db.setSelectedWorkoutId(workoutId);
    setSelectedWorkoutId(workoutId);
  };

  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId) || workouts[0] || null;

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    db.toggleWorkoutFavorite(id);
    refreshWorkouts();
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    db.duplicateWorkout(id);
    refreshWorkouts();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este treino permanentemente?')) {
      db.deleteWorkout(id);
      refreshWorkouts();
    }
  };

  const handleTranslateAllWorkouts = (targetLang: 'pt-br' | 'en' = 'pt-br') => {
    setIsTranslating(true);
    try {
      const { workoutsCount, exercisesCount } = translateAllWorkouts(targetLang);
      const { translatedCount: libCount } = translateAllExercisesInLibrary(targetLang);
      refreshWorkouts();
      setAppLanguage(targetLang);

      const msg = targetLang === 'pt-br'
        ? `🇧🇷 ${workoutsCount} treinos e ${exercisesCount + libCount} exercícios traduzidos para Português (PT-BR) com sucesso!`
        : `🇺🇸 ${workoutsCount} workouts translated to English!`;

      setTranslationToast(msg);
      setTimeout(() => setTranslationToast(null), 5000);
    } catch (err) {
      console.error('Error translating workouts:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateSingleWorkout = (workoutId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const w = db.getWorkoutById(workoutId);
    if (!w) return;

    const targetLang = language === 'en' ? 'en' : 'pt-br';
    const translated = translateWorkout(w, targetLang);
    db.updateWorkout(workoutId, translated);
    refreshWorkouts();

    setTranslationToast(`🇧🇷 Treino "${translated.title}" traduzido para Português com sucesso!`);
    setTimeout(() => setTranslationToast(null), 4000);
  };

  const handleStartCreate = () => {
    setEditingWorkoutId(null);
    setWorkoutTitle('');
    setWorkoutDesc('');
    setWorkoutCategory('Hipertrofia');
    setWorkoutDuration(45);
    setWorkoutExercises([]);
    setIsEditingWorkout(true);
  };

  const handleStartEdit = (workout: Workout) => {
    setEditingWorkoutId(workout.id);
    setWorkoutTitle(workout.title);
    setWorkoutDesc(workout.description || '');
    setWorkoutCategory(workout.category || 'Hipertrofia');
    setWorkoutDuration(workout.estimatedDurationMin || 45);
    setWorkoutExercises([...workout.exercises]);
    setIsEditingWorkout(true);
  };

  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle) return;

    let savedWorkout: Workout | null = null;
    if (editingWorkoutId) {
      savedWorkout = db.updateWorkout(editingWorkoutId, {
        title: workoutTitle,
        description: workoutDesc,
        category: workoutCategory,
        estimatedDurationMin: workoutDuration,
        exercises: workoutExercises
      });
    } else {
      savedWorkout = db.createWorkout({
        userId: db.getCurrentUser().id,
        title: workoutTitle,
        description: workoutDesc,
        category: workoutCategory,
        estimatedDurationMin: workoutDuration,
        exercises: workoutExercises
      });
    }

    setIsEditingWorkout(false);
    refreshWorkouts();
    if (savedWorkout) {
      db.setSelectedWorkoutId(savedWorkout.id);
      setSelectedWorkoutId(savedWorkout.id);
    }
  };

  const handleAddExerciseToWorkout = (ex: Exercise) => {
    const newItem: WorkoutExercise = {
      id: 'we-' + Math.random().toString(36).substring(2, 9),
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: ex.recommendedSets || 3,
      reps: 10,
      loadKg: 20,
      restTimeSec: ex.recommendedRestSec || 60,
      order: workoutExercises.length,
      notes: ''
    };
    setWorkoutExercises([...workoutExercises, newItem]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (idx: number) => {
    const updated = workoutExercises.filter((_, i) => i !== idx);
    setWorkoutExercises(updated);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= workoutExercises.length) return;

    const list = [...workoutExercises];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    // update order field
    list.forEach((item, i) => item.order = i);
    setWorkoutExercises(list);
  };

  const handleUpdateExerciseParam = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...workoutExercises];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutExercises(updated);
  };

  const filteredPickerExercises = allExercises.filter(ex => 
    ex.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    ex.primaryMuscle.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div id="workouts-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Segmented Navigation: Meus Treinos vs Minha Semana */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
          <button
            onClick={() => setSubTab('workouts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
              subTab === 'workouts' 
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            MEUS TREINOS ({workouts.length})
          </button>
          <button
            onClick={() => setSubTab('schedule')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
              subTab === 'schedule' 
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            MINHA SEMANA
          </button>
        </div>

        {subTab === 'workouts' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Translation Button: PT-BR */}
            <button
              id="btn-translate-workouts-pt"
              onClick={() => handleTranslateAllWorkouts('pt-br')}
              disabled={isTranslating}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-400 text-xs font-black transition-all active:scale-95 shadow-sm"
              title="Traduzir todos os treinos e nomes de exercícios para Português (PT-BR)"
            >
              <Languages className={`w-3.5 h-3.5 text-amber-400 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>🇧🇷 Colocar Treinos em PT-BR</span>
            </button>

            <button
              onClick={onOpenGenerator}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {t.generateWorkout}
            </button>

            {onStartEmptyWorkout && (
              <button
                id="btn-workouts-empty-workout"
                onClick={onStartEmptyWorkout}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-black transition-all active:scale-95 shadow-sm"
                title="Iniciar um treino livre vazio do zero (Estilo Lyfta)"
              >
                <Plus className="w-4 h-4 text-cyan-400 stroke-[3]" />
                <span>+ Treino Livre</span>
              </button>
            )}

            <button
              id="btn-create-workout"
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t.createWorkout}
            </button>
          </div>
        )}
      </div>

      {/* Global Translation Toast Notification */}
      {translationToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{translationToast}</span>
          </div>
          <button
            onClick={() => setTranslationToast(null)}
            className="p-1 rounded-lg text-emerald-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* English Workouts Detection Banner */}
      {hasEnglishWorkouts && !translationToast && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white text-xs font-bold">Treinos com termos em inglês identificados</div>
              <div className="text-neutral-400 text-[11px]">Você pode traduzir todos os nomes de treinos e exercícios para Português do Brasil com 1 clique.</div>
            </div>
          </div>
          <button
            onClick={() => handleTranslateAllWorkouts('pt-br')}
            disabled={isTranslating}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 transition-all active:scale-95"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Traduzir Tudo para PT-BR</span>
          </button>
        </div>
      )}

      {/* SUBTAB: MINHA SEMANA */}
      {subTab === 'schedule' && (
        <WeeklyScheduleView
          onStartWorkout={onStartWorkout}
          onEditWorkout={handleStartEdit}
        />
      )}

      {/* SUBTAB: MEUS TREINOS */}
      {subTab === 'workouts' && (
        <div className="space-y-6">
          {/* CHOSEN WORKOUT CARD IN TOP CORNER / HEADER */}
          {selectedWorkout && (
            <div 
              id="chosen-workout-header-card"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/45 via-[#131922] to-[#10141a] border-2 border-emerald-500/50 p-5 sm:p-6 shadow-2xl shadow-emerald-950/30 animate-in fade-in"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md shadow-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      🎯 Treino Selecionado
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {selectedWorkout.category}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      ~{selectedWorkout.estimatedDurationMin} min • {selectedWorkout.exercises.length} exercícios
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {selectedWorkout.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-2 max-w-2xl">
                      {selectedWorkout.description || 'Treino pronto e selecionado para sua sessão de hoje.'}
                    </p>
                  </div>

                  {/* Exercises preview tags with Visualizar button */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {selectedWorkout.exercises.slice(0, 4).map((ex, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] font-semibold text-neutral-300">
                        {ex.exerciseName} ({ex.sets}x{ex.reps})
                      </span>
                    ))}
                    {selectedWorkout.exercises.length > 4 && (
                      <span className="text-[11px] text-neutral-400 font-medium">
                        +{selectedWorkout.exercises.length - 4} outros...
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewModalWorkout(selectedWorkout)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                      title="Visualizar os cards dos exercícios deste treino"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Ver Cards</span>
                    </button>
                  </div>
                </div>

                {/* Right Top Corner Controls: Big Iniciar & Quick Switcher */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    id="btn-start-chosen-workout"
                    onClick={() => onStartWorkout(selectedWorkout)}
                    className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span>INICIAR TREINO SELECIONADO</span>
                  </button>

                  {/* Dedicated Visualizar Treino Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalWorkout(selectedWorkout)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 hover:border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    title="Visualizar treino e ver os cards de cada exercício"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Visualizar Treino ({selectedWorkout.exercises.length} cards)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Switch workout selector */}
                    <div className="relative flex-1">
                      <select
                        value={selectedWorkout.id}
                        onChange={e => handleSelectAsActive(e.target.value)}
                        className="w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                        title="Trocar treino selecionado"
                      >
                        {workouts.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.id === selectedWorkout.id ? '✓ ' : ''}{w.title} ({w.exercises.length} ex)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                      onClick={() => handleStartEdit(selectedWorkout)}
                      className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                      title="Editar este treino"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.editWorkout}</span>
                    </button>

                    <button
                      onClick={(e) => handleTranslateSingleWorkout(selectedWorkout.id, e)}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                      title="Traduzir este treino e exercícios para Português (PT-BR)"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>PT-BR</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALL WORKOUTS GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold px-1">
              <span>TODOS OS SEUS TREINOS CADASTRADOS ({workouts.length})</span>
              <span>Clique em "Escolher" para definir como treino ativo</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map(workout => {
                const isSelected = selectedWorkout?.id === workout.id;

                return (
                  <div
                    key={workout.id}
                    className={`group p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-[#151b22] border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'bg-[#12161c] border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {workout.category}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-black">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Escolhido
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isSelected && (
                            <button
                              onClick={e => handleSelectAsActive(workout.id, e)}
                              className="px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-emerald-500 hover:text-black text-neutral-300 text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Definir como treino escolhido no canto superior"
                            >
                              <Target className="w-3 h-3" />
                              <span>Escolher</span>
                            </button>
                          )}
                          <button
                            onClick={e => handleTranslateSingleWorkout(workout.id, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 transition-colors"
                            title="Traduzir este treino e exercícios para Português (PT-BR)"
                          >
                            <Languages className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setShareWorkout(workout);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors"
                            title="Compartilhar treino (foto ou escrito)"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => handleToggleFavorite(workout.id, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 transition-colors"
                            title="Favoritar treino"
                          >
                            <Star className={`w-4 h-4 ${workout.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={e => handleDuplicate(workout.id, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                            title="Duplicar treino"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => handleDelete(workout.id, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                            title="Excluir treino"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-white mt-2 group-hover:text-emerald-400 transition-colors">
                        {workout.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                        {workout.description || 'Sem descrição cadastrada'}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-3 pt-3 border-t border-neutral-800/80">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                          {workout.exercises.length} exercícios
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          ~{workout.estimatedDurationMin} min
                        </span>
                      </div>

                      {/* Exercise summary list */}
                      <div className="mt-3 space-y-1">
                        {workout.exercises.slice(0, 3).map((ex, i) => (
                          <div key={i} className="text-xs text-neutral-300 flex items-center justify-between">
                            <span className="truncate pr-2">• {ex.exerciseName}</span>
                            <span className="text-[11px] font-mono text-neutral-400 shrink-0">{ex.sets}x{ex.reps}</span>
                          </div>
                        ))}
                        {workout.exercises.length > 3 && (
                          <div className="text-[11px] text-neutral-400 pt-0.5">
                            +{workout.exercises.length - 3} outros exercícios...
                          </div>
                        )}
                      </div>
                      {/* Button to view exercises and their cards */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalWorkout(workout);
                        }}
                        className="w-full mt-2.5 py-2 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        title="Visualizar este treino com os cards de cada exercício"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Visualizar Cards ({workout.exercises.length} ex)</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleStartEdit(workout)}
                        className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      <button
                        onClick={() => onStartWorkout(workout)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        INICIAR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT WORKOUT MODAL */}
      {isEditingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div 
            id="edit-workout-modal"
            className="relative w-full max-w-2xl my-6 bg-[#12161d] border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95"
          >
            <button
              onClick={() => setIsEditingWorkout(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Editor de Treino</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {editingWorkoutId ? 'Editar Treino' : 'Criar Novo Treino'}
              </h2>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Nome do Treino *</label>
                  <input
                    type="text"
                    required
                    value={workoutTitle}
                    onChange={e => setWorkoutTitle(e.target.value)}
                    placeholder="Ex: Treino A — Peito e Tríceps"
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Categoria / Foco</label>
                  <select
                    value={workoutCategory}
                    onChange={e => setWorkoutCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  >
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Força">Força</option>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Condicionamento">Condicionamento</option>
                    <option value="Funcional">Funcional</option>
                    <option value="Cardio">Cardio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1">Descrição / Observações Gerais</label>
                <input
                  type="text"
                  value={workoutDesc}
                  onChange={e => setWorkoutDesc(e.target.value)}
                  placeholder="Ex: Foco em cadência controlada e amplitude total"
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>

              {/* Exercises List in Workout */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                    Exercícios no Treino ({workoutExercises.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExercisePicker(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    Adicionar Exercício
                  </button>
                </div>

                {workoutExercises.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                    Nenhum exercício adicionado ainda. Clique em "Adicionar Exercício" acima.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {workoutExercises.map((we, index) => (
                      <div
                        key={we.id || index}
                        className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-400 font-mono text-[10px] flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="font-bold text-white text-sm">{we.exerciseName}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveExercise(index, 'up')}
                              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === workoutExercises.length - 1}
                              onClick={() => handleMoveExercise(index, 'down')}
                              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                              title="Descer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(index)}
                              className="p-1 text-red-400 hover:text-red-300 ml-1"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Numeric params */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">Séries</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={we.sets}
                              onChange={e => handleUpdateExerciseParam(index, 'sets', Number(e.target.value))}
                              className="w-full py-1.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">Reps / Tempo</label>
                            <input
                              type="text"
                              value={we.reps}
                              onChange={e => handleUpdateExerciseParam(index, 'reps', e.target.value)}
                              className="w-full py-1.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-mono text-center"
                              placeholder="10"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">Carga (kg)</label>
                            <input
                              type="number"
                              min={0}
                              value={we.loadKg}
                              onChange={e => handleUpdateExerciseParam(index, 'loadKg', Number(e.target.value))}
                              className="w-full py-1.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">Descanso (s)</label>
                            <input
                              type="number"
                              step={5}
                              value={we.restTimeSec}
                              onChange={e => handleUpdateExerciseParam(index, 'restTimeSec', Number(e.target.value))}
                              className="w-full py-1.5 px-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-mono text-center"
                            />
                          </div>
                        </div>

                        {/* Exercise note */}
                        <div>
                          <input
                            type="text"
                            value={we.notes || ''}
                            onChange={e => handleUpdateExerciseParam(index, 'notes', e.target.value)}
                            placeholder="Obs: 'Manter cotovelos alinhados', 'Pausa de 1s embaixo'..."
                            className="w-full py-1 px-2.5 rounded-lg bg-neutral-800/60 border border-neutral-800 text-[11px] text-neutral-300 placeholder:text-neutral-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditingWorkout(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Salvar Treino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXERCISE PICKER DRAWER */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#12161d] border border-neutral-800 rounded-3xl p-5 space-y-4 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">Selecionar Exercício</h3>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Buscar por nome ou músculo..."
                className="w-full py-2 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white"
                autoFocus
              />
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 text-xs">
              {filteredPickerExercises.map(ex => (
                <div
                  key={ex.id}
                  onClick={() => handleAddExerciseToWorkout(ex)}
                  className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={getSafeImageUrl(ex.imageUrl)} alt="" className="w-9 h-9 rounded-lg object-cover bg-black" />
                    <div>
                      <div className="font-bold text-white">{ex.name}</div>
                      <div className="text-[10px] text-neutral-400">{ex.primaryMuscle} • {ex.equipment}</div>
                    </div>
                  </div>
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                    + Adicionar
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHARE WORKOUT MODAL (PHOTO OR WRITTEN) */}
      {shareWorkout && (
        <SocialShareModal
          workout={shareWorkout}
          user={db.getCurrentUser()}
          onClose={() => setShareWorkout(null)}
        />
      )}

      {/* WORKOUT PREVIEW MODAL (FULL EXERCISE CARDS VIEW) */}
      {previewModalWorkout && (
        <WorkoutPreviewModal
          workout={previewModalWorkout}
          onClose={() => setPreviewModalWorkout(null)}
          onStartWorkout={onStartWorkout}
        />
      )}
    </div>
  );
}
