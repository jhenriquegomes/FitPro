import { useState, useEffect } from 'react';
import { db } from './db';
import { AppLanguage } from '../types';

export interface Translations {
  // Navigation
  navHome: string;
  navWorkouts: string;
  navTips: string;
  navExercises: string;
  navEvolution: string;
  navProfile: string;

  // Header
  tagline: string;
  generateWorkout: string;
  streakDays: string;

  // Workouts View
  myWorkouts: string;
  myWeek: string;
  createWorkout: string;
  selectedWorkout: string;
  startSelectedWorkout: string;
  startWorkout: string;
  editWorkout: string;
  duplicateWorkout: string;
  deleteWorkout: string;
  shareWorkout: string;
  favoriteWorkout: string;
  exercisesCount: string;
  estimatedDuration: string;
  filterAll: string;
  noWorkoutsFound: string;
  translateWorkoutsToPt: string;
  translateWorkoutsToEn: string;
  translateThisWorkout: string;
  translateSuccess: string;
  confirmDeleteWorkout: string;

  // Exercise Library
  exerciseLibrary: string;
  searchExercisePlaceholder: string;
  allMuscles: string;
  allEquipment: string;
  newExercise: string;
  searchOnline: string;
  translateExercisesToPt: string;
  translateExercisesSuccess: string;
  viewDetails: string;
  addToWorkout: string;
  muscleTarget: string;
  equipment: string;
  level: string;
  difficulty: string;

  // Dashboard
  welcomeBack: string;
  todaysWorkout: string;
  readyToTrain: string;
  completedWorkouts: string;
  totalVolume: string;
  currentStreak: string;
  activePRs: string;
  weeklyProgress: string;
  recentActivity: string;
  seeAllWorkouts: string;

  // Profile & Settings
  profileTitle: string;
  physicalData: string;
  preferencesTitle: string;
  soundEffects: string;
  soundEffectsDesc: string;
  vibration: string;
  vibrationDesc: string;
  autoRestTimer: string;
  autoRestTimerDesc: string;
  languageSetting: string;
  languageSettingDesc: string;
  portugueseLabel: string;
  englishLabel: string;
  saveChanges: string;
  savedSuccess: string;
  achievements: string;
  logout: string;

  // AI & Gemini Tips
  geminiCoach: string;
  askCoach: string;
  dailyTip: string;
  nutrition: string;
  recovery: string;
  trainingBiomechanics: string;

  // Modals & General
  close: string;
  cancel: string;
  save: string;
  confirm: string;
  back: string;
  finish: string;
  next: string;
  restTimer: string;
  setCompleted: string;
  reps: string;
  weightKg: string;
  weightLbs: string;
}

