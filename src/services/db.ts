import {
  User,
  Exercise,
  MuscleGroup,
  EquipmentType,
  Workout,
  WeeklyScheduleDay,
  WorkoutHistoryItem,
  PersonalRecord,
  AppSettings,
  AppLanguage,
  FavoriteCategory,
  DayOfWeek
} from '../types';
import {
  SEED_EXERCISES,
  DEFAULT_WORKOUTS,
  DEFAULT_WEEKLY_SCHEDULE,
  INITIAL_PRS,
  MUSCLE_GROUPS,
  EQUIPMENT_LIST
} from '../data/seedData';
import { generateCustomRoutine } from './routineGenerator';
import { findCuratedPhotoForExercise } from '../data/exercisePhotoCatalog';
import { DEFAULT_EXERCISE_IMAGE } from './imageUtils';
import { FREE_EXERCISE_DB_CATALOG } from '../data/onlineExerciseCatalog';
import { getAllFreeExerciseDb } from './freeExerciseDbService';
import { 
  validateFirestoreConnection, 
  syncUserProfileToCloud, 
  syncWorkoutToCloud, 
  syncHistoryItemToCloud, 
  syncPersonalRecordToCloud 
} from './firestoreService';

const DB_STORAGE_KEY = 'fitpro_database_v1';

export const DEFAULT_FAVORITE_CATEGORY_NAMES: Record<FavoriteCategory, string> = {
  A: 'Favorito A',
  B: 'Favorito B',
  C: 'Favorito C',
  D: 'Favorito D'
};

export interface DatabaseSchema {
  users: User[];
  currentUserId: string | null;
  exercises: Exercise[];
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  workouts: Workout[];
  weeklySchedule: WeeklyScheduleDay[];
  history: WorkoutHistoryItem[];
  records: PersonalRecord[];
  favoriteCategoryNames?: Record<FavoriteCategory, string>;
  settings: AppSettings;
  selectedWorkoutId?: string;
}

const DEFAULT_USER: User = {
  id: 'user-carlos-1',
  name: 'Carlos Silva',
  email: 'carlos@fitpro.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  role: 'user',
  isPro: true,
  age: 28,
  height: 178,
  weight: 78,
  goal: 'Ganho de massa muscular',
  experienceLevel: 'Intermediário',
  daysPerWeek: 5,
  trainingLocation: 'Academia',
  availableEquipment: ['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Peso corporal'],
  createdAt: '2026-01-15T08:00:00Z',
  streakDays: 4,
  lastWorkoutDate: '2026-03-08'
};

const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  name: 'Equipe FitPro (Admin)',
  email: 'admin@fitpro.com',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  role: 'admin',
  isPro: true,
  age: 32,
  height: 182,
  weight: 84,
  goal: 'Condicionamento físico',
  experienceLevel: 'Avançado',
  daysPerWeek: 6,
  trainingLocation: 'Academia',
  availableEquipment: ['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Kettlebell', 'Cardio/Esteira'],
  createdAt: '2026-01-01T00:00:00Z',
  streakDays: 14,
  lastWorkoutDate: '2026-03-08'
};

const DEFAULT_HISTORY: WorkoutHistoryItem[] = [
  {
    id: 'hist-1',
    userId: 'user-carlos-1',
    workoutId: 'workout-a-peito-triceps',
    workoutTitle: 'Treino A — Peito e Tríceps',
    date: '2026-03-08',
    startTime: '18:15',
    endTime: '19:07',
    durationSeconds: 3120, // 52 min
    totalExercises: 5,
    totalSets: 18,
    totalReps: 210,
    totalVolumeKg: 6420,
    estimatedCalories: 430,
    exercisesLog: [
      {
        exerciseId: 'ex-supino-reto',
        exerciseName: 'Supino Reto com Barra',
        primaryMuscle: 'Peito',
        sets: [
          { setNumber: 1, reps: 12, loadKg: 50, completed: true },
          { setNumber: 2, reps: 10, loadKg: 55, completed: true },
          { setNumber: 3, reps: 10, loadKg: 60, completed: true },
          { setNumber: 4, reps: 8, loadKg: 60, completed: true }
        ]
      },
      {
        exerciseId: 'ex-supino-inclinado-halter',
        exerciseName: 'Supino Inclinado com Halteres',
        primaryMuscle: 'Peito',
        sets: [
          { setNumber: 1, reps: 12, loadKg: 20, completed: true },
          { setNumber: 2, reps: 12, loadKg: 22, completed: true },
          { setNumber: 3, reps: 10, loadKg: 22, completed: true }
        ]
      },
      {
        exerciseId: 'ex-crossover-polia',
        exerciseName: 'Crossover na Polia Média/Alta',
        primaryMuscle: 'Peito',
        sets: [
          { setNumber: 1, reps: 15, loadKg: 15, completed: true },
          { setNumber: 2, reps: 15, loadKg: 15, completed: true },
          { setNumber: 3, reps: 12, loadKg: 15, completed: true }
        ]
      },
      {
        exerciseId: 'ex-triceps-corda',
        exerciseName: 'Tríceps Corda na Polia Alta',
        primaryMuscle: 'Tríceps',
        sets: [
          { setNumber: 1, reps: 12, loadKg: 20, completed: true },
          { setNumber: 2, reps: 12, loadKg: 25, completed: true },
          { setNumber: 3, reps: 10, loadKg: 25, completed: true }
        ]
      },
      {
        exerciseId: 'ex-triceps-testa',
        exerciseName: 'Tríceps Testa com Barra W',
        primaryMuscle: 'Tríceps',
        sets: [
          { setNumber: 1, reps: 10, loadKg: 18, completed: true },
          { setNumber: 2, reps: 10, loadKg: 20, completed: true }
        ]
      }
    ]
  },
  {
    id: 'hist-2',
    userId: 'user-carlos-1',
    workoutId: 'workout-c-pernas-panturrilhas',
    workoutTitle: 'Treino C — Pernas e Glúteos',
    date: '2026-03-06',
    startTime: '07:30',
    endTime: '08:28',
    durationSeconds: 3480, // 58 min
    totalExercises: 5,
    totalSets: 19,
    totalReps: 228,
    totalVolumeKg: 9800,
    estimatedCalories: 510,
    exercisesLog: [
      {
        exerciseId: 'ex-agachamento-livre',
        exerciseName: 'Agachamento Livre com Barra',
        primaryMuscle: 'Pernas',
        sets: [
          { setNumber: 1, reps: 10, loadKg: 60, completed: true },
          { setNumber: 2, reps: 10, loadKg: 70, completed: true },
          { setNumber: 3, reps: 8, loadKg: 80, completed: true },
          { setNumber: 4, reps: 8, loadKg: 80, completed: true }
        ]
      }
    ]
  },
  {
    id: 'hist-3',
    userId: 'user-carlos-1',
    workoutId: 'workout-b-costas-biceps',
    workoutTitle: 'Treino B — Costas e Bíceps',
    date: '2026-03-04',
    startTime: '19:00',
    endTime: '19:48',
    durationSeconds: 2880, // 48 min
    totalExercises: 4,
    totalSets: 14,
    totalReps: 160,
    totalVolumeKg: 5200,
    estimatedCalories: 380,
    exercisesLog: []
  }
];

