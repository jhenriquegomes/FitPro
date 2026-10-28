import { User, WorkoutHistoryItem, PersonalRecord, UserBadge, BadgeDefinition } from '../types';

export const ALL_BADGE_DEFINITIONS: BadgeDefinition[] = [
  // DIAS E TREINOS REALIZADOS
  {
    id: 'badge-first-step',
    title: 'Primeiro Passo',
    description: 'Concluiu o 1º treino no FitPro com determinação',
    category: 'days',
    tier: 'bronze',
    targetValue: 1,
    unit: 'treino',
    iconName: 'Flame'
  },
  {
    id: 'badge-consistency-3',
    title: 'Constância Inicial',
    description: 'Completou 3 treinos registrados na sua jornada',
    category: 'days',
    tier: 'bronze',
    targetValue: 3,
    unit: 'treinos',
    iconName: 'CheckCircle2'
  },
  {
    id: 'badge-warrior-7',
    title: 'Guerreiro Semanal',
    description: 'Atingiu a marca de 7 treinos finalizados',
    category: 'days',
    tier: 'silver',
    targetValue: 7,
    unit: 'treinos',
    iconName: 'ShieldCheck'
  },
  {
    id: 'badge-habit-15',
    title: 'Hábito de Aço',
    description: 'Alcançou 15 treinos concluídos com foco e disciplina',
    category: 'days',
    tier: 'silver',
    targetValue: 15,
    unit: 'treinos',
    iconName: 'Target'
  },
  {
    id: 'badge-dedication-30',
    title: '30 Dias de Ferro',
    description: 'Marca histórica de 30 treinos executados',
    category: 'days',
    tier: 'gold',
    targetValue: 30,
    unit: 'treinos',
    iconName: 'Trophy'
  },
  {
    id: 'badge-elite-50',
    title: 'Lenda da Academia',
    description: '50 treinos de alta performance superados no FitPro',
    category: 'days',
    tier: 'platinum',
    targetValue: 50,
    unit: 'treinos',
    iconName: 'Crown'
  },

  // SEQUÊNCIA DE DIAS (STREAK)
  {
    id: 'badge-streak-3',
    title: 'Fogo Aceso',
    description: 'Manteve uma sequência de 3 dias de consistência',
    category: 'streak',
    tier: 'bronze',
    targetValue: 3,
    unit: 'dias seguidos',
    iconName: 'Zap'
  },
  {
    id: 'badge-streak-7',
    title: 'Semana Imparável',
    description: 'Sequência fantástica de 7 dias consecutivos ativo',
    category: 'streak',
    tier: 'silver',
    targetValue: 7,
    unit: 'dias seguidos',
    iconName: 'Award'
  },
  {
    id: 'badge-streak-14',
    title: 'Mestre da Rotina',
    description: 'Impressionante sequência de 14 dias sem quebrar o ritmo',
    category: 'streak',
    tier: 'gold',
    targetValue: 14,
    unit: 'dias seguidos',
    iconName: 'Sparkles'
  },

  // CARGA LEVANTADA (VOLUME TOTAL EM KG)
  {
    id: 'badge-volume-1t',
    title: 'Primeira Tonelada',
    description: 'Superou 1.000 kg de carga acumulada levantada',
    category: 'volume',
    tier: 'bronze',
    targetValue: 1000,
    unit: 'kg levantados',
    iconName: 'Dumbbell'
  },
  {
    id: 'badge-volume-5t',
    title: 'Clube dos 5.000 kg',
    description: 'Ergueu mais de 5.000 kg somando todas as séries',
    category: 'volume',
    tier: 'bronze',
    targetValue: 5000,
    unit: 'kg levantados',
    iconName: 'Dumbbell'
  },
  {
    id: 'badge-volume-15t',
    title: 'Levantador Pesado',
    description: 'Movimentou 15.000 kg de puro ferro nos treinos',
    category: 'volume',
    tier: 'silver',
    targetValue: 15000,
    unit: 'kg levantados',
    iconName: 'Dumbbell'
  },
  {
    id: 'badge-volume-30t',
    title: 'Titã das Cargas',
    description: 'Ultrapassou 30.000 kg de volume total nos treinos',
    category: 'volume',
    tier: 'gold',
    targetValue: 30000,
    unit: 'kg levantados',
    iconName: 'Trophy'
  },
  {
    id: 'badge-volume-60t',
    title: 'Monstro de Aço',
    description: '60.000 kg de carga total levantada com suor e garra',
    category: 'volume',
    tier: 'platinum',
    targetValue: 60000,
    unit: 'kg levantados',
    iconName: 'Crown'
  },
  {
    id: 'badge-volume-100t',
    title: 'Lenda dos 100k',
    description: 'Atingiu a marca lendária de 100 toneladas (100.000 kg)',
    category: 'volume',
    tier: 'platinum',
    targetValue: 100000,
    unit: 'kg levantados',
    iconName: 'Sparkles'
  },

  // RECORDES PESSOAIS (PRs)
  {
    id: 'badge-pr-first',
    title: 'Quebrando Limites',
    description: 'Bateu seu primeiro recorde pessoal (PR) de carga máxima',
    category: 'records',
    tier: 'bronze',
    targetValue: 1,
    unit: 'recorde',
    iconName: 'Award'
  },
  {
    id: 'badge-pr-5',
    title: 'Caçador de Recordes',
    description: 'Conquistou 5 recordes pessoais em exercícios diferentes',
    category: 'records',
    tier: 'silver',
    targetValue: 5,
    unit: 'recordes',
    iconName: 'Target'
  },
  {
    id: 'badge-pr-max-50',
    title: 'Meio Centenário',
    description: 'Levantou 50 kg ou mais em um único exercício',
    category: 'records',
    tier: 'silver',
    targetValue: 50,
    unit: 'kg no exercício',
    iconName: 'Dumbbell'
  },
  {
    id: 'badge-pr-max-100',
    title: 'Clube dos 100 kg',
    description: 'Marca de elite: 100 kg ou mais erguidos em um exercício',
    category: 'records',
    tier: 'gold',
    targetValue: 100,
    unit: 'kg no exercício',
    iconName: 'Trophy'
  }
];