export const DICTIONARY: Record<AppLanguage, Translations> = {
  'pt-br': {
    // Navigation
    navHome: 'Início',
    navWorkouts: 'Treinos & Semana',
    navTips: 'Dicas Gemini',
    navExercises: 'Exercícios',
    navEvolution: 'Evolução',
    navProfile: 'Perfil',

    // Header
    tagline: 'SEU TREINO, SEU RITMO',
    generateWorkout: 'Gerar Treino',
    streakDays: 'dias',

    // Workouts View
    myWorkouts: 'MEUS TREINOS',
    myWeek: 'MINHA SEMANA',
    createWorkout: 'CRIAR TREINO',
    selectedWorkout: 'Treino Selecionado',
    startSelectedWorkout: 'INICIAR TREINO SELECIONADO',
    startWorkout: 'Iniciar Treino',
    editWorkout: 'Editar',
    duplicateWorkout: 'Duplicar',
    deleteWorkout: 'Excluir',
    shareWorkout: 'Compartilhar',
    favoriteWorkout: 'Favoritar',
    exercisesCount: 'exercícios',
    estimatedDuration: 'min',
    filterAll: 'Todos',
    noWorkoutsFound: 'Nenhum treino cadastrado ainda. Crie um novo treino ou use o Gerador com IA!',
    translateWorkoutsToPt: '🇧🇷 Colocar Treinos em PT-BR',
    translateWorkoutsToEn: '🇺🇸 Traduzir para Inglês (EN)',
    translateThisWorkout: 'Traduzir para PT-BR',
    translateSuccess: 'Treino(s) traduzido(s) para Português (PT-BR) com sucesso!',
    confirmDeleteWorkout: 'Deseja excluir este treino permanentemente?',

    // Exercise Library
    exerciseLibrary: 'Biblioteca de Exercícios',
    searchExercisePlaceholder: 'Buscar por nome, músculo ou equipamento...',
    allMuscles: 'Todos os Músculos',
    allEquipment: 'Todos os Equipamentos',
    newExercise: 'Novo Exercício',
    searchOnline: 'Buscar Online / Google',
    translateExercisesToPt: '🇧🇷 Traduzir Exercícios em Inglês para PT-BR',
    translateExercisesSuccess: 'Exercícios traduzidos para Português!',
    viewDetails: 'Ver Detalhes',
    addToWorkout: 'Adicionar ao Treino',
    muscleTarget: 'Músculo Alvo',
    equipment: 'Equipamento',
    level: 'Nível',
    difficulty: 'Dificuldade',

    // Dashboard
    welcomeBack: 'Bem-vindo de volta',
    todaysWorkout: 'Treino Programado para Hoje',
    readyToTrain: 'Bora treinar hoje?',
    completedWorkouts: 'Treinos Realizados',
    totalVolume: 'Volume Total Levantado',
    currentStreak: 'Sequência Atual',
    activePRs: 'Recordes Pessoais',
    weeklyProgress: 'Progresso da Semana',
    recentActivity: 'Últimas Atividades',
    seeAllWorkouts: 'Ver Todos os Treinos',

    // Profile & Settings
    profileTitle: 'Meu Perfil & Ajustes',
    physicalData: 'Dados Físicos & Treinamento',
    preferencesTitle: 'Preferências e Usabilidade',
    soundEffects: 'Sinais Sonoros e Bips',
    soundEffectsDesc: 'Bips de contagem regressiva e aviso de descanso',
    vibration: 'Vibração no Término',
    vibrationDesc: 'Vibrar o aparelho quando o descanso terminar',
    autoRestTimer: 'Cronômetro de Descanso Automático',
    autoRestTimerDesc: 'Iniciar contagem regressiva assim que marcar série concluída',
    languageSetting: 'Idioma Global do Aplicativo',
    languageSettingDesc: 'Altere o idioma para toda a interface, treinos e conteúdos gerados pela IA',
    portugueseLabel: 'Português (Brasil)',
    englishLabel: 'English (US)',
    saveChanges: 'Salvar Alterações',
    savedSuccess: 'Alterações salvas com sucesso!',
    achievements: 'Conquistas & Medalhas',
    logout: 'Sair da Sessão',

    // AI & Gemini Tips
    geminiCoach: 'Treinador FitPro IA',
    askCoach: 'Perguntar ao Treinador',
    dailyTip: 'Dica Especial do Dia',
    nutrition: 'Nutrição Esportiva',
    recovery: 'Recuperação & Sono',
    trainingBiomechanics: 'Biomecânica & Técnica',

    // Modals & General
    close: 'Fechar',
    cancel: 'Cancelar',
    save: 'Salvar',
    confirm: 'Confirmar',
    back: 'Voltar',
    finish: 'Finalizar',
    next: 'Próximo',
    restTimer: 'Descanso',
    setCompleted: 'Concluir Série',
    reps: 'reps',
    weightKg: 'kg',
    weightLbs: 'lbs'
  },
  'en': {
    // Navigation
    navHome: 'Home',
    navWorkouts: 'Workouts & Week',
    navTips: 'Gemini Tips',
    navExercises: 'Exercises',
    navEvolution: 'Evolution',
    navProfile: 'Profile',

    // Header
    tagline: 'YOUR WORKOUT, YOUR PACE',
    generateWorkout: 'Generate Workout',
    streakDays: 'days',

    // Workouts View
    myWorkouts: 'MY WORKOUTS',
    myWeek: 'MY WEEK',
    createWorkout: 'CREATE WORKOUT',
    selectedWorkout: 'Selected Workout',
    startSelectedWorkout: 'START SELECTED WORKOUT',
    startWorkout: 'Start Workout',
    editWorkout: 'Edit',
    duplicateWorkout: 'Duplicate',
    deleteWorkout: 'Delete',
    shareWorkout: 'Share',
    favoriteWorkout: 'Favorite',
    exercisesCount: 'exercises',
    estimatedDuration: 'min',
    filterAll: 'All',
    noWorkoutsFound: 'No workouts registered yet. Create a new workout or use the AI Generator!',
    translateWorkoutsToPt: '🇧🇷 Switch Workouts to PT-BR',
    translateWorkoutsToEn: '🇺🇸 Translate to English (EN)',
    translateThisWorkout: 'Translate to PT-BR',
    translateSuccess: 'Workout(s) translated successfully!',
    confirmDeleteWorkout: 'Do you want to permanently delete this workout?',

    // Exercise Library
    exerciseLibrary: 'Exercise Library',
    searchExercisePlaceholder: 'Search by name, muscle or equipment...',
    allMuscles: 'All Muscles',
    allEquipment: 'All Equipment',
    newExercise: 'New Exercise',
    searchOnline: 'Search Online / Google',
    translateExercisesToPt: '🇧🇷 Translate English Exercises to PT-BR',
    translateExercisesSuccess: 'Exercises translated to Portuguese!',
    viewDetails: 'View Details',
    addToWorkout: 'Add to Workout',
    muscleTarget: 'Target Muscle',
    equipment: 'Equipment',
    level: 'Level',
    difficulty: 'Difficulty',

    // Dashboard
    welcomeBack: 'Welcome back',
    todaysWorkout: 'Scheduled Workout for Today',
    readyToTrain: 'Ready to train today?',
    completedWorkouts: 'Completed Workouts',
    totalVolume: 'Total Volume Lifted',
    currentStreak: 'Current Streak',
    activePRs: 'Personal Records',
    weeklyProgress: 'Weekly Progress',
    recentActivity: 'Recent Activity',
    seeAllWorkouts: 'View All Workouts',

    // Profile & Settings
    profileTitle: 'My Profile & Settings',
    physicalData: 'Physical Data & Training',
    preferencesTitle: 'Preferences and Usability',
    soundEffects: 'Sound Alerts & Beeps',
    soundEffectsDesc: 'Countdown beeps and rest completion chime',
    vibration: 'Vibration on Timer Finish',
    vibrationDesc: 'Vibrate device when rest period ends',
    autoRestTimer: 'Automatic Rest Timer',
    autoRestTimerDesc: 'Start countdown as soon as a set is marked completed',
    languageSetting: 'Global App Language',
    languageSettingDesc: 'Change the language across the entire interface, workouts, and AI content',
    portugueseLabel: 'Português (Brasil)',
    englishLabel: 'English (US)',
    saveChanges: 'Save Changes',
    savedSuccess: 'Changes saved successfully!',
    achievements: 'Achievements & Badges',
    logout: 'Log Out',

    // AI & Gemini Tips
    geminiCoach: 'FitPro AI Coach',
    askCoach: 'Ask the Coach',
    dailyTip: 'Daily Smart Tip',
    nutrition: 'Sports Nutrition',
    recovery: 'Recovery & Sleep',
    trainingBiomechanics: 'Biomechanics & Form',

    // Modals & General
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    back: 'Back',
    finish: 'Finish',
    next: 'Next',
    restTimer: 'Rest',
    setCompleted: 'Complete Set',
    reps: 'reps',
    weightKg: 'kg',
    weightLbs: 'lbs'
  }
};

export function getAppLanguage(): AppLanguage {
  return db.getLanguage();
}

export function setAppLanguage(lang: AppLanguage): void {
  db.setLanguage(lang);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fitpro:language-change', { detail: lang }));
  }
}

export function useTranslation() {
  const [language, setLanguageState] = useState<AppLanguage>(() => db.getLanguage());

  useEffect(() => {
    const handleDbChange = () => {
      const current = db.getLanguage();
      setLanguageState(current);
    };

    const unsubscribe = db.subscribe(handleDbChange);

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<AppLanguage>;
      if (custom.detail) {
        setLanguageState(custom.detail);
      }
    };

    window.addEventListener('fitpro:language-change', handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('fitpro:language-change', handleCustomEvent);
    };
  }, []);

  const changeLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    setAppLanguage(newLang);
  };

  const t = DICTIONARY[language] || DICTIONARY['pt-br'];

  return {
    language,
    setLanguage: changeLanguage,
    t,
    isPortuguese: language === 'pt-br',
    isEnglish: language === 'en'
  };
}
