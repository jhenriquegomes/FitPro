import { Workout, WeeklyScheduleDay, Exercise, FitnessGoal, ExerciseLevel, TrainingLocation, EquipmentType, WorkoutExerciseItem } from '../types';

export function generateCustomRoutine(params: {
  userId: string;
  goal: FitnessGoal;
  level: ExerciseLevel;
  daysPerWeek: number;
  location: TrainingLocation;
  availableExercises: Exercise[];
  splitType?: 'full_body' | 'ppl' | 'classic' | 'upper_lower';
  selectedEquipment?: EquipmentType[];
}): { workouts: Workout[]; schedule: WeeklyScheduleDay[] } {
  const { userId, goal, level, daysPerWeek, location, availableExercises, splitType, selectedEquipment } = params;

  // Filter exercises appropriate for location and equipment
  const isHome = location === 'Em casa';
  const isOutdoor = location === 'Parque / Ar livre' || location === 'Box / Funcional';

  const matchesEquipment = (ex: Exercise) => {
    if (selectedEquipment && selectedEquipment.length > 0) {
      if (selectedEquipment.includes(ex.equipment) || ex.equipment === 'Peso corporal') {
        return true;
      }
      return false;
    }
    return true;
  };

  const matchesLocation = (ex: Exercise) => {
    if (!matchesEquipment(ex)) return false;
    if (isOutdoor) {
      return ex.equipment === 'Peso corporal' || ex.equipment === 'Elásticos' || ex.equipment === 'Cardio/Esteira';
    }
    if (isHome) {
      return ex.equipment === 'Peso corporal' || ex.equipment === 'Halteres' || ex.equipment === 'Barra' || ex.equipment === 'Elásticos';
    }
    return true; // Academia has everything
  };

  const pool = availableExercises.filter(matchesLocation);
  const effectivePool = pool.length >= 8 ? pool : availableExercises;

  const getExercise = (muscle: string) => {
    const fromPool = effectivePool.find(e => e.primaryMuscle === muscle);
    if (fromPool) return fromPool;
    const anyMatching = availableExercises.find(e => e.primaryMuscle === muscle);
    return anyMatching || availableExercises[0];
  };

  const setsCount = level === 'Iniciante' ? 3 : 4;
  const repsTarget = goal === 'Força' ? 6 : goal === 'Emagrecimento' ? 15 : 10;
  const restSec = goal === 'Força' ? 120 : goal === 'Emagrecimento' ? 45 : 60;

  const buildWorkout = (title: string, category: string, muscles: string[], durationMin: number): Workout => {
    const workoutId = `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const exerciseItems: WorkoutExerciseItem[] = [];

    muscles.forEach((muscle) => {
      const candidates = effectivePool.filter(e => e.primaryMuscle === muscle);
      const chosen = candidates.length > 0 ? candidates.slice(0, 2) : [getExercise(muscle)];

      chosen.forEach(ex => {
        // avoid duplicates in same workout
        if (exerciseItems.some(i => i.exerciseId === ex.id)) return;
        exerciseItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: setsCount,
          reps: repsTarget,
          loadKg: level === 'Iniciante' ? 10 : 20,
          restTimeSec: restSec,
          order: exerciseItems.length + 1
        });
      });
    });

    return {
      id: workoutId,
      userId,
      title,
      description: `Rotina personalizada de ${category.toLowerCase()} elaborada pelo Treinador IA FitPro (${splitType === 'full_body' ? 'Treino Full Body' : 'Divisão Personalizada'}) para ${daysPerWeek} dias semanais.`,
      category,
      exercises: exerciseItems,
      estimatedDurationMin: durationMin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false
    };
  };

  const workouts: Workout[] = [];
  const schedule: WeeklyScheduleDay[] = [];

  // FULL BODY ROUTINE GENERATOR
  if (splitType === 'full_body') {
    if (daysPerWeek <= 2) {
      const w1 = buildWorkout('Treino A — Full Body (Pernas, Peito, Ombros, Abdômen)', 'Hipertrofia', ['Pernas', 'Peito', 'Ombros', 'Abdômen'], 55);
      const w2 = buildWorkout('Treino B — Full Body (Glúteos, Costas, Braços, Core)', 'Hipertrofia', ['Glúteos', 'Costas', 'Bíceps', 'Tríceps', 'Abdômen'], 55);
      workouts.push(w1, w2);

      schedule.push(
        { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
        { dayOfWeek: 'TERÇA', workoutId: null, isRest: true, notes: 'Descanso e Recuperação' },
        { dayOfWeek: 'QUARTA', workoutId: null, isRest: true, notes: 'Descanso e Recuperação' },
        { dayOfWeek: 'QUINTA', workoutId: w2.id, isRest: false, notes: w2.title },
        { dayOfWeek: 'SEXTA', workoutId: null, isRest: true, notes: 'Descanso e Recuperação' },
        { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso' },
        { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
      );
    } else if (daysPerWeek === 3) {
      const w1 = buildWorkout('Treino A — Full Body (Agachamento, Supino, Remada, Core)', 'Hipertrofia', ['Pernas', 'Peito', 'Costas', 'Abdômen'], 55);
      const w2 = buildWorkout('Treino B — Full Body (Terra/Posterior, Ombros, Braços)', 'Hipertrofia', ['Glúteos', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps'], 55);
      const w3 = buildWorkout('Treino C — Full Body (Volume, Metabólico & Funcional)', 'Hipertrofia', ['Peito', 'Costas', 'Pernas', 'Ombros', 'Abdômen'], 55);
      workouts.push(w1, w2, w3);

      schedule.push(
        { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
        { dayOfWeek: 'TERÇA', workoutId: null, isRest: true, notes: 'Recuperação Muscular' },
        { dayOfWeek: 'QUARTA', workoutId: w2.id, isRest: false, notes: w2.title },
        { dayOfWeek: 'QUINTA', workoutId: null, isRest: true, notes: 'Recuperação Muscular' },
        { dayOfWeek: 'SEXTA', workoutId: w3.id, isRest: false, notes: w3.title },
        { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso Ativo' },
        { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
      );
    } else {
      // 4 or more days Full Body (Upper/Lower Bias Full Body rotation)
      const w1 = buildWorkout('Treino A — Full Body (Foco Quadríceps & Empurrar)', 'Hipertrofia', ['Pernas', 'Peito', 'Ombros', 'Tríceps', 'Abdômen'], 50);
      const w2 = buildWorkout('Treino B — Full Body (Foco Posterior & Puxar)', 'Hipertrofia', ['Glúteos', 'Costas', 'Bíceps', 'Panturrilhas'], 50);
      const w3 = buildWorkout('Treino C — Full Body (Foco Carga & Compostos)', 'Hipertrofia', ['Pernas', 'Peito', 'Costas', 'Abdômen'], 50);
      const w4 = buildWorkout('Treino D — Full Body (Foco Isolação & Core)', 'Hipertrofia', ['Ombros', 'Bíceps', 'Tríceps', 'Glúteos', 'Abdômen'], 50);
      workouts.push(w1, w2, w3, w4);

      schedule.push(
        { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
        { dayOfWeek: 'TERÇA', workoutId: w2.id, isRest: false, notes: w2.title },
        { dayOfWeek: 'QUARTA', workoutId: null, isRest: true, notes: 'Descanso' },
        { dayOfWeek: 'QUINTA', workoutId: w3.id, isRest: false, notes: w3.title },
        { dayOfWeek: 'SEXTA', workoutId: w4.id, isRest: false, notes: w4.title },
        { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso' },
        { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
      );
    }

    return { workouts, schedule };
  }

  // DEFAULT / STANDARD SPLITS (PPL, ABCD, etc.)
  if (daysPerWeek <= 2) {
    const w1 = buildWorkout('Treino A — Superior Completo', 'Hipertrofia', ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'], 55);
    const w2 = buildWorkout('Treino B — Inferior e Core', 'Hipertrofia', ['Pernas', 'Glúteos', 'Panturrilhas', 'Abdômen'], 50);
    workouts.push(w1, w2);

    schedule.push(
      { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
      { dayOfWeek: 'TERÇA', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'QUARTA', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'QUINTA', workoutId: w2.id, isRest: false, notes: w2.title },
      { dayOfWeek: 'SEXTA', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
    );
  } else if (daysPerWeek === 3) {
    const w1 = buildWorkout('Treino A — Empurrar (Peito, Ombro, Tríceps)', 'Hipertrofia', ['Peito', 'Ombros', 'Tríceps'], 50);
    const w2 = buildWorkout('Treino B — Puxar (Costas, Bíceps e Abdômen)', 'Hipertrofia', ['Costas', 'Bíceps', 'Abdômen'], 50);
    const w3 = buildWorkout('Treino C — Pernas e Glúteos', 'Hipertrofia', ['Pernas', 'Glúteos', 'Panturrilhas'], 55);
    workouts.push(w1, w2, w3);

    schedule.push(
      { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
      { dayOfWeek: 'TERÇA', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'QUARTA', workoutId: w2.id, isRest: false, notes: w2.title },
      { dayOfWeek: 'QUINTA', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'SEXTA', workoutId: w3.id, isRest: false, notes: w3.title },
      { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
    );
  } else if (daysPerWeek === 5) {
    const w1 = buildWorkout('Treino A — Peitoral e Tríceps', 'Hipertrofia', ['Peito', 'Tríceps'], 45);
    const w2 = buildWorkout('Treino B — Costas e Bíceps', 'Hipertrofia', ['Costas', 'Bíceps'], 45);
    const w3 = buildWorkout('Treino C — Quadríceps e Panturrilhas', 'Hipertrofia', ['Pernas', 'Panturrilhas'], 50);
    const w4 = buildWorkout('Treino D — Ombros e Abdômen', 'Hipertrofia', ['Ombros', 'Abdômen'], 40);
    const w5 = buildWorkout('Treino E — Isquiotibiais, Glúteos & Cardio', 'Condicionamento', ['Glúteos', 'Cardio'], 45);
    workouts.push(w1, w2, w3, w4, w5);

    schedule.push(
      { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
      { dayOfWeek: 'TERÇA', workoutId: w2.id, isRest: false, notes: w2.title },
      { dayOfWeek: 'QUARTA', workoutId: w3.id, isRest: false, notes: w3.title },
      { dayOfWeek: 'QUINTA', workoutId: w4.id, isRest: false, notes: w4.title },
      { dayOfWeek: 'SEXTA', workoutId: w5.id, isRest: false, notes: w5.title },
      { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
    );
  } else {
    // 4 days (ABCD)
    const w1 = buildWorkout('Treino A — Peito e Tríceps', 'Hipertrofia', ['Peito', 'Tríceps'], 50);
    const w2 = buildWorkout('Treino B — Costas e Bíceps', 'Hipertrofia', ['Costas', 'Bíceps'], 50);
    const w3 = buildWorkout('Treino C — Pernas e Glúteos', 'Hipertrofia', ['Pernas', 'Glúteos', 'Panturrilhas'], 55);
    const w4 = buildWorkout('Treino D — Ombros e Abdômen', 'Hipertrofia', ['Ombros', 'Abdômen'], 45);
    workouts.push(w1, w2, w3, w4);

    schedule.push(
      { dayOfWeek: 'SEGUNDA', workoutId: w1.id, isRest: false, notes: w1.title },
      { dayOfWeek: 'TERÇA', workoutId: w2.id, isRest: false, notes: w2.title },
      { dayOfWeek: 'QUARTA', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'QUINTA', workoutId: w3.id, isRest: false, notes: w3.title },
      { dayOfWeek: 'SEXTA', workoutId: w4.id, isRest: false, notes: w4.title },
      { dayOfWeek: 'SÁBADO', workoutId: null, isRest: true, notes: 'Descanso' },
      { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' }
    );
  }

  return { workouts, schedule };
}
