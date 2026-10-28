export type AppLanguage = 'pt-br' | 'en';

export type MuscleGroup = 
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Pernas'
  | 'Glúteos'
  | 'Abdômen'
  | 'Panturrilhas'
  | 'Cardio'
  | 'Corpo inteiro';

export type EquipmentType = 
  | 'Halteres'
  | 'Barra'
  | 'Máquinas'
  | 'Cabos'
  | 'Peso corporal'
  | 'Kettlebell'
  | 'Elásticos'
  | 'Cardio/Esteira';

export type ExerciseLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export type ExerciseType = 'Hipertrofia' | 'Força' | 'Resistência' | 'Mobilidade' | 'Cardio';

export type FitnessGoal = 
  | 'Ganho de massa muscular'
  | 'Emagrecimento'
  | 'Força'
  | 'Condicionamento físico'
  | 'Saúde e qualidade de vida';

export type TrainingLocation = 'Academia' | 'Em casa' | 'Parque / Ar livre' | 'Box / Funcional';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  isPro: boolean;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  goal: FitnessGoal;
  experienceLevel: ExerciseLevel;
  daysPerWeek: number;
  trainingLocation: TrainingLocation;
  availableEquipment: EquipmentType[];
  createdAt: string;
  streakDays: number;
  lastWorkoutDate?: string;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  autoRestTimer?: boolean;
  unitSystem?: 'metric' | 'imperial';
  language?: AppLanguage;
  authProvider?: 'email' | 'google';
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  level: ExerciseLevel;
  type: ExerciseType;
  imageUrl: string;
  videoUrl?: string;
  executionSteps: string[];
  initialPosition: string;
  movement: string;
  breathing: string;
  commonMistakes: string[];
  executionTips: string[];
  recommendedSets: number;
  recommendedReps: string; // e.g. "8-12" or "10-15"
  recommendedRestSec: number;
  isFavorite?: boolean;
  favoriteCategory?: FavoriteCategory;
  source?: 'system' | 'google' | 'gemini' | 'catalog';
  sourceUrl?: string;
}

export type FavoriteCategory = 'A' | 'B' | 'C' | 'D';

export interface WorkoutExerciseItem {
  id: string;
  exerciseId: string;
  exerciseName?: string;
  sets: number;
  reps: number;
  loadKg: number;
  executionTimeSec?: number;
  restTimeSec: number;
  notes?: string;
  order: number;
}

export type WorkoutExercise = WorkoutExerciseItem;

export interface Workout {
  id: string;
  userId: string;
  title: string; // e.g. "Treino A — Peito e Tríceps"
  description?: string;
  category?: string;
  exercises: WorkoutExerciseItem[];
  estimatedDurationMin: number;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export type DayOfWeek = 
  | 'SEGUNDA'
  | 'TERÇA'
  | 'QUARTA'
  | 'QUINTA'
  | 'SEXTA'
  | 'SÁBADO'
  | 'DOMINGO';

export interface WeeklyScheduleDay {
  dayOfWeek: DayOfWeek;
  workoutId: string | null; // null means rest day
  isRest: boolean;
  notes?: string;
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface PerformedSet {
  setNumber: number;
  type?: SetType;
  reps: number;
  loadKg: number;
  completed: boolean;
  notes?: string;
  rpe?: number;
  previousLoadKg?: number;
  previousReps?: number;
}

export interface PerformedExerciseLog {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  sets: PerformedSet[];
}

export interface WorkoutHistoryItem {
  id: string;
  userId: string;
  workoutId?: string;
  workoutTitle: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  durationSeconds: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number; // sum of (reps * loadKg)
  estimatedCalories: number;
  exercisesLog: PerformedExerciseLog[];
  newPrs?: { exerciseName: string; loadKg: number }[];
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  maxLoadKg: number;
  repsAtMax: number;
  achievedDate: string;
  previousRecordKg?: number;
  loadKg?: number;
  date?: string;
  reps?: number;
}

export interface NotificationSettings {
  workoutReminders: boolean;
  reminderTime: string; // "18:00"
  prAlerts: boolean;
  streakReminders: boolean;
  soundEffects: boolean;
}

export interface AppSettings {
  theme: 'dark';
  notifications: NotificationSettings;
  units: 'kg' | 'lbs';
  hasCompletedOnboarding?: boolean;
  language?: AppLanguage;
  favoriteCategoryNames?: Record<FavoriteCategory, string>;
}

export type BadgeCategory = 'days' | 'streak' | 'volume' | 'records' | 'special';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  targetValue: number;
  unit: string;
  iconName: string;
}

export interface UserBadge extends BadgeDefinition {
  currentValue: number;
  progressPercentage: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface ActiveWorkoutState {
  workoutId: string;
  workoutTitle: string;
  startedAt: number; // timestamp
  elapsedSeconds: number;
  isPaused: boolean;
  hasStarted?: boolean;
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    primaryMuscle: MuscleGroup;
    targetSets: number;
    targetReps: number;
    targetLoadKg: number;
    restSec: number;
    notes?: string;
    sets: {
      setNumber: number;
      type?: SetType;
      reps: number;
      loadKg: number;
      completed: boolean;
      rpe?: number;
      previousLoadKg?: number;
      previousReps?: number;
    }[];
  }[];
  restTimer: {
    isActive: boolean;
    remainingSec: number;
    totalSec: number;
  };
}
