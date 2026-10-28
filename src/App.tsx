import { useState, useEffect } from 'react';
import { db } from './services/db';
import { Workout, WorkoutHistoryItem, Exercise } from './types';
import { DashboardView } from './views/DashboardView';
import { WorkoutsView } from './views/WorkoutsView';
import { ExerciseLibraryView } from './views/ExerciseLibraryView';
import { EvolutionHistoryView } from './views/EvolutionHistoryView';
import { ProfileView } from './views/ProfileView';
import { GeminiTipsView } from './views/GeminiTipsView';
import { ChatOnboardingView } from './components/ChatOnboardingView';
import { WorkoutExecutionModal } from './components/WorkoutExecutionModal';
import { WorkoutCompletionModal } from './components/WorkoutCompletionModal';
import { AutoWorkoutGeneratorModal } from './components/AutoWorkoutGeneratorModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { DailyReminderModal } from './components/DailyReminderModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { OneRepMaxCalculatorModal } from './components/OneRepMaxCalculatorModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LanguageSelector } from './components/LanguageSelector';
import { useTranslation } from './services/i18n';
import { getSafeImageUrl, DEFAULT_AVATAR_IMAGE } from './services/imageUtils';
import { 
  checkDailyWorkoutReminder, 
  getNotificationPermission, 
  requestNotificationPermission 
} from './services/notificationService';
import { 
  Home, 
  Dumbbell, 
  BookOpen, 
  TrendingUp, 
  User, 
  Crown, 
  Sparkles, 
  ShieldCheck,
  Flame,
  Volume2,
  VolumeX,
  MessageSquare,
  Bell,
  BellRing,
  X,
  Plus,
  Calculator
} from 'lucide-react';

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workouts' | 'gemini' | 'exercises' | 'evolution' | 'profile'>('dashboard');
  const [user, setUser] = useState(() => db.getCurrentUser());
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => db.hasCompletedOnboarding());
  const [, setDbVersion] = useState(0);

  // Active workout execution session
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

  // Post-workout celebration
  const [completedWorkoutItem, setCompletedWorkoutItem] = useState<WorkoutHistoryItem | null>(null);

  // Modals
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [showOneRmModal, setShowOneRmModal] = useState(false);
  const [reminderPermission, setReminderPermission] = useState(() => getNotificationPermission());
  const [reminderBannerDismissed, setReminderBannerDismissed] = useState(false);

  // Lyfta-style Blank Workout Launcher
  const handleStartEmptyWorkout = () => {
    const emptyWorkout: Workout = {
      id: 'workout-empty-' + Date.now(),
      userId: user.id,
      title: 'Treino Livre',
      description: 'Sessão livre criada na hora',
      exercises: [],
      estimatedDurationMin: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActiveWorkout(emptyWorkout);
  };

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setUser(db.getCurrentUser());
      setHasCompletedOnboarding(db.hasCompletedOnboarding());
      setDbVersion(v => v + 1);
    });
    return () => unsubscribe();
  }, []);

  // Daily workout reminder timer
  useEffect(() => {
    checkDailyWorkoutReminder().catch(() => {});

    const interval = setInterval(() => {
      checkDailyWorkoutReminder().catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
  };

  const handleWorkoutFinished = (historyItem: WorkoutHistoryItem) => {
    setActiveWorkout(null);
    setCompletedWorkoutItem(historyItem);
  };

  const handleOpenExerciseDetails = (exerciseId: string) => {
    const found = db.getExerciseById(exerciseId);
    if (found) {
      setInspectExercise(found);
    }
  };

  // If initial site state is zerado and onboarding is not yet completed, show conversational onboarding chat
  if (!hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-[#0a0d11]">
        <ChatOnboardingView
          onComplete={() => {
            setUser(db.getCurrentUser());
            setHasCompletedOnboarding(true);
            setActiveTab('dashboard');
          }}
          onOpenLogin={() => setShowAuth(true)}
        />
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setUser(db.getCurrentUser());
              setHasCompletedOnboarding(true);
              setShowAuth(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d11] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-[#0c0f14]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-xl tracking-tight text-white font-display">FITPRO</span>
                {user.isPro && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-black">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                {t.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1 rounded-2xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              {t.navHome}
            </button>

            <button
              onClick={() => setActiveTab('workouts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'workouts' 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              {t.navWorkouts}
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gemini' 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {t.navTips}
            </button>

            <button
              onClick={() => setActiveTab('exercises')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'exercises' 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {t.navExercises}
            </button>

            <button
              onClick={() => setActiveTab('evolution')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'evolution' 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {t.navEvolution}
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Global Language Selector (PT-BR / EN) */}
            <LanguageSelector variant="header" />

            {/* PWA In-App Install Button */}
            <PWAInstallButton variant="header" />

            {/* Daily Workout Reminder Button */}
            <button
              onClick={() => setShowReminderModal(true)}
              className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 transition-colors cursor-pointer"
              title={`Lembretes de Treino Diário (${db.getSettings().notifications?.reminderTime || '18:30'})`}
              aria-label="Configurar lembretes diários de treino"
            >
              <Bell className="w-4 h-4" />
              {db.getSettings().notifications?.workoutReminders && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
              )}
            </button>

            {/* Lyfta Barbell Plate Calculator */}
            <button
              onClick={() => setShowPlateModal(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-cyan-400 hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Calculadora de Anilhas da Barra (Lyfta)"
              aria-label="Calculadora de anilhas"
            >
              <Dumbbell className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Lyfta 1RM Calculator */}
            <button
              onClick={() => setShowOneRmModal(true)}
              className="hidden sm:flex p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-cyan-400 hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Calculadora de 1RM e Força Máxima (Lyfta)"
              aria-label="Calculadora 1RM"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Generator Quick Action */}
            <button
              onClick={() => setShowGenerator(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors"
              title={t.generateWorkout}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.generateWorkout}</span>
            </button>

            {/* Streak Counter */}
            {user.streakDays > 0 && (
              <div 
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-black"
                title={`Sequência de ${user.streakDays} dias de treinos`}
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{user.streakDays}d</span>
              </div>
            )}

            {/* Pro Upgrade Trigger */}
            <button
              onClick={() => setShowPro(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 hover:bg-neutral-800 transition-colors"
              title="FitPro PRO"
            >
              <Crown className="w-4 h-4" />
            </button>

            {/* Admin trigger if admin */}
            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(true)}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 hover:bg-neutral-800 transition-colors"
                title="Painel Administrativo"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {/* User Avatar */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 pl-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
            >
              <span className="hidden sm:inline text-xs font-semibold text-neutral-300">
                {user.name.split(' ')[0]}
              </span>
              <img
                src={getSafeImageUrl(user.avatarUrl, DEFAULT_AVATAR_IMAGE)}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-500/50"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Daily Workout Reminder Permission Banner */}
      {reminderPermission === 'default' && !reminderBannerDismissed && (
        <aside aria-label="Notificações de treino" className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <BellRing className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>
                <strong>Lembrete Diário de Treino:</strong> Deseja receber avisos no navegador no horário agendado ({db.getSettings().notifications?.reminderTime || '18:30'})?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const p = await requestNotificationPermission();
                  setReminderPermission(p);
                  if (p === 'granted') {
                    checkDailyWorkoutReminder(true);
                  }
                }}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors cursor-pointer"
              >
                Ativar Lembretes
              </button>
              <button
                type="button"
                onClick={() => setShowReminderModal(true)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
              >
                Ajustar Horário
              </button>
              <button
                type="button"
                onClick={() => setReminderBannerDismissed(true)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                title="Fechar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            onStartWorkout={handleStartWorkout}
            onStartEmptyWorkout={handleStartEmptyWorkout}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenGenerator={() => setShowGenerator(true)}
            onOpenExerciseDetails={handleOpenExerciseDetails}
            onOpenReminders={() => setShowReminderModal(true)}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            onStartWorkout={handleStartWorkout}
            onStartEmptyWorkout={handleStartEmptyWorkout}
            onOpenGenerator={() => setShowGenerator(true)}
            onOpenExerciseDetails={handleOpenExerciseDetails}
          />
        )}

        {activeTab === 'gemini' && (
          <GeminiTipsView />
        )}

        {activeTab === 'exercises' && (
          <ExerciseLibraryView
            onSelectExercise={ex => setInspectExercise(ex)}
            selectedExerciseId={inspectExercise?.id}
            onClearSelectedExercise={() => setInspectExercise(null)}
            onStartWorkout={handleStartWorkout}
          />
        )}

        {activeTab === 'evolution' && (
          <EvolutionHistoryView
            onStartWorkout={handleStartWorkout}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            onOpenAdmin={() => setShowAdmin(true)}
            onOpenPro={() => setShowPro(true)}
            onOpenAuth={() => setShowAuth(true)}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Lyfta Mobile Dock with Center Action) */}
      <nav aria-label="Navegação do Aplicativo" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e16]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
          {/* Home */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'dashboard' 
                ? 'text-cyan-400 font-extrabold bg-cyan-500/10' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">{t.navHome}</span>
          </button>

          {/* Workouts */}
          <button
            type="button"
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'workouts' 
                ? 'text-cyan-400 font-extrabold bg-cyan-500/10' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Rotinas</span>
          </button>

          {/* LYFTA CENTER FLOATING QUICK WORKOUT BUTTON */}
          <button
            type="button"
            onClick={handleStartEmptyWorkout}
            className="flex flex-col items-center justify-center -mt-5 mx-1 p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 text-black shadow-lg shadow-cyan-500/35 border-2 border-slate-900 active:scale-90 transition-transform cursor-pointer"
            title="Iniciar Treino Livre (Lyfta)"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span className="text-[9px] font-black uppercase tracking-tight">Treinar</span>
          </button>

          {/* Exercise Library */}
          <button
            type="button"
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'exercises' 
                ? 'text-cyan-400 font-extrabold bg-cyan-500/10' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Exercícios</span>
          </button>

          {/* Evolution / History */}
          <button
            type="button"
            onClick={() => setActiveTab('evolution')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'evolution' 
                ? 'text-cyan-400 font-extrabold bg-cyan-500/10' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Evolução</span>
          </button>
        </div>
      </nav>

      {/* ACTIVE WORKOUT EXECUTION MODAL (FULL SCREEN PLAYER) */}
      {activeWorkout && (
        <WorkoutExecutionModal
          workout={activeWorkout}
          onClose={() => setActiveWorkout(null)}
          onFinishWorkout={handleWorkoutFinished}
          onViewExerciseDetails={(ex) => setInspectExercise(ex)}
        />
      )}

      {/* WORKOUT COMPLETION CELEBRATION MODAL */}
      {completedWorkoutItem && (
        <WorkoutCompletionModal
          historyItem={completedWorkoutItem}
          user={user}
          onFinish={() => setCompletedWorkoutItem(null)}
        />
      )}

      {/* AUTO WORKOUT GENERATOR MODAL */}
      {showGenerator && (
        <AutoWorkoutGeneratorModal
          onClose={() => setShowGenerator(false)}
          onGenerated={() => {
            setShowGenerator(false);
            setActiveTab('workouts');
          }}
        />
      )}

      {/* EXERCISE DETAIL & EXECUTION MODAL */}
      {inspectExercise && (
        <ExerciseDetailModal
          exercise={inspectExercise}
          onClose={() => setInspectExercise(null)}
        />
      )}

      {/* ADMIN PANEL MODAL */}
      {showAdmin && (
        <AdminPanelModal
          onClose={() => setShowAdmin(false)}
          onRefreshData={() => setDbVersion(v => v + 1)}
        />
      )}

      {/* AUTHENTICATION MODAL */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setUser(db.getCurrentUser());
            setShowAuth(false);
          }}
        />
      )}

      {/* PRO UPGRADE MODAL */}
      {showPro && (
        <ProUpgradeModal
          onClose={() => setShowPro(false)}
          onUpgradeSuccess={() => {
            setUser(db.getCurrentUser());
            setShowPro(false);
          }}
        />
      )}

      {/* DAILY WORKOUT REMINDERS MODAL */}
      <DailyReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onUpdated={() => {
          setDbVersion(v => v + 1);
          setReminderPermission(getNotificationPermission());
        }}
      />

      {/* Lyfta Barbell Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={showPlateModal}
        onClose={() => setShowPlateModal(false)}
        initialWeight={60}
      />

      {/* Lyfta 1RM & Strength Calculator Modal */}
      <OneRepMaxCalculatorModal
        isOpen={showOneRmModal}
        onClose={() => setShowOneRmModal(false)}
        initialWeight={80}
        initialReps={8}
      />

      {/* Network Offline Toast */}
      <OfflineIndicator />
    </div>
  );
}
