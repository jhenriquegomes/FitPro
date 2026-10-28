import React, { useState } from 'react';
import { db } from '../services/db';
import { Workout, DayOfWeek } from '../types';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { WeeklyScheduleExportModal } from '../components/WeeklyScheduleExportModal';
import { PlateCalculatorModal } from '../components/PlateCalculatorModal';
import { OneRepMaxCalculatorModal } from '../components/OneRepMaxCalculatorModal';
import { MuscleRecoveryWidget } from '../components/MuscleRecoveryWidget';
import { WorkoutExerciseCard } from '../components/WorkoutExerciseCard';
import { WorkoutPreviewModal } from '../components/WorkoutPreviewModal';
import { 
  Play, 
  Flame, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Dumbbell, 
  ArrowRight, 
  Sparkles, 
  Award, 
  ChevronRight, 
  Moon, 
  FileText, 
  Bell, 
  Plus, 
  Calculator,
  Eye
} from 'lucide-react';

interface DashboardViewProps {
  onStartWorkout: (workout: Workout) => void;
  onStartEmptyWorkout?: () => void;
  onNavigateTab: (tab: 'workouts' | 'exercises' | 'evolution' | 'profile' | 'gemini') => void;
  onOpenGenerator: () => void;
  onOpenExerciseDetails: (exerciseId: string) => void;
  onOpenReminders?: () => void;
}

const DAYS_ORDER: DayOfWeek[] = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];

