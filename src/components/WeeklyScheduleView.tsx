import { useState } from 'react';
import { WeeklyScheduleDay, Workout, DayOfWeek } from '../types';
import { db } from '../services/db';
import { WeeklyScheduleExportModal } from './WeeklyScheduleExportModal';
import { WorkoutPreviewModal } from './WorkoutPreviewModal';
import { 
  Calendar, 
  List, 
  Moon, 
  Dumbbell, 
  Play, 
  Check, 
  ChevronRight, 
  RotateCcw, 
  Sparkles,
  Edit2,
  FileText,
  Camera,
  Share2,
  Eye
} from 'lucide-react';

interface WeeklyScheduleViewProps {
  onStartWorkout: (workout: Workout) => void;
  onEditWorkout: (workout: Workout) => void;
}

const DAYS_ORDER: DayOfWeek[] = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];

export function WeeklyScheduleView({ onStartWorkout, onEditWorkout }: WeeklyScheduleViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [schedule, setSchedule] = useState<WeeklyScheduleDay[]>(() => db.getWeeklySchedule());
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);
  const workouts = db.getWorkouts();

  const handleToggleRest = (dayOfWeek: DayOfWeek) => {
    const current = schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!current) return;

    const updatedIsRest = !current.isRest;
    const updatedWorkoutId = updatedIsRest ? null : (workouts[0]?.id || null);

    db.updateWeeklyDay(dayOfWeek, {
      isRest: updatedIsRest,
      workoutId: updatedWorkoutId,
      notes: updatedIsRest ? 'Descanso e recuperação' : (workouts.find(w => w.id === updatedWorkoutId)?.title || '')
    });

    setSchedule(db.getWeeklySchedule());
  };

  const handleAssignWorkout = (dayOfWeek: DayOfWeek, workoutId: string | null) => {
    const isRest = workoutId === null;
    const foundW = workouts.find(w => w.id === workoutId);

    db.updateWeeklyDay(dayOfWeek, {
      isRest,
      workoutId,
      notes: isRest ? 'Descanso' : (foundW?.title || '')
    });

    setSchedule(db.getWeeklySchedule());
    setEditingDay(null);
  };

  // Quick weekly routine templates
  const applyTemplate = (templateName: string) => {
    const newSchedule: WeeklyScheduleDay[] = [...schedule];

    if (templateName === 'ppl') {
      // Push Pull Legs
      const wA = workouts.find(w => w.title.includes('Peito')) || workouts[0];
      const wB = workouts.find(w => w.title.includes('Costas')) || workouts[1] || workouts[0];
      const wC = workouts.find(w => w.title.includes('Pernas')) || workouts[2] || workouts[0];
      
      DAYS_ORDER.forEach((d, i) => {
        if (d === 'SEGUNDA') newSchedule[i] = { dayOfWeek: d, workoutId: wA?.id || null, isRest: false, notes: wA?.title || '' };
        if (d === 'TERÇA') newSchedule[i] = { dayOfWeek: d, workoutId: wB?.id || null, isRest: false, notes: wB?.title || '' };
        if (d === 'QUARTA') newSchedule[i] = { dayOfWeek: d, workoutId: null, isRest: true, notes: 'Descanso' };
        if (d === 'QUINTA') newSchedule[i] = { dayOfWeek: d, workoutId: wC?.id || null, isRest: false, notes: wC?.title || '' };
        if (d === 'SEXTA') newSchedule[i] = { dayOfWeek: d, workoutId: wA?.id || null, isRest: false, notes: wA?.title || '' };
        if (d === 'SÁBADO') newSchedule[i] = { dayOfWeek: d, workoutId: wB?.id || null, isRest: false, notes: wB?.title || '' };
        if (d === 'DOMINGO') newSchedule[i] = { dayOfWeek: d, workoutId: null, isRest: true, notes: 'Descanso' };
      });
    } else if (templateName === '4days') {
      const wA = workouts[0];
      const wB = workouts[1] || workouts[0];
      const wC = workouts[2] || workouts[0];
      const wD = workouts[3] || workouts[0];

      DAYS_ORDER.forEach((d, i) => {
        if (d === 'SEGUNDA') newSchedule[i] = { dayOfWeek: d, workoutId: wA?.id || null, isRest: false, notes: wA?.title || '' };
        if (d === 'TERÇA') newSchedule[i] = { dayOfWeek: d, workoutId: wB?.id || null, isRest: false, notes: wB?.title || '' };
        if (d === 'QUARTA') newSchedule[i] = { dayOfWeek: d, workoutId: null, isRest: true, notes: 'Descanso ativo' };
        if (d === 'QUINTA') newSchedule[i] = { dayOfWeek: d, workoutId: wC?.id || null, isRest: false, notes: wC?.title || '' };
        if (d === 'SEXTA') newSchedule[i] = { dayOfWeek: d, workoutId: wD?.id || null, isRest: false, notes: wD?.title || '' };
        if (d === 'SÁBADO') newSchedule[i] = { dayOfWeek: d, workoutId: null, isRest: true, notes: 'Descanso' };
        if (d === 'DOMINGO') newSchedule[i] = { dayOfWeek: d, workoutId: null, isRest: true, notes: 'Descanso' };
      });
    }

    db.setWeeklySchedule(newSchedule);
    setSchedule(newSchedule);
  };

  // Determine current day of week in PT-BR
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const currentDayOfWeek = DAYS_ORDER[todayIndex];

  return (
    <div id="weekly-schedule-container" className="space-y-6">
      {/* Top Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Rotina & Planejamento</span>
          <h2 className="text-2xl font-black text-white">Minha Semana</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Organize seus dias de treino e descanso para máxima consistência
          </p>
        </div>

        {/* Actions and View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-weekly-schedule"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            title="Ver treino da semana em PDF e Foto para compartilhar"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver em PDF & Foto</span>
            <Share2 className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
          </button>

          <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list' 
                  ? 'bg-emerald-500 text-black' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-emerald-500 text-black' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendário
            </button>
          </div>
        </div>
      </div>

      {/* Routine Templates Bar */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-neutral-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Modelos de Rotina Prontos:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyTemplate('4days')}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Hipertrofia 4 Dias (ABCD)
          </button>
          <button
            onClick={() => applyTemplate('ppl')}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Push / Pull / Legs (PPL)
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {schedule.map(day => {
            const isToday = day.dayOfWeek === currentDayOfWeek;
            const workout = day.workoutId ? db.getWorkoutById(day.workoutId) : null;
            const isEditing = editingDay === day.dayOfWeek;

            return (
              <div
                key={day.dayOfWeek}
                className={`p-4 rounded-2xl border transition-all ${
                  isToday 
                    ? 'bg-[#151b22] border-emerald-500/60 shadow-lg shadow-emerald-500/5' 
                    : 'bg-[#12161c] border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${
                      day.isRest 
                        ? 'bg-neutral-800/60 text-neutral-400' 
                        : isToday 
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                        : 'bg-neutral-800 text-emerald-400'
                    }`}>
                      <span className="text-[10px] uppercase">{day.dayOfWeek.substring(0, 3)}</span>
                      {day.isRest ? <Moon className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">{day.dayOfWeek}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black">
                            Hoje
                          </span>
                        )}
                        {day.isRest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-400">
                            Descanso
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-neutral-200 mt-0.5">
                        {day.isRest ? 'Dia de Recuperação e Descanso Muscular' : workout?.title || day.notes || 'Nenhum treino atribuído'}
                      </p>

                      {!day.isRest && workout && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                          <span>{workout.exercises.length} exercícios</span>
                          <span>•</span>
                          <span>~{workout.estimatedDurationMin} min</span>
                          <span>•</span>
                          <span className="text-emerald-400">{workout.category}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!day.isRest && workout && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewWorkout(workout)}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                          title="Visualizar cards dos exercícios deste treino"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Cards</span>
                        </button>
                        <button
                          onClick={() => onStartWorkout(workout)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-black" />
                          INICIAR
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setEditingDay(isEditing ? null : day.dayOfWeek)}
                      className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                      title="Alterar treino deste dia"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleRest(day.dayOfWeek)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        day.isRest 
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' 
                          : 'bg-neutral-800/40 hover:bg-neutral-800 text-neutral-400'
                      }`}
                      title={day.isRest ? "Tornar dia de treino" : "Definir como descanso"}
                    >
                      {day.isRest ? 'Treinar' : 'Descansar'}
                    </button>
                  </div>
                </div>

                {/* Inline Workout Selector Drawer */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-2 animate-in fade-in">
                    <p className="text-xs font-semibold text-neutral-300">Escolha o treino para {day.dayOfWeek}:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAssignWorkout(day.dayOfWeek, null)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                          day.isRest ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Moon className="w-4 h-4 text-neutral-400" />
                          Dia de Descanso
                        </span>
                        {day.isRest && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>

                      {workouts.map(w => (
                        <button
                          key={w.id}
                          onClick={() => handleAssignWorkout(day.dayOfWeek, w.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                            day.workoutId === w.id ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="font-bold truncate">{w.title}</div>
                            <div className="text-[10px] opacity-70">{w.exercises.length} ex • ~{w.estimatedDurationMin}m</div>
                          </div>
                          {day.workoutId === w.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* CALENDAR GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {schedule.map(day => {
            const isToday = day.dayOfWeek === currentDayOfWeek;
            const workout = day.workoutId ? db.getWorkoutById(day.workoutId) : null;

            return (
              <div
                key={day.dayOfWeek}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[160px] ${
                  isToday 
                    ? 'bg-[#151b22] border-emerald-500 shadow-md shadow-emerald-500/10' 
                    : 'bg-[#12161c] border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">{day.dayOfWeek.substring(0, 3)}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-black">
                        Hoje
                      </span>
                    )}
                  </div>

                  {day.isRest ? (
                    <div className="my-3 flex flex-col items-center justify-center text-center p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-400">
                      <Moon className="w-5 h-5 mb-1 opacity-60" />
                      <span className="text-xs font-medium">Descanso</span>
                    </div>
                  ) : (
                    <div className="my-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                      <div className="text-xs font-bold text-white line-clamp-2">{workout?.title || day.notes}</div>
                      <div className="text-[10px] text-emerald-400 font-medium mt-1">
                        {workout ? `${workout.exercises.length} exercícios` : ''}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleRest(day.dayOfWeek)}
                    className="text-[11px] text-neutral-400 hover:text-white"
                  >
                    {day.isRest ? 'Ativar' : 'Pausar'}
                  </button>

                  {!day.isRest && workout && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewWorkout(workout)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition-colors"
                        title="Visualizar cards dos exercícios deste treino"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onStartWorkout(workout)}
                        className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
                        title="Iniciar treino agora"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showExportModal && (
        <WeeklyScheduleExportModal
          schedule={schedule}
          user={db.getCurrentUser()}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* WORKOUT PREVIEW MODAL */}
      {previewWorkout && (
        <WorkoutPreviewModal
          workout={previewWorkout}
          onClose={() => setPreviewWorkout(null)}
          onStartWorkout={onStartWorkout}
        />
      )}
    </div>
  );
}
