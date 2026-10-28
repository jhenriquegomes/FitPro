import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Workout, Exercise, ActiveWorkoutState, WorkoutHistoryItem, SetType, FavoriteCategory } from '../types';
import { db } from '../services/db';
import { soundService } from '../services/sound';
import { getGeminiCoachTip } from '../services/geminiCoach';
import { getSafeImageUrl } from '../services/imageUtils';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { OneRepMaxCalculatorModal } from './OneRepMaxCalculatorModal';
import { MuscleHighlightSvg } from './MuscleHighlightSvg';
import { WorkoutPreviewModal } from './WorkoutPreviewModal';
import { 
  Play, 
  Pause, 
  Check, 
  Plus, 
  Minus, 
  Clock, 
  Flame, 
  Dumbbell, 
  X, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Flag,
  Sparkles,
  Eye,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Search,
  MoreVertical,
  CheckCircle2,
  Maximize2,
  Star,
  Calendar,
  Layers
} from 'lucide-react';

interface WorkoutExecutionModalProps {
  workout: Workout;
  onClose: () => void;
  onFinishWorkout: (historyItem: WorkoutHistoryItem) => void;
  onViewExerciseDetails?: (exercise: Exercise) => void;
}

export function WorkoutExecutionModal({
  workout,
  onClose,
  onFinishWorkout,
  onViewExerciseDetails
}: WorkoutExecutionModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize active workout state
  const [activeState, setActiveState] = useState<ActiveWorkoutState>(() => {
    const exercises = workout.exercises.map(item => {
      const prevData = db.getPreviousExercisePerformance(item.exerciseId);
      const exData = db.getExerciseById(item.exerciseId);

      const sets = Array.from({ length: Math.max(item.sets || 3, 1) }, (_, idx) => {
        const prevSet = prevData?.sets[idx];
        return {
          setNumber: idx + 1,
          type: (prevSet?.type || 'normal') as SetType,
          reps: prevSet?.reps || item.reps || 10,
          loadKg: prevSet?.loadKg || item.loadKg || 20,
          completed: false,
          previousLoadKg: prevSet?.loadKg,
          previousReps: prevSet?.reps
        };
      });

      return {
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName || exData?.name || 'Exercício',
        primaryMuscle: exData?.primaryMuscle || 'Peito',
        targetSets: item.sets || sets.length,
        targetReps: item.reps || 10,
        targetLoadKg: item.loadKg || 20,
        restSec: item.restTimeSec || 60,
        notes: item.notes || '',
        sets
      };
    });

    return {
      workoutId: workout.id,
      workoutTitle: workout.title || 'Treino Livre',
      startedAt: Date.now(),
      elapsedSeconds: 0,
      isPaused: false,
      hasStarted: false, // Só dá andamento ao treino quando o usuário iniciar / der play
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exercises,
      restTimer: {
        isActive: false,
        remainingSec: 0,
        totalSec: 60
      }
    };
  });

  // Modals state
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [oneRmCalcData, setOneRmCalcData] = useState<{ weight: number; reps: number; name: string; exIdx: number; setIdx: number } | null>(null);
  const [showAddExerciseDrawer, setShowAddExerciseDrawer] = useState(false);
  const [showFavoritesLoader, setShowFavoritesLoader] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [fullRestModalOpen, setFullRestModalOpen] = useState(false);
  const [loadActionToast, setLoadActionToast] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Reconstructed Workout object for previewing cards in mobile sheet
  const currentPreviewWorkout: Workout = useMemo(() => {
    return {
      id: activeState.workoutId || workout.id,
      userId: workout.userId || 'user-1',
      title: activeState.workoutTitle,
      description: workout.description || 'Exercícios da sessão atual',
      category: workout.category || 'Personalizado',
      estimatedDurationMin: workout.estimatedDurationMin || 45,
      createdAt: workout.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exercises: activeState.exercises.map((item, idx) => ({
        id: `prev-${idx}-${item.exerciseId}`,
        order: idx + 1,
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        sets: item.sets.length,
        reps: item.targetReps || 10,
        loadKg: item.targetLoadKg || 20,
        restTimeSec: item.restSec || 60,
        notes: item.notes
      }))
    };
  }, [activeState.workoutId, activeState.workoutTitle, activeState.exercises, workout]);

  // Scheduled today workout and favorite categories
  const todayWorkoutInfo = useMemo(() => db.getScheduledWorkoutForToday(), []);
  const favoriteCategoryNames = useMemo(() => db.getFavoriteCategoryNames(), []);

  // Gemini coach tip per exercise
  const [aiCoachTip, setAiCoachTip] = useState<string>('Mantenha o foco na execução e controle a cadência em cada repetição.');
  const [isLoadingCoachTip, setIsLoadingCoachTip] = useState(false);

  const currentEx = activeState.exercises[activeState.currentExerciseIndex];
  const currentExData = currentEx ? db.getExerciseById(currentEx.exerciseId) : null;

  // Master Elapsed Workout Timer — Only runs when hasStarted is true and not paused!
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveState(prev => {
        if (!prev.hasStarted || prev.isPaused) return prev;
        return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Play button handler to start workout timer
  const handleStartWorkoutTimer = () => {
    setActiveState(prev => ({
      ...prev,
      hasStarted: true,
      isPaused: false,
      startedAt: prev.hasStarted ? prev.startedAt : Date.now()
    }));
    soundService.playWorkoutStarted();
    setLoadActionToast('⚡ Treino iniciado! O cronômetro está rodando.');
    setTimeout(() => setLoadActionToast(null), 3500);
  };

  // Load exercises from Favorites into Treino Livre
  const handleLoadFavorites = (category?: FavoriteCategory) => {
    const workoutFromFav = db.createWorkoutFromFavorites(category);
    if (!workoutFromFav || workoutFromFav.exercises.length === 0) {
      const catLabel = category ? `na categoria ${favoriteCategoryNames[category]}` : 'nos seus favoritos';
      alert(`Nenhum exercício encontrado ${catLabel}. Adicione favoritos primeiro tocando na estrela dos exercícios.`);
      return;
    }

    const newExercises = workoutFromFav.exercises.map(item => {
      const prevData = db.getPreviousExercisePerformance(item.exerciseId);
      const exData = db.getExerciseById(item.exerciseId);
      const sets = Array.from({ length: Math.max(item.sets || 3, 1) }, (_, idx) => {
        const prevSet = prevData?.sets[idx];
        return {
          setNumber: idx + 1,
          type: 'normal' as SetType,
          reps: prevSet?.reps || item.reps || 10,
          loadKg: prevSet?.loadKg || item.loadKg || 20,
          completed: false,
          previousLoadKg: prevSet?.loadKg,
          previousReps: prevSet?.reps
        };
      });

      return {
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName || exData?.name || 'Exercício',
        primaryMuscle: exData?.primaryMuscle || 'Peito',
        targetSets: item.sets || sets.length,
        targetReps: item.reps || 10,
        targetLoadKg: item.loadKg || 20,
        restSec: item.restTimeSec || 60,
        notes: item.notes || '',
        sets
      };
    });

    setActiveState(prev => ({
      ...prev,
      workoutTitle: workoutFromFav.title,
      exercises: newExercises,
      currentExerciseIndex: 0,
      currentSetIndex: 0
    }));

    setShowFavoritesLoader(false);
    setLoadActionToast(`⭐ ${newExercises.length} exercícios de "${workoutFromFav.title}" carregados! Clique em DAR PLAY para iniciar o tempo.`);
    setTimeout(() => setLoadActionToast(null), 4500);
  };

  // Load today's scheduled workout into Treino Livre
  const handleLoadTodayWorkout = () => {
    const todayWorkout = db.createWorkoutFromTodaySchedule();
    if (!todayWorkout || todayWorkout.exercises.length === 0) {
      alert(`Hoje (${todayWorkoutInfo.dayName}) não há exercícios agendados na rotina semanal.`);
      return;
    }

    const newExercises = todayWorkout.exercises.map(item => {
      const prevData = db.getPreviousExercisePerformance(item.exerciseId);
      const exData = db.getExerciseById(item.exerciseId);
      const sets = Array.from({ length: Math.max(item.sets || 3, 1) }, (_, idx) => {
        const prevSet = prevData?.sets[idx];
        return {
          setNumber: idx + 1,
          type: 'normal' as SetType,
          reps: prevSet?.reps || item.reps || 10,
          loadKg: prevSet?.loadKg || item.loadKg || 20,
          completed: false,
          previousLoadKg: prevSet?.loadKg,
          previousReps: prevSet?.reps
        };
      });

      return {
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName || exData?.name || 'Exercício',
        primaryMuscle: exData?.primaryMuscle || 'Peito',
        targetSets: item.sets || sets.length,
        targetReps: item.reps || 10,
        targetLoadKg: item.loadKg || 20,
        restSec: item.restTimeSec || 60,
        notes: item.notes || '',
        sets
      };
    });

    setActiveState(prev => ({
      ...prev,
      workoutTitle: todayWorkout.title,
      exercises: newExercises,
      currentExerciseIndex: 0,
      currentSetIndex: 0
    }));

    setLoadActionToast(`📅 Treino de Hoje "${todayWorkout.title}" carregado (${newExercises.length} exercícios)! Clique em DAR PLAY para iniciar o tempo.`);
    setTimeout(() => setLoadActionToast(null), 4500);
  };

  // Rest Timer countdown
  useEffect(() => {
    let restInterval: NodeJS.Timeout | null = null;
    if (activeState.restTimer.isActive && activeState.restTimer.remainingSec > 0) {
      restInterval = setInterval(() => {
        setActiveState(prev => {
          if (!prev.restTimer.isActive) return prev;
          if (prev.restTimer.remainingSec <= 1) {
            soundService.playRestFinished();
            return {
              ...prev,
              restTimer: { ...prev.restTimer, isActive: false, remainingSec: 0 }
            };
          }
          if (prev.restTimer.remainingSec <= 4) {
            soundService.playBeep(440, 0.08);
          }
          return {
            ...prev,
            restTimer: { ...prev.restTimer, remainingSec: prev.restTimer.remainingSec - 1 }
          };
        });
      }, 1000);
    }
    return () => {
      if (restInterval) clearInterval(restInterval);
    };
  }, [activeState.restTimer.isActive, activeState.restTimer.remainingSec]);

  // Fetch coach tip when exercise changes
  const fetchGeminiTip = async () => {
    if (!currentEx) return;
    setIsLoadingCoachTip(true);
    try {
      const tip = await getGeminiCoachTip({
        exerciseName: currentEx.exerciseName,
        primaryMuscle: currentEx.primaryMuscle,
        currentSet: 1,
        targetReps: currentEx.targetReps,
        loadKg: currentEx.targetLoadKg,
        userGoal: db.getCurrentUser().goal,
        level: db.getCurrentUser().experienceLevel,
      });
      setAiCoachTip(tip);
    } catch {
      setAiCoachTip('Mantenha a postura alinhada e realize a descida com controle total.');
    } finally {
      setIsLoadingCoachTip(false);
    }
  };

  useEffect(() => {
    if (currentEx) {
      fetchGeminiTip();
    }
  }, [activeState.currentExerciseIndex]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle set completion (Signature Lyfta dynamic)
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const isNowCompleted = !activeState.exercises[exIdx].sets[setIdx].completed;

    if (isNowCompleted) {
      soundService.playBeep(880, 0.15);
    }

    setActiveState(prev => {
      const nextExs = [...prev.exercises];
      const curEx = { ...nextExs[exIdx] };
      const curSets = [...curEx.sets];

      curSets[setIdx] = {
        ...curSets[setIdx],
        completed: isNowCompleted
      };
      curEx.sets = curSets;
      nextExs[exIdx] = curEx;

      // Automatically trigger Lyfta rest timer if completed
      const restTime = curEx.restSec || 60;
      const shouldTriggerRest = isNowCompleted;

      return {
        ...prev,
        hasStarted: true,
        exercises: nextExs,
        currentExerciseIndex: exIdx,
        currentSetIndex: setIdx,
        restTimer: shouldTriggerRest
          ? { isActive: true, remainingSec: restTime, totalSec: restTime }
          : prev.restTimer
      };
    });
  };

  // Update set values
  const handleUpdateSetValue = (exIdx: number, setIdx: number, field: 'loadKg' | 'reps', value: number) => {
    setActiveState(prev => {
      const nextExs = [...prev.exercises];
      const curEx = { ...nextExs[exIdx] };
      const curSets = [...curEx.sets];

      curSets[setIdx] = {
        ...curSets[setIdx],
        [field]: Math.max(0, value)
      };
      curEx.sets = curSets;
      nextExs[exIdx] = curEx;
      return { ...prev, exercises: nextExs };
    });
  };

  // Cycle set type: normal -> warmup -> dropset -> failure
  const handleCycleSetType = (exIdx: number, setIdx: number) => {
    const types: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];
    setActiveState(prev => {
      const nextExs = [...prev.exercises];
      const curEx = { ...nextExs[exIdx] };
      const curSets = [...curEx.sets];
      const currentType = curSets[setIdx].type || 'normal';
      const nextType = types[(types.indexOf(currentType) + 1) % types.length];

      curSets[setIdx] = {
        ...curSets[setIdx],
        type: nextType
      };
      curEx.sets = curSets;
      nextExs[exIdx] = curEx;
      return { ...prev, exercises: nextExs };
    });
  };

  // Add set to exercise
  const handleAddSet = (exIdx: number) => {
    setActiveState(prev => {
      const nextExs = [...prev.exercises];
      const curEx = { ...nextExs[exIdx] };
      const lastSet = curEx.sets[curEx.sets.length - 1];

      const newSet = {
        setNumber: curEx.sets.length + 1,
        type: 'normal' as SetType,
        reps: lastSet ? lastSet.reps : curEx.targetReps || 10,
        loadKg: lastSet ? lastSet.loadKg : curEx.targetLoadKg || 20,
        completed: false,
        previousLoadKg: lastSet?.previousLoadKg,
        previousReps: lastSet?.previousReps
      };

      curEx.sets = [...curEx.sets, newSet];
      nextExs[exIdx] = curEx;
      return { ...prev, exercises: nextExs };
    });
  };

  // Remove set from exercise
  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setActiveState(prev => {
      const nextExs = [...prev.exercises];
      const curEx = { ...nextExs[exIdx] };
      if (curEx.sets.length <= 1) return prev;

      curEx.sets = curEx.sets
        .filter((_, idx) => idx !== setIdx)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      nextExs[exIdx] = curEx;
      return { ...prev, exercises: nextExs };
    });
  };

  // Add new exercise to active workout
  const handleAddExerciseToWorkout = (exercise: Exercise) => {
    const prevData = db.getPreviousExercisePerformance(exercise.id);
    const sets = Array.from({ length: exercise.recommendedSets || 3 }, (_, idx) => {
      const prevSet = prevData?.sets[idx];
      return {
        setNumber: idx + 1,
        type: 'normal' as SetType,
        reps: prevSet?.reps || 10,
        loadKg: prevSet?.loadKg || 20,
        completed: false,
        previousLoadKg: prevSet?.loadKg,
        previousReps: prevSet?.reps
      };
    });

    const newEx = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      targetSets: exercise.recommendedSets || 3,
      targetReps: 10,
      targetLoadKg: 20,
      restSec: exercise.recommendedRestSec || 60,
      notes: '',
      sets
    };

    setActiveState(prev => ({
      ...prev,
      exercises: [...prev.exercises, newEx],
      currentExerciseIndex: prev.exercises.length
    }));
    setShowAddExerciseDrawer(false);
  };

  // Remove exercise from workout
  const handleRemoveExercise = (exIdx: number) => {
    if (activeState.exercises.length <= 1) {
      alert('O treino deve ter pelo menos 1 exercício.');
      return;
    }
    if (confirm('Deseja remover este exercício do treino atual?')) {
      setActiveState(prev => {
        const nextExs = prev.exercises.filter((_, idx) => idx !== exIdx);
        return {
          ...prev,
          exercises: nextExs,
          currentExerciseIndex: Math.max(0, Math.min(prev.currentExerciseIndex, nextExs.length - 1))
        };
      });
    }
  };

  // Total volume and sets calculation
  const totalVolumeKg = useMemo(() => {
    return activeState.exercises.reduce((acc, ex) => {
      return acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.reps * s.loadKg), 0);
    }, 0);
  }, [activeState.exercises]);

  const totalCompletedSets = useMemo(() => {
    return activeState.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  }, [activeState.exercises]);

  const totalSetsOverall = useMemo(() => {
    return activeState.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }, [activeState.exercises]);

  // Finalize workout
  const handleFinalizeWorkout = () => {
    const performedLogs = activeState.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      primaryMuscle: ex.primaryMuscle,
      sets: ex.sets.map(s => ({
        setNumber: s.setNumber,
        type: s.type,
        reps: s.reps,
        loadKg: s.loadKg,
        completed: s.completed
      }))
    }));

    const totalRepsCompleted = activeState.exercises.reduce((acc, ex) => {
      return acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + s.reps, 0);
    }, 0);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const { item } = db.recordCompletedWorkout({
      workoutId: workout.id,
      workoutTitle: activeState.workoutTitle,
      date: todayStr,
      startTime: '07:00',
      endTime: timeStr,
      durationSeconds: Math.max(activeState.elapsedSeconds, 1),
      totalExercises: activeState.exercises.length,
      totalSets: totalCompletedSets,
      totalReps: totalRepsCompleted,
      totalVolumeKg: totalVolumeKg,
      estimatedCalories: Math.round((Math.max(activeState.elapsedSeconds, 1) / 60) * 8.5) || 50,
      exercisesLog: performedLogs
    });

    onFinishWorkout(item);
  };

  // Available exercises for adding to workout
  const allLibraryExercises = db.getExercises();
  const filteredLibraryExercises = useMemo(() => {
    if (!exerciseSearchQuery.trim()) return allLibraryExercises.slice(0, 30);
    const q = exerciseSearchQuery.toLowerCase();
    return allLibraryExercises.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.primaryMuscle.toLowerCase().includes(q) ||
      (e.equipment && e.equipment.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [exerciseSearchQuery, allLibraryExercises]);

  return (
    <div 
      id="lyfta-workout-execution-screen"
      className="fixed inset-0 z-50 bg-[#070a0f] text-white flex flex-col justify-between overflow-hidden"
    >
      {/* LYFTA TOP BAR: Live Stats, Timer & Controls */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 py-2.5 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (confirm('Deseja realmente sair do treino em andamento? O progresso será descartado.')) {
                onClose();
              }
            }}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Cancelar e sair"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">
                Lyfta Workout Log
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-sm sm:text-base font-black text-white truncate max-w-[125px] sm:max-w-xs">
                {activeState.workoutTitle}
              </h2>
              {activeState.exercises.length > 0 && (
                <button
                  type="button"
                  id="btn-header-view-cards"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Visualizar cards dos exercícios no smartphone"
                >
                  <Eye className="w-3 h-3" />
                  <span>Cards</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Metrics Ticker (Tempo, Volume, Séries) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Elapsed Timer / Play Button */}
          <div className="flex items-center gap-1.5">
            {!activeState.hasStarted ? (
              <button
                type="button"
                id="btn-header-play-timer"
                onClick={handleStartWorkoutTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer animate-pulse"
                title="Dar Play para iniciar o cronômetro do treino"
              >
                <Play className="w-3.5 h-3.5 fill-black stroke-black" />
                <span>DAR PLAY</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <Clock className={`w-3.5 h-3.5 ${activeState.isPaused ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="text-xs sm:text-sm font-mono font-black text-white">
                  {formatTime(activeState.elapsedSeconds)}
                </span>
              </div>
            )}
          </div>

          {/* Volume Ticker */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Volume:</span>
            <span className="text-xs font-mono font-black text-cyan-400">
              {totalVolumeKg.toLocaleString('pt-BR')} kg
            </span>
          </div>

          {/* Sets Ticker */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Séries:</span>
            <span className="text-xs font-mono font-black text-emerald-400">
              {totalCompletedSets}/{totalSetsOverall}
            </span>
          </div>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              if (!activeState.hasStarted) {
                handleStartWorkoutTimer();
              } else {
                setActiveState(prev => ({ ...prev, isPaused: !prev.isPaused }));
              }
            }}
            className={`p-2 rounded-xl border transition-colors ${
              !activeState.hasStarted
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : activeState.isPaused 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={!activeState.hasStarted ? 'Iniciar treino' : activeState.isPaused ? 'Continuar treino' : 'Pausar treino'}
          >
            {!activeState.hasStarted || activeState.isPaused ? (
              <Play className="w-4 h-4 fill-current" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundService.setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors hidden lg:block"
            title={soundEnabled ? 'Desativar som' : 'Ativar som'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Finalize Button */}
          <button
            id="btn-finalize-workout"
            onClick={handleFinalizeWorkout}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Flag className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">FINALIZAR</span>
          </button>
        </div>
      </header>

      {/* Progress Strip */}
      <div className="w-full bg-slate-900 h-1">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 transition-all duration-300"
          style={{ width: `${Math.round((totalCompletedSets / Math.max(totalSetsOverall, 1)) * 100)}%` }}
        />
      </div>

      {/* Load Action Toast Message */}
      {loadActionToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2.5 text-xs text-emerald-300 font-bold flex items-center justify-between animate-in slide-in-from-top-1 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{loadActionToast}</span>
          </div>
          <button onClick={() => setLoadActionToast(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pre-Start Workout Banner — Only active until user starts / gives play! */}
      {!activeState.hasStarted && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-[#0e1622] to-cyan-950/70 border-b border-emerald-500/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-emerald-400 ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">Treino Pronto para Iniciar</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Cronômetro Parado
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                O cronômetro e as séries só contam após dar o Play no treino.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeState.exercises.length > 0 && (
              <button
                type="button"
                id="btn-preview-workout-banner"
                onClick={() => setShowPreviewModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Visualizar cards detalhados dos exercícios no smartphone"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Visualizar Treino ({activeState.exercises.length})</span>
              </button>
            )}

            <button
              id="btn-start-play-banner"
              onClick={handleStartWorkoutTimer}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-black font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black stroke-black" />
              <span>DAR PLAY (INICIAR TEMPO)</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Load Treino Livre Toolbar (Favoritos & Treino Agendado do Dia) */}
      <div className="bg-[#0b0f17] border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Carregar:</span>
        </span>

        {/* Botão Treino dos Favoritos */}
        <button
          type="button"
          id="btn-load-favorites-toolbar"
          onClick={() => setShowFavoritesLoader(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Carregar exercícios dos favoritos ou categorias Favorito A, B, C, D"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Treino dos Favoritos</span>
        </button>

        {/* Botão Treino Agendado para o Dia */}
        <button
          type="button"
          id="btn-load-today-schedule-toolbar"
          onClick={handleLoadTodayWorkout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
          title={`Carregar treino agendado para hoje (${todayWorkoutInfo.dayName})`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Treino do Dia ({todayWorkoutInfo.dayName}
            {todayWorkoutInfo.workout ? ` — ${todayWorkoutInfo.workout.title}` : ' — Descanso'})
          </span>
        </button>

        {/* Botão Visualizar Cards do Treino */}
        {activeState.exercises.length > 0 && (
          <button
            type="button"
            id="btn-preview-cards-toolbar"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Visualizar cards dos exercícios em formato smartphone"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Visualizar Treino</span>
          </button>
        )}

        {/* Botão + Exercício */}
        <button
          type="button"
          onClick={() => setShowAddExerciseDrawer(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-bold transition-colors ml-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Exercício</span>
        </button>
      </div>

      {/* EXERCISE CHIP CAROUSEL (Lyfta Quick Switcher) */}
      <div className="bg-[#0a0e16] border-b border-slate-800/80 px-4 py-2 overflow-x-auto flex items-center gap-2 scrollbar-none">
        {activeState.exercises.map((ex, idx) => {
          const isCurrent = idx === activeState.currentExerciseIndex;
          const completedCount = ex.sets.filter(s => s.completed).length;
          const isAllDone = completedCount === ex.sets.length && ex.sets.length > 0;

          return (
            <button
              key={idx}
              onClick={() => setActiveState(prev => ({ ...prev, currentExerciseIndex: idx }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isCurrent 
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                  : isAllDone
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black font-mono bg-black/40">
                {idx + 1}
              </span>
              <span className="truncate max-w-[120px]">{ex.exerciseName}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${isAllDone ? 'bg-emerald-500 text-black font-black' : 'bg-slate-800 text-slate-300'}`}>
                {completedCount}/{ex.sets.length}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setShowAddExerciseDrawer(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-dashed border-slate-700 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 whitespace-nowrap transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Exercício</span>
        </button>
      </div>

      {/* MAIN WORKOUT STAGE (Current Exercise View & Sets Table) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-5 pb-32">
        {currentEx ? (
          <div className="space-y-4">
            {/* Exercise Header Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0d121c] border border-cyan-500/20 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {/* Photo thumbnail */}
                  <div
                    onClick={() => {
                      if (currentExData && onViewExerciseDetails) {
                        onViewExerciseDetails(currentExData);
                      }
                    }}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-cyan-400 cursor-pointer group shrink-0 transition-all shadow-md bg-neutral-900 flex items-center justify-center"
                    title="Ver foto de execução"
                  >
                    {currentExData?.imageUrl ? (
                      <img 
                        src={getSafeImageUrl(currentExData.imageUrl)} 
                        alt={currentEx.exerciseName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Dumbbell className="w-7 h-7 text-neutral-600" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center text-cyan-400">
                      <Eye className="w-4 h-4 drop-shadow" />
                    </div>
                  </div>

                  {/* Anatomical Muscle Diagram Thumbnail */}
                  <div
                    onClick={() => {
                      if (currentExData && onViewExerciseDetails) {
                        onViewExerciseDetails(currentExData);
                      }
                    }}
                    className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-emerald-400 cursor-pointer group shrink-0 transition-all shadow-md bg-neutral-900 flex items-center justify-center p-1"
                    title="Ver desenho anatômico do músculo trabalhado"
                  >
                    <MuscleHighlightSvg
                      primaryMuscle={(currentEx.primaryMuscle || 'Peito') as any}
                      className="w-full h-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {currentEx.primaryMuscle}
                      </span>
                      {currentExData?.equipment && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          • {currentExData.equipment}
                        </span>
                      )}
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-white mt-1 leading-tight">
                      {currentEx.exerciseName}
                    </h1>
                  </div>
                </div>

                {/* Exercise Options / Remove */}
                <button
                  onClick={() => handleRemoveExercise(activeState.currentExerciseIndex)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-800 transition-colors"
                  title="Remover este exercício do treino"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lyfta Dynamic Tool Shortcuts: Plate Calculator & 1RM Calculator */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setPlateCalcWeight(currentEx.sets[0]?.loadKg || 60)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Calculadora de Anilhas da Barra"
                >
                  <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Calculadora de Anilhas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstSet = currentEx.sets[0];
                    setOneRmCalcData({
                      weight: firstSet?.loadKg || 80,
                      reps: firstSet?.reps || 8,
                      name: currentEx.exerciseName,
                      exIdx: activeState.currentExerciseIndex,
                      setIdx: 0
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Calculadora de 1RM e Força Máxima"
                >
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Calculadora 1RM</span>
                </button>

                {currentExData && onViewExerciseDetails && (
                  <button
                    type="button"
                    onClick={() => onViewExerciseDetails(currentExData)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Como Fazer</span>
                  </button>
                )}
              </div>

              {/* Gemini Coach Tip */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#0c1422] to-[#0a101b] border border-cyan-500/25 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-cyan-400">
                    <span>Dica Técnica do Treinador</span>
                    <button 
                      onClick={fetchGeminiTip} 
                      disabled={isLoadingCoachTip}
                      className="text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCoachTip ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {isLoadingCoachTip ? 'Carregando instrução...' : aiCoachTip}
                  </p>
                </div>
              </div>
            </div>

            {/* LYFTA SETS TABLE */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0d121c] border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Registro de Séries (Lyfta Tracker)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Clique no tipo (1, W, D, F) para alterar
                </span>
              </div>

              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
                <div className="col-span-2 text-center">SÉRIE</div>
                <div className="col-span-3 text-center">ANTERIOR</div>
                <div className="col-span-3 text-center">KG</div>
                <div className="col-span-2 text-center">REPS</div>
                <div className="col-span-2 text-center">✓ FEITO</div>
              </div>

              {/* Set Rows */}
              <div className="space-y-2">
                {currentEx.sets.map((set, sIdx) => {
                  const setType = set.type || 'normal';
                  const typeLabel = setType === 'warmup' ? 'W' : setType === 'dropset' ? 'D' : setType === 'failure' ? 'F' : set.setNumber;
                  const typeBadgeClass = setType === 'warmup'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : setType === 'dropset'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : setType === 'failure'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-200 border-slate-700';

                  return (
                    <div
                      key={sIdx}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl border transition-all ${
                        set.completed
                          ? 'bg-emerald-950/25 border-emerald-500/40'
                          : 'bg-[#121824] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Column 1: SÉRIE / Set Type (Click to cycle) */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleCycleSetType(activeState.currentExerciseIndex, sIdx)}
                          className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center border shadow-sm transition-transform active:scale-95 ${typeBadgeClass}`}
                          title="Clique para alternar: Normal, Aquecimento (W), Drop set (D), Até a Falha (F)"
                        >
                          {typeLabel}
                        </button>
                      </div>

                      {/* Column 2: ANTERIOR (Previous performance) */}
                      <div className="col-span-3 text-center">
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          {set.previousLoadKg !== undefined && set.previousReps !== undefined
                            ? `${set.previousLoadKg}kg × ${set.previousReps}`
                            : '—'}
                        </span>
                      </div>

                      {/* Column 3: KG Input with quick steppers */}
                      <div className="col-span-3 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateSetValue(activeState.currentExerciseIndex, sIdx, 'loadKg', Math.max(0, set.loadKg - 2.5))}
                          className="w-5 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold hidden sm:flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={set.loadKg}
                          onChange={e => handleUpdateSetValue(activeState.currentExerciseIndex, sIdx, 'loadKg', Number(e.target.value) || 0)}
                          className="w-14 py-1 text-center font-mono font-black text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSetValue(activeState.currentExerciseIndex, sIdx, 'loadKg', set.loadKg + 2.5)}
                          className="w-5 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold hidden sm:flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Column 4: REPS Input */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min={1}
                          max={99}
                          value={set.reps}
                          onChange={e => handleUpdateSetValue(activeState.currentExerciseIndex, sIdx, 'reps', Number(e.target.value) || 0)}
                          className="w-12 py-1 text-center font-mono font-black text-sm bg-slate-900 border border-slate-700 rounded-xl text-cyan-400 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Column 5: CHECKMARK BUTTON (Signature Lyfta Action) */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSetComplete(activeState.currentExerciseIndex, sIdx)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold transition-all active:scale-90 ${
                            set.completed
                              ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/30'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-cyan-400 hover:text-white'
                          }`}
                          title="Marcar série como concluída"
                        >
                          <Check className={`w-5 h-5 stroke-[3] ${set.completed ? 'animate-in zoom-in-75' : ''}`} />
                        </button>

                        {currentEx.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(activeState.currentExerciseIndex, sIdx)}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors hidden sm:block"
                            title="Excluir série"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Set Button */}
              <button
                type="button"
                onClick={() => handleAddSet(activeState.currentExerciseIndex)}
                className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Série</span>
              </button>
            </div>

            {/* Exercise Navigation Arrows */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveState(prev => ({
                  ...prev,
                  currentExerciseIndex: Math.max(0, prev.currentExerciseIndex - 1)
                }))}
                disabled={activeState.currentExerciseIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="text-xs text-slate-500 font-mono">
                {activeState.currentExerciseIndex + 1} de {activeState.exercises.length}
              </span>

              <button
                onClick={() => setActiveState(prev => ({
                  ...prev,
                  currentExerciseIndex: Math.min(prev.exercises.length - 1, prev.currentExerciseIndex + 1)
                }))}
                disabled={activeState.currentExerciseIndex === activeState.exercises.length - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-8 max-w-xl mx-auto space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <Dumbbell className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Sessão de Treino Livre</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Carregue o treino agendado para hoje, selecione uma categoria dos seus favoritos ou monte seu treino na hora.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 text-left">
              {/* Option 1: Treino Agendado do Dia */}
              <div 
                onClick={handleLoadTodayWorkout}
                className="p-4 rounded-2xl bg-[#0e1420] border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Agendado Hoje</span>
                      <span className="text-[10px] text-slate-500">• {todayWorkoutInfo.dayName}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {todayWorkoutInfo.workout ? todayWorkoutInfo.workout.title : 'Dia de Descanso Ativo'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {todayWorkoutInfo.workout ? `${todayWorkoutInfo.workout.exercises.length} exercícios programados` : 'Nenhum treino fixo hoje'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs group-hover:bg-cyan-400 transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  Carregar
                </button>
              </div>

              {/* Option 2: Treino dos Favoritos */}
              <div 
                onClick={() => setShowFavoritesLoader(true)}
                className="p-4 rounded-2xl bg-[#0e1420] border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Meus Favoritos</span>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      Treino dos Favoritos (A, B, C, D)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Escolha uma categoria ou todos os {db.getFavoriteExercises().length} favoritos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-amber-400 text-black font-black text-xs group-hover:bg-amber-300 transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  Escolher
                </button>
              </div>

              {/* Option 3: Montar Livremente */}
              <div 
                onClick={() => setShowAddExerciseDrawer(true)}
                className="p-4 rounded-2xl bg-[#0e1420] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Manual</span>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Adicionar Exercícios Avulsos
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pesquise entre os 876 exercícios do catálogo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs group-hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* LYFTA FLOATING DOCKED REST TIMER (Signature Experience) */}
      {activeState.restTimer.isActive && (
        <aside 
          id="lyfta-docked-rest-bar"
          aria-label="Temporizador de descanso em andamento"
          className="fixed bottom-3 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 p-3 rounded-2xl bg-[#0d131f]/95 backdrop-blur-xl border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4"
        >
          {/* Rest Progress & Countdown */}
          <div 
            onClick={() => setFullRestModalOpen(true)}
            className="flex items-center gap-3 cursor-pointer group flex-1"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-800"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-cyan-400 transition-all duration-1000 ease-linear"
                  strokeDasharray={`${(activeState.restTimer.remainingSec / Math.max(activeState.restTimer.totalSec, 1)) * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Clock className="w-4 h-4 text-cyan-400 absolute animate-pulse" />
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <span>Descanso</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Toque para expandir</span>
              </div>
              <div className="text-lg font-mono font-black text-white leading-none">
                {formatTime(activeState.restTimer.remainingSec)}
              </div>
            </div>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveState(prev => ({
                ...prev,
                restTimer: {
                  ...prev.restTimer,
                  remainingSec: Math.max(0, prev.restTimer.remainingSec - 15)
                }
              }))}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
            >
              -15s
            </button>
            <button
              onClick={() => setActiveState(prev => ({
                ...prev,
                restTimer: {
                  ...prev.restTimer,
                  remainingSec: prev.restTimer.remainingSec + 30,
                  totalSec: prev.restTimer.totalSec + 30
                }
              }))}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
            >
              +30s
            </button>
            <button
              onClick={() => setActiveState(prev => ({
                ...prev,
                restTimer: { ...prev.restTimer, isActive: false, remainingSec: 0 }
              }))}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] shadow-sm transition-all"
            >
              Pular ▶
            </button>
          </div>
        </aside>
      )}

      {/* FULL REST TIMER MODAL (Expandable) */}
      {fullRestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#0d121c] border border-cyan-500/30 rounded-3xl p-6 text-center space-y-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Temporizador Lyfta
              </span>
              <button onClick={() => setFullRestModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Countdown Ring */}
            <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-cyan-400 transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - activeState.restTimer.remainingSec / Math.max(activeState.restTimer.totalSec, 1))}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-mono font-black text-white">
                  {formatTime(activeState.restTimer.remainingSec)}
                </span>
                <span className="text-xs text-slate-400 uppercase mt-1">Respire Fundo</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveState(prev => ({
                  ...prev,
                  restTimer: { ...prev.restTimer, remainingSec: prev.restTimer.remainingSec + 30, totalSec: prev.restTimer.totalSec + 30 }
                }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
              >
                +30s
              </button>
              <button
                onClick={() => {
                  setActiveState(prev => ({ ...prev, restTimer: { ...prev.restTimer, isActive: false, remainingSec: 0 } }));
                  setFullRestModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs"
              >
                Pronto / Pular ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EXERCISE TO ACTIVE WORKOUT DRAWER */}
      {showAddExerciseDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full sm:max-w-lg bg-[#0d121c] border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Adicionar Exercício ao Treino</h3>
              </div>
              <button
                onClick={() => setShowAddExerciseDrawer(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, músculo ou equipamento..."
                value={exerciseSearchQuery}
                onChange={e => setExerciseSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredLibraryExercises.map(ex => (
                <div
                  key={ex.id}
                  onClick={() => handleAddExerciseToWorkout(ex)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    {ex.imageUrl && (
                      <img 
                        src={getSafeImageUrl(ex.imageUrl)} 
                        alt={ex.name} 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-800" 
                      />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">{ex.name}</div>
                      <div className="text-[10px] text-slate-400">{ex.primaryMuscle} • {ex.equipment}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/30">
                    + Adicionar
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLATE CALCULATOR MODAL */}
      <PlateCalculatorModal
        isOpen={plateCalcWeight !== null}
        onClose={() => setPlateCalcWeight(null)}
        initialWeight={plateCalcWeight || 60}
        onApplyWeight={newWeight => {
          if (currentEx) {
            handleUpdateSetValue(activeState.currentExerciseIndex, 0, 'loadKg', newWeight);
          }
        }}
      />

      {/* 1RM CALCULATOR MODAL */}
      {oneRmCalcData && (
        <OneRepMaxCalculatorModal
          isOpen={true}
          onClose={() => setOneRmCalcData(null)}
          initialWeight={oneRmCalcData.weight}
          initialReps={oneRmCalcData.reps}
          exerciseName={oneRmCalcData.name}
          onApplyLoad={loadKg => {
            handleUpdateSetValue(oneRmCalcData.exIdx, oneRmCalcData.setIdx, 'loadKg', loadKg);
          }}
        />
      )}

      {/* CARREGAR TREINO DOS FAVORITOS MODAL */}
      {showFavoritesLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0f141c] border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Treino dos Favoritos</h3>
                  <p className="text-xs text-slate-400">Escolha qual categoria carregar</p>
                </div>
              </div>
              <button
                onClick={() => setShowFavoritesLoader(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {(['A', 'B', 'C', 'D'] as FavoriteCategory[]).map(cat => {
                const catExercises = db.getFavoriteExercises(cat);
                const catName = favoriteCategoryNames[cat] || `Favorito ${cat}`;

                return (
                  <div
                    key={cat}
                    className="p-3.5 rounded-2xl bg-[#141924] border border-slate-800/80 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-sm flex items-center justify-center border border-amber-500/30">
                        {cat}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{catName}</h4>
                        <p className="text-[11px] text-slate-400">
                          {catExercises.length > 0
                            ? `${catExercises.length} exercícios favoritados`
                            : 'Nenhum exercício nesta categoria'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={catExercises.length === 0}
                      onClick={() => handleLoadFavorites(cat)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 text-black font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-black stroke-black" />
                      <span>Carregar</span>
                    </button>
                  </div>
                );
              })}

              {/* Option to load all favorites */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3 pt-3 mt-1">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Todos os Favoritos</h4>
                  <p className="text-[11px] text-slate-400">
                    {db.getFavoriteExercises().length} exercícios favoritados no total
                  </p>
                </div>
                <button
                  type="button"
                  disabled={db.getFavoriteExercises().length === 0}
                  onClick={() => handleLoadFavorites()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-black font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-black stroke-black" />
                  <span>Carregar Todos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-First Workout Preview Sheet (Cards Visualizer) */}
      {showPreviewModal && (
        <WorkoutPreviewModal
          workout={currentPreviewWorkout}
          onClose={() => setShowPreviewModal(false)}
          onStartWorkout={() => {
            setShowPreviewModal(false);
            if (!activeState.hasStarted) {
              handleStartWorkoutTimer();
            }
          }}
        />
      )}
    </div>
  );
}