export function DashboardView({
  onStartWorkout,
  onStartEmptyWorkout,
  onNavigateTab,
  onOpenGenerator,
  onOpenExerciseDetails,
  onOpenReminders
}: DashboardViewProps) {
  const currentUser = db.getCurrentUser();
  const workouts = db.getWorkouts();
  const weeklySchedule = db.getWeeklySchedule();
  const history = db.getHistory();
  const records = db.getRecords();
  const [showWeeklyExportModal, setShowWeeklyExportModal] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [showOneRmModal, setShowOneRmModal] = useState(false);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);

  // Find today's day of week
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const currentDayOfWeek = DAYS_ORDER[todayIndex];
  const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === currentDayOfWeek);

  // Today's workout
  const todaysWorkout = todaySchedule?.workoutId 
    ? db.getWorkoutById(todaySchedule.workoutId) 
    : null;

  // Next workout
  const nextWorkoutDay = weeklySchedule.find((s, idx) => idx > todayIndex && !s.isRest && s.workoutId) 
    || weeklySchedule.find(s => !s.isRest && s.workoutId);
  const nextWorkout = nextWorkoutDay?.workoutId ? db.getWorkoutById(nextWorkoutDay.workoutId) : workouts[0];

  // Latest completed workout
  const lastCompletedWorkout = history[0];

  // Weekly stats
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
  const recentHistory = history.filter(h => new Date(h.date + 'T12:00:00') >= oneWeekAgo);

  const workoutsThisWeek = recentHistory.length;
  const totalDurationSec = history.reduce((acc, h) => acc + h.durationSeconds, 0);
  const totalDurationHours = (totalDurationSec / 3600).toFixed(1);
  const totalExercisesDone = history.reduce((acc, h) => acc + h.totalExercises, 0);

  // Quick workout launcher if today has no workout
  const primaryActionWorkout = todaysWorkout || workouts[0];

  return (
    <div id="dashboard-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Hero Greeting */}
      <section className="relative overflow-hidden rounded-3xl bg-radial from-[#18231f] via-[#12171e] to-[#0c0f13] border border-neutral-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-extrabold uppercase tracking-widest text-emerald-400">
                FitPro Dashboard
              </span>
              {currentUser.streakDays > 0 && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {currentUser.streakDays} dias seguidos
                  </span>
                </>
              )}

              {/* Botão de Dica do Gemini no início */}
              <button
                id="btn-gemini-tips-header"
                onClick={() => onNavigateTab('gemini')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                title="Acessar Dicas e Consultoria com Gemini"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Dica do Gemini</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Olá, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 font-medium">
              Pronto para o seu treino de hoje?
            </p>

            {todaysWorkout ? (
              <div className="text-xs text-neutral-400 flex items-center gap-2 pt-1 font-mono">
                <span>Treino: <strong className="text-emerald-400 font-sans">{todaysWorkout.title}</strong></span>
                <span>·</span>
                <span>{todaysWorkout.exercises.length} exercícios</span>
                <span>·</span>
                <span>~{todaysWorkout.estimatedDurationMin} min</span>
              </div>
            ) : (
              <div className="text-xs text-neutral-400 flex items-center gap-2 pt-1">
                <span>Hoje é dia de <strong className="text-neutral-300">Descanso e Recuperação</strong></span>
              </div>
            )}

            {onOpenReminders && (
              <button
                onClick={onOpenReminders}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/70 text-xs font-semibold text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Configurar horário do lembrete diário de treino"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lembrete agendado para às {db.getSettings().notifications?.reminderTime || '18:30'}</span>
              </button>
            )}
          </div>

          {/* Action Buttons: Big "INICIAR TREINO", "+ TREINO LIVRE" (Lyfta Dynamic), & Tools */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {primaryActionWorkout && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="btn-start-workout-hero"
                  onClick={() => onStartWorkout(primaryActionWorkout)}
                  className="group relative self-start sm:self-auto px-7 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-base sm:text-lg tracking-wide shadow-xl shadow-emerald-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 shrink-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                  <span>INICIAR TREINO</span>
                </button>

                <button
                  id="btn-preview-workout-hero"
                  onClick={() => setPreviewWorkout(primaryActionWorkout)}
                  className="px-4 py-3 rounded-2xl bg-black/60 hover:bg-neutral-800 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                  title="Visualizar cards dos exercícios que você irá fazer"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Ver Cards</span>
                </button>
              </div>
            )}

            {/* Lyfta's Signature Start Empty Workout Button */}
            {onStartEmptyWorkout && (
              <button
                id="btn-start-empty-workout"
                onClick={onStartEmptyWorkout}
                className="px-5 py-3 rounded-2xl bg-[#141b29] hover:bg-[#1a2335] text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                title="Iniciar um treino livre vazio do zero (Estilo Lyfta)"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>+ INICIAR TREINO LIVRE</span>
              </button>
            )}

            {/* Lyfta Quick Tools Chips: Plate Calculator & 1RM */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlateModal(true)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Calculadora de Anilhas da Barra"
              >
                <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                <span>Anilhas</span>
              </button>

              <button
                onClick={() => setShowOneRmModal(true)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Calculadora de 1RM e Força"
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>1RM Força</span>
              </button>
            </div>
          </div>
        </div>

        {/* Área de Gerar Treino Integrada no Início */}
        <div className="relative z-10 mt-6 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-neutral-800/70">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">
                  Área de Gerar Treino com IA
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Automático
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                Crie um planejamento completo personalizado para seu objetivo, equipamentos e dias disponíveis.
              </p>
            </div>
          </div>

          <button
            id="btn-generate-workout-hero"
            onClick={onOpenGenerator}
            className="self-stretch sm:self-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>GERAR MEU TREINO</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </section>

      {/* 4 Core Metric KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase font-bold tracking-wider">Tempo Treinado</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {totalDurationHours} <span className="text-xs font-normal text-neutral-400">horas</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Tempo total acumulado</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase font-bold tracking-wider">Treinos na Semana</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {workoutsThisWeek} <span className="text-xs font-normal text-neutral-400">/ {currentUser.daysPerWeek}</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Meta: {currentUser.daysPerWeek} dias/semana</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase font-bold tracking-wider">Sequência Atual</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {currentUser.streakDays} <span className="text-xs font-normal text-neutral-400">dias</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Consistência de treino</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase font-bold tracking-wider">Exercícios Feitos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {totalExercisesDone}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Em {history.length} sessões</div>
          </div>
        </div>
      </section>

      {/* Lyfta Muscle Recovery Widget */}
      <MuscleRecoveryWidget />

      {/* Resumed Weekly Mini-Calendar */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Calendário Semanal
            </h2>
            <span className="text-xs text-neutral-400">Resumo da sua programação para os 7 dias</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              id="btn-dashboard-weekly-export"
              onClick={() => setShowWeeklyExportModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-colors shadow-xs"
              title="Ver treino da semana em PDF e em Foto para exportar e compartilhar"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF & Foto</span>
            </button>
            <button
              onClick={() => onNavigateTab('workouts')}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              Editar Semana
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeklySchedule.map(day => {
            const isToday = day.dayOfWeek === currentDayOfWeek;
            const workout = day.workoutId ? db.getWorkoutById(day.workoutId) : null;

            return (
              <div
                key={day.dayOfWeek}
                onClick={() => {
                  if (workout) onStartWorkout(workout);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isToday 
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10' 
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider block ${isToday ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {day.dayOfWeek.substring(0, 3)}
                </span>

                <div className="my-2 flex items-center justify-center">
                  {day.isRest ? (
                    <Moon className="w-5 h-5 text-neutral-600" />
                  ) : (
                    <Dumbbell className={`w-5 h-5 ${isToday ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  )}
                </div>

                <div className="text-[10px] font-semibold text-neutral-300 truncate">
                  {day.isRest ? 'Descanso' : workout?.title?.split('—')[1] || workout?.title || 'Treino'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workout Contexts: Today, Next & Last Completed */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Scheduled Workout Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Próximo Treino Agendado
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-emerald-400">
              {nextWorkoutDay?.dayOfWeek || 'Rotina'}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black text-white">
              {nextWorkout?.title}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {nextWorkout?.description || `${nextWorkout?.exercises.length} exercícios focados`}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              {nextWorkout?.exercises.length} exercícios
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              ~{nextWorkout?.estimatedDurationMin} min
            </span>
          </div>

          {nextWorkout && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewWorkout(nextWorkout)}
                className="py-2.5 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Visualizar cards dos exercícios deste treino"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Cards</span>
              </button>

              <button
                onClick={() => onStartWorkout(nextWorkout)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Iniciar Este Treino</span>
              </button>
            </div>
          )}
        </div>

        {/* Last Completed Workout */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Último Treino Realizado
            </span>
            {lastCompletedWorkout && (
              <span className="text-xs text-neutral-400 font-mono">
                {lastCompletedWorkout.date}
              </span>
            )}
          </div>

          {lastCompletedWorkout ? (
            <>
              <div>
                <h3 className="text-xl font-black text-white">
                  {lastCompletedWorkout.workoutTitle}
                </h3>
                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                  <span>⏱ {Math.round(lastCompletedWorkout.durationSeconds / 60)} min</span>
                  <span>•</span>
                  <span>🏋️ {lastCompletedWorkout.totalSets} séries</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-bold">⚡ {lastCompletedWorkout.totalVolumeKg}kg volume</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <span className="text-xs text-neutral-400">
                  🔥 ~{lastCompletedWorkout.estimatedCalories} kcal estimadas
                </span>
                <button
                  onClick={() => onNavigateTab('evolution')}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Ver Histórico Completo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-neutral-400 text-xs">
              Nenhum treino concluído ainda. Inicie seu primeiro treino acima!
            </div>
          )}
        </div>
      </section>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="card" />

      {/* Weekly Schedule Export Modal (PDF & Foto) */}
      {showWeeklyExportModal && (
        <WeeklyScheduleExportModal
          schedule={weeklySchedule}
          user={currentUser}
          onClose={() => setShowWeeklyExportModal(false)}
        />
      )}

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={showPlateModal}
        onClose={() => setShowPlateModal(false)}
        initialWeight={60}
      />

      {/* 1RM Calculator Modal */}
      <OneRepMaxCalculatorModal
        isOpen={showOneRmModal}
        onClose={() => setShowOneRmModal(false)}
        initialWeight={80}
        initialReps={8}
      />

      {/* Workout Preview with full exercise cards */}
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