export class BadgeService {
  /**
   * Computes all user badges with progress, unlocked status, and authentic achievement date.
   */
  public getUserBadges(
    user: User, 
    history: WorkoutHistoryItem[], 
    records: PersonalRecord[]
  ): UserBadge[] {
    const totalWorkouts = history.length;
    const streakDays = user.streakDays || 0;
    const totalVolumeKg = history.reduce((sum, h) => sum + (h.totalVolumeKg || 0), 0);
    const totalPrs = records.length;
    const maxSingleLoadKg = records.reduce((max, r) => Math.max(max, r.maxLoadKg || 0), 0);

    // Sort history chronologically from oldest to newest to calculate exact milestone dates
    const chronHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return ALL_BADGE_DEFINITIONS.map(def => {
      let currentValue = 0;
      let unlocked = false;
      let unlockedAt: string | undefined = undefined;

      switch (def.category) {
        case 'days': {
          currentValue = totalWorkouts;
          unlocked = totalWorkouts >= def.targetValue;
          if (unlocked && chronHistory.length >= def.targetValue) {
            unlockedAt = chronHistory[def.targetValue - 1]?.date;
          }
          break;
        }
        case 'streak': {
          currentValue = streakDays;
          unlocked = streakDays >= def.targetValue;
          if (unlocked) {
            unlockedAt = user.lastWorkoutDate || new Date().toISOString().split('T')[0];
          }
          break;
        }
        case 'volume': {
          currentValue = totalVolumeKg;
          unlocked = totalVolumeKg >= def.targetValue;
          if (unlocked) {
            let runningVolume = 0;
            for (const h of chronHistory) {
              runningVolume += (h.totalVolumeKg || 0);
              if (runningVolume >= def.targetValue) {
                unlockedAt = h.date;
                break;
              }
            }
          }
          break;
        }
        case 'records': {
          if (def.id === 'badge-pr-first' || def.id === 'badge-pr-5') {
            currentValue = totalPrs;
            unlocked = totalPrs >= def.targetValue;
            if (unlocked && records.length > 0) {
              const sortedPrs = [...records].sort((a, b) => new Date(a.achievedDate).getTime() - new Date(b.achievedDate).getTime());
              unlockedAt = sortedPrs[def.targetValue - 1]?.achievedDate;
            }
          } else {
            // max single load
            currentValue = maxSingleLoadKg;
            unlocked = maxSingleLoadKg >= def.targetValue;
            if (unlocked) {
              const matchingPr = records.find(r => (r.maxLoadKg || 0) >= def.targetValue);
              unlockedAt = matchingPr?.achievedDate;
            }
          }
          break;
        }
        default:
          currentValue = 0;
          unlocked = false;
      }

      if (unlocked && !unlockedAt) {
        unlockedAt = user.lastWorkoutDate || new Date().toISOString().split('T')[0];
      }

      const progressPercentage = Math.min(100, Math.round((currentValue / def.targetValue) * 100));

      return {
        ...def,
        currentValue,
        progressPercentage,
        unlocked,
        unlockedAt
      };
    });
  }

  /**
   * Returns all achievements that the user has already unlocked/conquered.
   */
  public getUnlockedBadges(
    user: User, 
    history: WorkoutHistoryItem[], 
    records: PersonalRecord[]
  ): UserBadge[] {
    const all = this.getUserBadges(user, history, records);
    return all
      .filter(b => b.unlocked)
      .sort((a, b) => {
        // Sort by unlock date descending (most recent first)
        if (a.unlockedAt && b.unlockedAt) {
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        }
        return 0;
      });
  }

  /**
   * Returns all badges currently in progress.
   */
  public getLockedBadges(
    user: User, 
    history: WorkoutHistoryItem[], 
    records: PersonalRecord[]
  ): UserBadge[] {
    const all = this.getUserBadges(user, history, records);
    return all
      .filter(b => !b.unlocked)
      .sort((a, b) => b.progressPercentage - a.progressPercentage);
  }

  /**
   * Returns the most recent achievement unlocked.
   */
  public getLatestUnlockedBadge(
    user: User, 
    history: WorkoutHistoryItem[], 
    records: PersonalRecord[]
  ): UserBadge | null {
    const unlocked = this.getUnlockedBadges(user, history, records);
    return unlocked.length > 0 ? unlocked[0] : null;
  }
}

export const badgeService = new BadgeService();