class DatabaseService {
  private data: DatabaseSchema;
  private listeners: (() => void)[] = [];

  constructor() {
    this.data = this.loadFromStorage();
    if (typeof window !== 'undefined') {
      validateFirestoreConnection().catch(() => {});
    }
  }

  private loadFromStorage(): DatabaseSchema {
    if (typeof window === 'undefined') return this.getInitialSchema();
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.exercises)) {
          // If stored data was legacy mock data or not onboarded, start clean zerado
          if (!parsed.settings?.hasCompletedOnboarding || parsed.currentUserId === 'user-carlos-1') {
            return this.getInitialSchema();
          }

          // Purge legacy FitPro essential exercises (SEED_EXERCISES) and leave only GitHub catalog and user-created exercises
          const seedIds = new Set(SEED_EXERCISES.map(e => e.id));
          const seedNames = new Set(SEED_EXERCISES.map(e => e.name.trim().toLowerCase()));

          // Retain non-seed exercises (user custom exercises + already imported github exercises)
          const nonSeedExercises = parsed.exercises.filter((ex: Exercise) => {
            return !seedIds.has(ex.id) && !seedNames.has(ex.name.trim().toLowerCase());
          });

          // Check if GitHub catalog is present
          const hasGithub = nonSeedExercises.some((ex: Exercise) =>
            ex.id?.startsWith('fedb-') || (ex.sourceUrl && ex.sourceUrl.includes('free-exercise-db'))
          );

          if (!hasGithub || nonSeedExercises.length < 50) {
            const githubExercises = getAllFreeExerciseDb('pt-br');
            const customOnly = nonSeedExercises.filter((ex: Exercise) => !ex.id?.startsWith('fedb-'));
            parsed.exercises = [...customOnly, ...githubExercises];
          } else {
            parsed.exercises = nonSeedExercises;
          }

          if (!parsed.favoriteCategoryNames) {
            parsed.favoriteCategoryNames = { ...DEFAULT_FAVORITE_CATEGORY_NAMES };
          }
          // Ensure any favorite exercise has default category 'A' if not specified
          parsed.exercises.forEach((ex: Exercise) => {
            if (ex.isFavorite && !ex.favoriteCategory) {
              ex.favoriteCategory = 'A';
            }
          });

          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database:', e);
    }
    return this.getInitialSchema();
  }

  private getInitialSchema(): DatabaseSchema {
    return {
      users: [],
      currentUserId: null,
      exercises: getAllFreeExerciseDb('pt-br'),
      muscleGroups: [...MUSCLE_GROUPS],
      equipment: [...EQUIPMENT_LIST],
      workouts: [],
      weeklySchedule: [...DEFAULT_WEEKLY_SCHEDULE],
      history: [],
      records: [],
      favoriteCategoryNames: { ...DEFAULT_FAVORITE_CATEGORY_NAMES },
      settings: {
        theme: 'dark',
        notifications: {
          workoutReminders: true,
          reminderTime: '18:30',
          prAlerts: true,
          streakReminders: true,
          soundEffects: true
        },
        units: 'kg',
        hasCompletedOnboarding: false,
        language: 'pt-br'
      }
    };
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Raw Database Operations
  public exportDatabaseJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importDatabaseJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.exercises && parsed.workouts) {
        this.data = parsed;
        this.save();
        return true;
      }
    } catch {
      // invalid json
    }
    return false;
  }

  public resetToFactoryDefaults() {
    this.data = this.getInitialSchema();
    this.save();
  }

  // --- USERS & AUTH ---
  public hasCompletedOnboarding(): boolean {
    return !!this.data.settings?.hasCompletedOnboarding && this.data.users.length > 0 && !!this.data.currentUserId;
  }

  public getCurrentUser(): User {
    const user = this.data.users.find(u => u.id === this.data.currentUserId);
    if (user) return user;
    if (this.data.users.length > 0) return this.data.users[0];
    return {
      id: 'fresh-user',
      name: 'Novo Atleta',
      email: '',
      role: 'user',
      isPro: false,
      goal: 'Ganho de massa muscular',
      experienceLevel: 'Iniciante',
      daysPerWeek: 4,
      trainingLocation: 'Academia',
      availableEquipment: ['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Peso corporal'],
      createdAt: new Date().toISOString(),
      streakDays: 0,
      soundEnabled: true,
      vibrationEnabled: true,
      autoRestTimer: true,
      unitSystem: 'metric'
    };
  }

  public completeChatOnboarding(params: {
    name: string;
    email: string;
    avatarUrl?: string;
    goal: import('../types').FitnessGoal;
    experienceLevel: import('../types').ExerciseLevel;
    age: number;
    weight: number;
    height: number;
    trainingLocation: import('../types').TrainingLocation;
    daysPerWeek: number;
    availableEquipment?: import('../types').EquipmentType[];
    splitType?: 'full_body' | 'ppl' | 'classic' | 'upper_lower';
    authProvider?: 'email' | 'google';
  }): User {
    const userId = 'user-' + Date.now();
    const newUser: User = {
      id: userId,
      name: params.name.trim() || 'Atleta FitPro',
      email: params.email.trim() || '',
      avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      role: 'user',
      isPro: false,
      goal: params.goal,
      experienceLevel: params.experienceLevel,
      age: params.age,
      weight: params.weight,
      height: params.height,
      trainingLocation: params.trainingLocation,
      daysPerWeek: params.daysPerWeek,
      availableEquipment: params.availableEquipment || ['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Peso corporal'],
      createdAt: new Date().toISOString(),
      streakDays: 0,
      authProvider: params.authProvider || 'email',
      soundEnabled: true,
      vibrationEnabled: true,
      autoRestTimer: true,
      unitSystem: 'metric'
    };

    // Save as current user
    this.data.users = [newUser];
    this.data.currentUserId = userId;

    // Generate personalized starter workouts for their specific profile
    const { workouts, schedule } = generateCustomRoutine({
      userId,
      goal: params.goal,
      level: params.experienceLevel,
      daysPerWeek: params.daysPerWeek,
      location: params.trainingLocation,
      availableExercises: this.data.exercises,
      splitType: params.splitType || 'full_body',
      selectedEquipment: params.availableEquipment
    });

    this.data.workouts = workouts;
    this.data.weeklySchedule = schedule;

    // Inicie zerado: histórico e recordes limpos
    this.data.history = [];
    this.data.records = [];

    if (!this.data.settings) {
      this.data.settings = {
        theme: 'dark',
        notifications: {
          workoutReminders: true,
          reminderTime: '18:30',
          prAlerts: true,
          streakReminders: true,
          soundEffects: true
        },
        units: 'kg'
      };
    }
    this.data.settings.hasCompletedOnboarding = true;

    this.save();
    return newUser;
  }

  public resetToZero() {
    this.data = this.getInitialSchema();
    this.save();
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public setCurrentUser(userId: string) {
    this.data.currentUserId = userId;
    if (this.data.settings) {
      this.data.settings.hasCompletedOnboarding = true;
    }
    this.save();
  }

  public loginUser(email: string): User | null {
    const found = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.data.currentUserId = found.id;
      if (this.data.settings) {
        this.data.settings.hasCompletedOnboarding = true;
      }
      this.save();
      return found;
    }
    return null;
  }

  public registerUser(userPayload: Omit<User, 'id' | 'createdAt' | 'streakDays'>): User {
    const newUser: User = {
      ...userPayload,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString(),
      streakDays: 0,
      lastWorkoutDate: undefined
    };
    this.data.users.push(newUser);
    this.data.currentUserId = newUser.id;
    if (this.data.settings) {
      this.data.settings.hasCompletedOnboarding = true;
    }
    this.save();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User | null {
    const index = this.data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.save();
      syncUserProfileToCloud(userId, this.data.users[index]).catch(() => {});
      return this.data.users[index];
    }
    return null;
  }

  public deleteAccount(userId: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== userId);

    // If deleted user was active, switch to remaining user or create a fresh default profile
    if (this.data.currentUserId === userId) {
      if (this.data.users.length > 0) {
        this.data.currentUserId = this.data.users[0].id;
      } else {
        const freshUser: User = {
          ...DEFAULT_USER,
          id: 'user-' + Date.now(),
          name: 'Atleta FitPro',
          email: 'atleta@fitpro.com',
          createdAt: new Date().toISOString(),
          streakDays: 0,
          lastWorkoutDate: undefined
        };
        this.data.users.push(freshUser);
        this.data.currentUserId = freshUser.id;
      }
    }

    // Clean user's workouts, history, records if desired
    this.data.history = this.data.history.filter(h => h.userId !== userId);
    this.data.records = this.data.records.filter(r => r.userId !== userId);

    this.save();
    return this.data.users.length !== initialLen;
  }

  public linkGoogleAccount(googleUser: { name: string; email: string; photoUrl?: string }): User {
    // Check if user with this email already exists
    const existingIndex = this.data.users.findIndex(
      u => u.email.toLowerCase() === googleUser.email.toLowerCase()
    );

    if (existingIndex !== -1) {
      this.data.users[existingIndex] = {
        ...this.data.users[existingIndex],
        name: googleUser.name || this.data.users[existingIndex].name,
        avatarUrl: googleUser.photoUrl || this.data.users[existingIndex].avatarUrl,
        authProvider: 'google'
      };
      this.data.currentUserId = this.data.users[existingIndex].id;
      this.save();
      return this.data.users[existingIndex];
    }

    // Otherwise link with currently active user, or create new
    const current = this.getCurrentUser();
    if (current && current.role !== 'admin') {
      const updated = this.updateUser(current.id, {
        name: googleUser.name || current.name,
        email: googleUser.email,
        avatarUrl: googleUser.photoUrl || current.avatarUrl,
        authProvider: 'google'
      });
      if (updated) return updated;
    }

    // Create new profile for Google user
    const newUser: User = {
      id: 'user-google-' + Date.now(),
      name: googleUser.name,
      email: googleUser.email,
      avatarUrl: googleUser.photoUrl,
      role: 'user',
      isPro: true,
      age: 26,
      height: 175,
      weight: 75,
      goal: 'Ganho de massa muscular',
      experienceLevel: 'Intermediário',
      daysPerWeek: 4,
      trainingLocation: 'Academia',
      availableEquipment: ['Barra', 'Halteres', 'Máquinas', 'Cabos'],
      createdAt: new Date().toISOString(),
      streakDays: 1,
      lastWorkoutDate: new Date().toISOString().split('T')[0],
      authProvider: 'google'
    };
    this.data.users.push(newUser);
    this.data.currentUserId = newUser.id;
    this.save();
    return newUser;
  }

  // --- DRIVE BACKUP & RESTORE PAYLOAD ---
  public getDriveBackupPayload(): import('./googleDrive').DriveBackupPayload {
    const user = this.getCurrentUser();
    return {
      version: '1.0.0',
      appName: 'FitPro',
      exportedAt: new Date().toISOString(),
      userEmail: user.email,
      data: {
        user,
        workouts: this.data.workouts,
        weeklySchedule: this.data.weeklySchedule,
        history: this.data.history,
        records: this.data.records,
        settings: this.data.settings,
        customExercises: this.data.exercises.filter(e => e.id.startsWith('ex-custom') || e.id.startsWith('ex-1'))
      }
    };
  }

  public restoreDriveBackupPayload(payload: import('./googleDrive').DriveBackupPayload): boolean {
    try {
      if (!payload || !payload.data || !Array.isArray(payload.data.workouts)) {
        return false;
      }

      const { data } = payload;
      if (data.workouts) this.data.workouts = data.workouts as Workout[];
      if (data.weeklySchedule) this.data.weeklySchedule = data.weeklySchedule as WeeklyScheduleDay[];
      if (data.history) this.data.history = data.history as WorkoutHistoryItem[];
      if (data.records) this.data.records = data.records as PersonalRecord[];
      if (data.settings) this.data.settings = { ...this.data.settings, ...(data.settings as AppSettings) };

      if (data.user) {
        const restoredUser = data.user as User;
        const existingIdx = this.data.users.findIndex(u => u.id === restoredUser.id || u.email === restoredUser.email);
        if (existingIdx !== -1) {
          this.data.users[existingIdx] = restoredUser;
          this.data.currentUserId = restoredUser.id;
        } else {
          this.data.users.push(restoredUser);
          this.data.currentUserId = restoredUser.id;
        }
      }

      if (data.customExercises && Array.isArray(data.customExercises)) {
        const existingIds = new Set(this.data.exercises.map(e => e.id));
        for (const ex of data.customExercises as Exercise[]) {
          if (!existingIds.has(ex.id)) {
            this.data.exercises.push(ex);
          }
        }
      }

      this.save();
      return true;
    } catch (e) {
      console.error('Error restoring backup payload:', e);
      return false;
    }
  }

  // --- EXERCISES (CRUD) ---
  public getExercises(): Exercise[] {
    return this.data.exercises;
  }

  public getExerciseById(id: string): Exercise | undefined {
    return this.data.exercises.find(e => e.id === id);
  }

  public createExercise(exercise: Omit<Exercise, 'id'>): Exercise {
    const rawUrl = (exercise.imageUrl || '').trim();
    const needsImage = !rawUrl || rawUrl.includes('placeholder');
    const imageUrl = needsImage
      ? findCuratedPhotoForExercise(exercise.name, exercise.primaryMuscle) || DEFAULT_EXERCISE_IMAGE
      : rawUrl;

    const newEx: Exercise = {
      ...exercise,
      imageUrl,
      id: 'ex-' + Date.now()
    };
    this.data.exercises.unshift(newEx);
    this.save();
    return newEx;
  }

  public updateExercise(id: string, updates: Partial<Exercise>): Exercise | null {
    const index = this.data.exercises.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.exercises[index] = { ...this.data.exercises[index], ...updates };
      this.save();
      return this.data.exercises[index];
    }
    return null;
  }

  public deleteExercise(id: string): boolean {
    const prevLen = this.data.exercises.length;
    this.data.exercises = this.data.exercises.filter(e => e.id !== id);
    if (this.data.exercises.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Cleans up unneeded mass exercises that are not part of user workouts, favorites, or seed exercises.
   * Immediately frees mobile RAM and localStorage.
   */
  public cleanupUnusedExercises(): { removedCount: number; remainingCount: number } {
    const usedExerciseIds = new Set<string>();
    const usedExerciseNames = new Set<string>();

    this.data.workouts.forEach(w => {
      w.exercises?.forEach(we => {
        if (we.exerciseId) usedExerciseIds.add(we.exerciseId);
        if (we.exerciseName) usedExerciseNames.add(we.exerciseName.trim().toLowerCase());
      });
    });

    const seedIds = new Set(SEED_EXERCISES.map(e => e.id));
    const seedNames = new Set(SEED_EXERCISES.map(e => e.name.trim().toLowerCase()));

    const initialLen = this.data.exercises.length;
    this.data.exercises = this.data.exercises.filter(ex => {
      // Purge any legacy FitPro seed exercises
      if (seedIds.has(ex.id) || seedNames.has(ex.name.trim().toLowerCase())) {
        return false;
      }
      if (ex.isFavorite) return true;
      if (usedExerciseIds.has(ex.id)) return true;
      if (usedExerciseNames.has(ex.name.trim().toLowerCase())) return true;
      if (ex.id.startsWith('fedb-')) return true;
      if (ex.id.startsWith('custom-') || ex.id.startsWith('ex-custom')) return true;
      return true;
    });

    const removedCount = initialLen - this.data.exercises.length;
    if (removedCount > 0) {
      this.save();
    }
    return { removedCount, remainingCount: this.data.exercises.length };
  }

  public isExerciseInLibrary(name: string): boolean {
    const clean = name.trim().toLowerCase();
    return this.data.exercises.some(e => e.name.trim().toLowerCase() === clean);
  }

  public bulkImportExercises(newExercises: Exercise[]): { added: number; updated: number; importedIds: string[] } {
    let added = 0;
    let updated = 0;
    const importedIds: string[] = [];

    // Build fast lookup maps
    const idMap = new Map<string, number>();
    const nameMap = new Map<string, number>();
    this.data.exercises.forEach((ex, idx) => {
      if (ex.id) idMap.set(ex.id, idx);
      nameMap.set(ex.name.trim().toLowerCase(), idx);
    });

    const toAppend: Exercise[] = [];

    for (let idx = 0; idx < newExercises.length; idx++) {
      const newEx = newExercises[idx];
      const cleanName = newEx.name.trim().toLowerCase();
      const existingIdx = (newEx.id && idMap.has(newEx.id))
        ? idMap.get(newEx.id)!
        : (nameMap.has(cleanName) ? nameMap.get(cleanName)! : -1);

      const rawUrl = (newEx.imageUrl || '').trim();
      const needsImage = !rawUrl || rawUrl.includes('placeholder');
      const resolvedImageUrl = needsImage
        ? findCuratedPhotoForExercise(newEx.name, newEx.primaryMuscle) || (existingIdx !== -1 ? this.data.exercises[existingIdx]?.imageUrl : null) || DEFAULT_EXERCISE_IMAGE
        : rawUrl;

      const exerciseWithImage: Exercise = {
        ...newEx,
        imageUrl: resolvedImageUrl
      };

      if (existingIdx !== -1) {
        this.data.exercises[existingIdx] = {
          ...this.data.exercises[existingIdx],
          ...exerciseWithImage,
          id: this.data.exercises[existingIdx].id
        };
        importedIds.push(this.data.exercises[existingIdx].id);
        updated++;
      } else {
        const id = newEx.id || `fedb-${Date.now()}-${idx}`;
        const preparedExercise: Exercise = {
          ...exerciseWithImage,
          id
        };
        toAppend.push(preparedExercise);
        importedIds.push(id);
        idMap.set(id, this.data.exercises.length + toAppend.length - 1);
        nameMap.set(cleanName, this.data.exercises.length + toAppend.length - 1);
        added++;
      }
    }

    if (toAppend.length > 0) {
      this.data.exercises.push(...toAppend);
    }

    this.save();
    return { added, updated, importedIds };
  }

  public importExercises(newExercises: Exercise[]): { added: number; updated: number; importedIds: string[] } {
    let added = 0;
    let updated = 0;
    const importedIds: string[] = [];

    newExercises.forEach((newEx, idx) => {
      const cleanName = newEx.name.trim().toLowerCase();
      const existingIdx = this.data.exercises.findIndex(
        e => (newEx.id && e.id === newEx.id) || e.name.trim().toLowerCase() === cleanName
      );

      // Ensure valid visual reference for imported exercises
      const rawUrl = (newEx.imageUrl || '').trim();
      const needsImage = !rawUrl || rawUrl.includes('placeholder');
      const resolvedImageUrl = needsImage
        ? findCuratedPhotoForExercise(newEx.name, newEx.primaryMuscle) || (this.data.exercises[existingIdx]?.imageUrl) || DEFAULT_EXERCISE_IMAGE
        : rawUrl;

      const exerciseWithImage: Exercise = {
        ...newEx,
        imageUrl: resolvedImageUrl
      };

      if (existingIdx !== -1) {
        this.data.exercises[existingIdx] = {
          ...this.data.exercises[existingIdx],
          ...exerciseWithImage,
          id: this.data.exercises[existingIdx].id // maintain stable id
        };
        importedIds.push(this.data.exercises[existingIdx].id);
        updated++;
      } else {
        const id = newEx.id && !this.data.exercises.some(e => e.id === newEx.id)
          ? newEx.id
          : `ex-net-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        
        const preparedExercise: Exercise = {
          ...exerciseWithImage,
          id
        };
        this.data.exercises.unshift(preparedExercise);
        importedIds.push(id);
        added++;
      }
    });

    this.save();
    return { added, updated, importedIds };
  }

  // --- MUSCLE GROUPS & EQUIPMENT ---
  public getMuscleGroups(): MuscleGroup[] {
    return this.data.muscleGroups;
  }

  public getEquipment(): EquipmentType[] {
    return this.data.equipment;
  }

  // --- WORKOUTS (CRUD) ---
  public getWorkouts(): Workout[] {
    return this.data.workouts;
  }

  public getSelectedWorkoutId(): string | null {
    if (this.data.selectedWorkoutId) {
      const exists = this.data.workouts.some(w => w.id === this.data.selectedWorkoutId);
      if (exists) return this.data.selectedWorkoutId;
    }
    return this.data.workouts[0]?.id || null;
  }

  public setSelectedWorkoutId(id: string) {
    this.data.selectedWorkoutId = id;
    this.save();
  }

  public getWorkoutById(id: string): Workout | undefined {
    return this.data.workouts.find(w => w.id === id);
  }

  public createWorkout(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Workout {
    const newW: Workout = {
      ...workout,
      id: 'workout-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.workouts.unshift(newW);
    this.data.selectedWorkoutId = newW.id;
    this.save();
    if (newW.userId) {
      syncWorkoutToCloud(newW.userId, newW).catch(() => {});
    }
    return newW;
  }

  public updateWorkout(id: string, updates: Partial<Workout>): Workout | null {
    const index = this.data.workouts.findIndex(w => w.id === id);
    if (index !== -1) {
      this.data.workouts[index] = {
        ...this.data.workouts[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      const updated = this.data.workouts[index];
      if (updated.userId) {
        syncWorkoutToCloud(updated.userId, updated).catch(() => {});
      }
      return updated;
    }
    return null;
  }

  public duplicateWorkout(id: string): Workout | null {
    const original = this.getWorkoutById(id);
    if (!original) return null;

    const duplicated: Workout = {
      ...original,
      id: 'workout-' + Date.now(),
      title: `${original.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exercises: original.exercises.map(e => ({
        ...e,
        id: 'we-' + Math.random().toString(36).substring(2, 9)
      }))
    };
    this.data.workouts.push(duplicated);
    this.save();
    return duplicated;
  }

  public deleteWorkout(id: string): boolean {
    const prevLen = this.data.workouts.length;
    this.data.workouts = this.data.workouts.filter(w => w.id !== id);
    // Also remove from weekly schedule if present
    this.data.weeklySchedule = this.data.weeklySchedule.map(day => {
      if (day.workoutId === id) {
        return { ...day, workoutId: null, isRest: true, notes: 'Descanso' };
      }
      return day;
    });
    if (this.data.workouts.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- WEEKLY SCHEDULE ---
  public getWeeklySchedule(): WeeklyScheduleDay[] {
    return this.data.weeklySchedule;
  }

  public updateWeeklyDay(dayOfWeek: WeeklyScheduleDay['dayOfWeek'], updates: Partial<WeeklyScheduleDay>) {
    this.data.weeklySchedule = this.data.weeklySchedule.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return { ...day, ...updates };
      }
      return day;
    });
    this.save();
  }

  public setWeeklySchedule(schedule: WeeklyScheduleDay[]) {
    this.data.weeklySchedule = schedule;
    this.save();
  }

  public toggleWorkoutFavorite(id: string): boolean {
    const workout = this.getWorkoutById(id);
    if (!workout) return false;
    workout.isFavorite = !workout.isFavorite;
    this.save();
    return workout.isFavorite;
  }

  // --- FAVORITE CATEGORIES (Favorito A, B, C, D) & SCHEDULING ---
  public getFavoriteCategoryNames(): Record<FavoriteCategory, string> {
    return {
      ...DEFAULT_FAVORITE_CATEGORY_NAMES,
      ...(this.data.favoriteCategoryNames || {})
    };
  }

  public updateFavoriteCategoryName(category: FavoriteCategory, newName: string) {
    if (!this.data.favoriteCategoryNames) {
      this.data.favoriteCategoryNames = { ...DEFAULT_FAVORITE_CATEGORY_NAMES };
    }
    const cleanName = newName.trim();
    this.data.favoriteCategoryNames[category] = cleanName || DEFAULT_FAVORITE_CATEGORY_NAMES[category];
    this.save();
  }

  public setExerciseFavoriteCategory(exerciseId: string, category: FavoriteCategory | null) {
    const ex = this.getExerciseById(exerciseId);
    if (!ex) return;
    if (category) {
      ex.isFavorite = true;
      ex.favoriteCategory = category;
    } else {
      ex.favoriteCategory = undefined;
    }
    this.save();
  }

  public toggleExerciseFavorite(id: string, category?: FavoriteCategory): boolean {
    const ex = this.getExerciseById(id);
    if (!ex) return false;
    if (ex.isFavorite) {
      // If a category was provided and it's different, update category instead of toggling off
      if (category && ex.favoriteCategory !== category) {
        ex.favoriteCategory = category;
        this.save();
        return true;
      }
      ex.isFavorite = false;
      ex.favoriteCategory = undefined;
    } else {
      ex.isFavorite = true;
      ex.favoriteCategory = category || 'A';
    }
    this.save();
    return !!ex.isFavorite;
  }

  public getFavoriteExercises(category?: FavoriteCategory): Exercise[] {
    return this.data.exercises.filter(ex => {
      if (!ex.isFavorite) return false;
      if (category) return (ex.favoriteCategory || 'A') === category;
      return true;
    });
  }

  public getScheduledWorkoutForToday(): {
    scheduleDay: WeeklyScheduleDay;
    workout: Workout | null;
    dayName: string;
  } {
    const DAYS_ORDER: DayOfWeek[] = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];
    const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
    const currentDayOfWeek = DAYS_ORDER[todayIndex];
    const scheduleDay = this.data.weeklySchedule.find(s => s.dayOfWeek === currentDayOfWeek) || {
      dayOfWeek: currentDayOfWeek,
      workoutId: null,
      isRest: true
    };
    const workout = scheduleDay.workoutId ? this.getWorkoutById(scheduleDay.workoutId) || null : null;
    const dayLabels: Record<DayOfWeek, string> = {
      SEGUNDA: 'Segunda-feira',
      TERÇA: 'Terça-feira',
      QUARTA: 'Quarta-feira',
      QUINTA: 'Quinta-feira',
      SEXTA: 'Sexta-feira',
      SÁBADO: 'Sábado',
      DOMINGO: 'Domingo'
    };
    return {
      scheduleDay,
      workout,
      dayName: dayLabels[currentDayOfWeek] || currentDayOfWeek
    };
  }

  public createWorkoutFromFavorites(category?: FavoriteCategory): Workout {
    const favExercises = this.getFavoriteExercises(category);
    const catNames = this.getFavoriteCategoryNames();
    const title = category 
      ? `Treino Livre — ${catNames[category]}`
      : 'Treino Livre dos Favoritos';

    const workoutExercises = favExercises.map((ex, idx) => ({
      id: 'we-fav-' + idx + '-' + Date.now(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: ex.recommendedSets || 3,
      reps: parseInt(ex.recommendedReps?.split('-')[0]) || 10,
      loadKg: 20,
      restTimeSec: ex.recommendedRestSec || 60,
      order: idx
    }));

    return {
      id: 'workout-fav-' + Date.now(),
      userId: this.getCurrentUser().id,
      title,
      description: category ? `Sessão livre com exercícios da categoria ${catNames[category]}` : 'Sessão livre com seus exercícios favoritos',
      category: 'Treino Livre',
      exercises: workoutExercises,
      estimatedDurationMin: Math.max(30, favExercises.length * 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  public createWorkoutFromTodaySchedule(): Workout | null {
    const { workout, dayName } = this.getScheduledWorkoutForToday();
    if (!workout) return null;
    return {
      ...workout,
      id: 'workout-today-' + Date.now(),
      title: `${workout.title} (${dayName})`,
      description: workout.description || `Treino agendado para ${dayName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- HISTORY & WORKOUT COMPLETION ---
  public getHistory(): WorkoutHistoryItem[] {
    return this.data.history;
  }

  public deleteHistoryItem(id: string): boolean {
    const initialLen = this.data.history.length;
    this.data.history = this.data.history.filter(h => h.id !== id);
    if (this.data.history.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getPreviousExercisePerformance(exerciseId: string): { 
    lastDate: string; 
    sets: { setNumber: number; reps: number; loadKg: number; type?: import('../types').SetType }[] 
  } | null {
    for (const h of this.data.history) {
      const match = h.exercisesLog.find(e => e.exerciseId === exerciseId);
      if (match && match.sets && match.sets.length > 0) {
        const completedSets = match.sets.filter(s => s.completed);
        if (completedSets.length > 0) {
          return {
            lastDate: h.date,
            sets: completedSets.map(s => ({
              setNumber: s.setNumber,
              reps: s.reps,
              loadKg: s.loadKg,
              type: s.type
            }))
          };
        }
      }
    }
    // Also fallback to personal records if available
    const record = this.data.records.find(r => r.exerciseId === exerciseId);
    if (record) {
      return {
        lastDate: record.achievedDate || '',
        sets: [{ setNumber: 1, reps: record.repsAtMax || 10, loadKg: record.maxLoadKg }]
      };
    }
    return null;
  }

  public getMuscleRecoveryStatus(): Record<string, { recoveryPct: number; status: 'recuperado' | 'recuperando' | 'fadigado'; lastTrainedHoursAgo: number | null }> {
    const muscles: string[] = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Panturrilhas'];
    const result: Record<string, { recoveryPct: number; status: 'recuperado' | 'recuperando' | 'fadigado'; lastTrainedHoursAgo: number | null }> = {};
    const now = Date.now();

    for (const m of muscles) {
      let lastTimestamp: number | null = null;
      for (const h of this.data.history) {
        const trained = h.exercisesLog.some(ex => {
          const exInfo = this.getExerciseById(ex.exerciseId);
          return ex.primaryMuscle === m || (exInfo && (exInfo.primaryMuscle === m || exInfo.secondaryMuscles?.includes(m as any)));
        });
        if (trained) {
          const hTime = new Date(h.date + 'T' + (h.endTime || '12:00')).getTime();
          if (!lastTimestamp || hTime > lastTimestamp) {
            lastTimestamp = hTime;
          }
        }
      }

      if (lastTimestamp === null) {
        result[m] = { recoveryPct: 100, status: 'recuperado', lastTrainedHoursAgo: null };
      } else {
        const hoursAgo = Math.max(0, (now - lastTimestamp) / 3600000);
        if (hoursAgo >= 72) {
          result[m] = { recoveryPct: 100, status: 'recuperado', lastTrainedHoursAgo: Math.round(hoursAgo) };
        } else if (hoursAgo >= 36) {
          const pct = Math.min(95, Math.round(70 + ((hoursAgo - 36) / 36) * 25));
          result[m] = { recoveryPct: pct, status: 'recuperando', lastTrainedHoursAgo: Math.round(hoursAgo) };
        } else {
          const pct = Math.max(25, Math.round(30 + (hoursAgo / 36) * 40));
          result[m] = { recoveryPct: pct, status: 'fadigado', lastTrainedHoursAgo: Math.round(hoursAgo) };
        }
      }
    }
    return result;
  }

  public recordCompletedWorkout(historyItem: Omit<WorkoutHistoryItem, 'id' | 'userId'>): { item: WorkoutHistoryItem; newPrs: PersonalRecord[] } {
    const currentUser = this.getCurrentUser();
    const newPrs: PersonalRecord[] = [];

    // Check for new PRs
    historyItem.exercisesLog.forEach(exLog => {
      const existingPr = this.data.records.find(r => r.exerciseId === exLog.exerciseId);
      const maxInWorkout = Math.max(...exLog.sets.filter(s => s.completed).map(s => s.loadKg), 0);
      const repWithMax = exLog.sets.find(s => s.completed && s.loadKg === maxInWorkout)?.reps || 10;

      if (maxInWorkout > 0) {
        if (!existingPr) {
          const newPr: PersonalRecord = {
            id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            userId: currentUser.id,
            exerciseId: exLog.exerciseId,
            exerciseName: exLog.exerciseName,
            maxLoadKg: maxInWorkout,
            repsAtMax: repWithMax,
            achievedDate: historyItem.date
          };
          this.data.records.push(newPr);
          newPrs.push(newPr);
        } else if (maxInWorkout > existingPr.maxLoadKg) {
          const updatedPr: PersonalRecord = {
            ...existingPr,
            previousRecordKg: existingPr.maxLoadKg,
            maxLoadKg: maxInWorkout,
            repsAtMax: repWithMax,
            achievedDate: historyItem.date
          };
          const prIdx = this.data.records.findIndex(r => r.id === existingPr.id);
          this.data.records[prIdx] = updatedPr;
          newPrs.push(updatedPr);
        }
      }
    });

    const fullItem: WorkoutHistoryItem = {
      ...historyItem,
      id: 'hist-' + Date.now(),
      userId: currentUser.id,
      newPrs: newPrs.map(pr => ({ exerciseName: pr.exerciseName, loadKg: pr.maxLoadKg }))
    };

    this.data.history.unshift(fullItem);

    // Update user streak and last workout date
    const todayStr = new Date().toISOString().split('T')[0];
    const isSameDay = currentUser.lastWorkoutDate === todayStr;
    const isConsecutive = currentUser.lastWorkoutDate ? 
      (new Date(todayStr).getTime() - new Date(currentUser.lastWorkoutDate).getTime()) <= 86400000 * 2 : true;

    const updatedStreak = isSameDay 
      ? (currentUser.streakDays || 1)
      : isConsecutive 
      ? (currentUser.streakDays || 0) + 1 
      : 1;

    this.updateUser(currentUser.id, {
      streakDays: updatedStreak,
      lastWorkoutDate: todayStr
    });

    this.save();

    // Async sync to Firestore
    syncHistoryItemToCloud(currentUser.id, fullItem).catch(() => {});
    newPrs.forEach(pr => {
      syncPersonalRecordToCloud(currentUser.id, pr).catch(() => {});
    });

    return { item: fullItem, newPrs };
  }

  // --- PERSONAL RECORDS (PRs) ---
  public getRecords(): PersonalRecord[] {
    return this.data.records.map(r => ({
      ...r,
      loadKg: r.maxLoadKg,
      date: r.achievedDate,
      reps: r.repsAtMax
    }));
  }

  // --- SETTINGS & LANGUAGE ---
  public getSettings(): AppSettings {
    if (!this.data.settings) {
      this.data.settings = {
        theme: 'dark',
        notifications: {
          workoutReminders: true,
          reminderTime: '18:30',
          prAlerts: true,
          streakReminders: true,
          soundEffects: true
        },
        units: 'kg',
        hasCompletedOnboarding: false,
        language: 'pt-br'
      };
    }
    if (!this.data.settings.language) {
      this.data.settings.language = 'pt-br';
    }
    return this.data.settings;
  }

  public updateSettings(settings: Partial<AppSettings>) {
    this.data.settings = { ...this.getSettings(), ...settings };
    this.save();
  }

  public getLanguage(): AppLanguage {
    return this.getSettings().language || 'pt-br';
  }

  public setLanguage(lang: AppLanguage) {
    const settings = this.getSettings();
    settings.language = lang;
    this.data.settings = settings;

    // Also sync to current user profile if available
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id) {
      const uIndex = this.data.users.findIndex(u => u.id === currentUser.id);
      if (uIndex !== -1) {
        this.data.users[uIndex].language = lang;
      }
    }
    this.save();
  }
}

export const db = new DatabaseService();
