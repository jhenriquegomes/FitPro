import { Exercise, EquipmentType, Workout } from '../types';
import { db } from './db';
import { translateExercise, translateExerciseName, translateAllGithubExercisesInLibrary } from './workoutTranslator';
import freeExerciseDbJson from '../data/freeExerciseDb.json';

// Cast JSON dataset to strongly typed Exercise array
export const FREE_EXERCISE_DB_LIST: Exercise[] = freeExerciseDbJson as Exercise[];

export interface FreeDbStats {
  totalAvailable: number;
  importedCount: number;
  isFullyImported: boolean;
  translatedCount: number;
}

/**
 * Checks if the user already has imported exercises from GitHub Free Exercise DB
 */
export function isFreeExerciseDbImported(): boolean {
  const currentExercises = db.getExercises();
  // If at least 50 exercises from the GitHub database are present
  const count = currentExercises.filter(
    e => e.id?.startsWith('fedb-') || (e.sourceUrl && e.sourceUrl.includes('free-exercise-db'))
  ).length;
  return count >= 50;
}

/**
 * Returns statistics about the GitHub Free Exercise DB in the user's library,
 * including how many are already translated into Portuguese.
 */
export function getFreeExerciseDbStats(): FreeDbStats {
  const currentExercises = db.getExercises();
  const githubExercises = currentExercises.filter(
    e => e.id?.startsWith('fedb-') || (e.sourceUrl && e.sourceUrl.includes('free-exercise-db'))
  );
  const importedCount = githubExercises.length;
  
  // Count how many have Portuguese indicators or translated names
  const translatedCount = githubExercises.filter(e => {
    const ptName = translateExerciseName(e.name, 'pt-br');
    // If name is already in Portuguese or has special accents/pt terms
    return /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(e.name) || ptName === e.name;
  }).length;

  return {
    totalAvailable: FREE_EXERCISE_DB_LIST.length,
    importedCount,
    isFullyImported: importedCount >= FREE_EXERCISE_DB_LIST.length * 0.9,
    translatedCount
  };
}

/**
 * Retrieves all exercises from the GitHub Free Exercise DB catalog,
 * optionally automatically translated to Portuguese or current language.
 */
export function getAllFreeExerciseDb(targetLang?: 'pt-br' | 'en'): Exercise[] {
  const lang = targetLang || (typeof db !== 'undefined' && db?.getLanguage ? db.getLanguage() : 'pt-br');
  if (lang === 'pt-br') {
    return FREE_EXERCISE_DB_LIST.map(ex => translateExercise(ex, 'pt-br'));
  }
  return FREE_EXERCISE_DB_LIST;
}

/**
 * Searches the GitHub Free Exercise DB with rich query matching,
 * supporting English and Portuguese fitness terminology and automatically
 * delivering translated exercises when in PT-BR mode.
 */
export function searchFreeExerciseDb(params: {
  query?: string;
  muscleGroup?: string;
  equipment?: string;
  limit?: number;
  autoTranslate?: boolean;
}): Exercise[] {
  const cleanQuery = (params.query || '').trim().toLowerCase();
  const muscleFilter = params.muscleGroup && params.muscleGroup !== 'Todos' ? params.muscleGroup : null;
  const equipmentFilter = params.equipment && params.equipment !== 'Todos' ? params.equipment : null;
  const limit = params.limit || 50;
  const shouldTranslate = params.autoTranslate !== undefined ? params.autoTranslate : (db.getLanguage() === 'pt-br');

  // Synonyms and bilingual translation keywords
  const queryWords = cleanQuery ? cleanQuery.split(/\s+/).filter(Boolean) : [];

  const matchedExercises = FREE_EXERCISE_DB_LIST.filter(ex => {
    // Muscle filter
    if (muscleFilter && ex.primaryMuscle !== muscleFilter && !ex.secondaryMuscles?.includes(muscleFilter as any)) {
      return false;
    }

    // Equipment filter
    if (equipmentFilter && ex.equipment !== equipmentFilter) {
      return false;
    }

    // If no text query, passes
    if (queryWords.length === 0) return true;

    // Searchable text with both original English and Portuguese translation
    const ptTranslatedName = translateExerciseName(ex.name, 'pt-br');

    const searchableText = [
      ex.name,
      ptTranslatedName,
      ex.primaryMuscle,
      ex.equipment,
      ex.level,
      ex.type,
      ...(ex.secondaryMuscles || []),
      ...(ex.executionSteps || []).slice(0, 2),
      ex.initialPosition || '',
      ex.movement || ''
    ].join(' ').toLowerCase();

    return queryWords.every(word => searchableText.includes(word));
  });

  const sliced = matchedExercises.slice(0, limit);

  if (shouldTranslate) {
    return sliced.map(ex => translateExercise(ex, 'pt-br'));
  }

  return sliced;
}

/**
 * Imports the entire 876-exercise repertoire from GitHub Free Exercise DB
 * into the local FitPro database (`db.ts`), with automatic translation
 * to Brazilian Portuguese (PT-BR) by default.
 */
export async function importFreeExerciseDbIntoLibrary(options?: {
  onProgress?: (percent: number, current: number, total: number) => void;
  batchSize?: number;
  autoTranslate?: boolean;
}): Promise<{ added: number; updated: number; total: number; translated: boolean }> {
  const total = FREE_EXERCISE_DB_LIST.length;
  const onProgress = options?.onProgress;
  const shouldTranslate = options?.autoTranslate !== undefined ? options.autoTranslate : (db.getLanguage() === 'pt-br');

  if (onProgress) {
    onProgress(15, 0, total);
  }

  // Translate all exercises if target language is Portuguese
  const preparedExercises = shouldTranslate
    ? FREE_EXERCISE_DB_LIST.map(ex => translateExercise(ex, 'pt-br'))
    : FREE_EXERCISE_DB_LIST;

  if (onProgress) {
    onProgress(50, Math.floor(total / 2), total);
  }

  // Perform bulk import into db
  const result = db.bulkImportExercises(preparedExercises);

  if (onProgress) {
    onProgress(100, total, total);
  }

  return {
    added: result.added,
    updated: result.updated,
    total: db.getExercises().length,
    translated: shouldTranslate
  };
}

/**
 * Counts how many exercises in the GitHub repository match the specified equipments
 */
export function getExercisesCountByEquipment(equipments: EquipmentType[]): number {
  return FREE_EXERCISE_DB_LIST.filter(ex => equipments.includes(ex.equipment)).length;
}

/**
 * Imports only exercises from GitHub matching specific equipments (e.g. Barra and Halteres)
 */
export async function importExercisesByEquipment(
  equipments: EquipmentType[],
  autoTranslate = true
): Promise<{ added: number; updated: number; total: number; importedCount: number }> {
  const matched = FREE_EXERCISE_DB_LIST.filter(ex => equipments.includes(ex.equipment));
  const shouldTranslate = autoTranslate && (db.getLanguage() === 'pt-br');
  const prepared = shouldTranslate
    ? matched.map(ex => translateExercise(ex, 'pt-br'))
    : matched;

  const result = db.bulkImportExercises(prepared);
  return {
    added: result.added,
    updated: result.updated,
    total: db.getExercises().length,
    importedCount: matched.length
  };
}

/**
 * Imports only the exercises specifically needed by a set of workouts from GitHub catalog
 */
export async function importExercisesForWorkouts(
  workouts: Workout[],
  autoTranslate = true
): Promise<{ added: number; updated: number; total: number; neededCount: number }> {
  const neededNames = new Set<string>();
  const neededIds = new Set<string>();

  workouts.forEach(w => {
    w.exercises?.forEach(we => {
      if (we.exerciseId) neededIds.add(we.exerciseId);
      if (we.exerciseName) neededNames.add(we.exerciseName.trim().toLowerCase());
    });
  });

  const matched = FREE_EXERCISE_DB_LIST.filter(ex => {
    if (neededIds.has(ex.id)) return true;
    const nameLower = ex.name.trim().toLowerCase();
    const ptNameLower = translateExerciseName(ex.name, 'pt-br').trim().toLowerCase();
    return neededNames.has(nameLower) || neededNames.has(ptNameLower);
  });

  const shouldTranslate = autoTranslate && (db.getLanguage() === 'pt-br');
  const prepared = shouldTranslate
    ? matched.map(ex => translateExercise(ex, 'pt-br'))
    : matched;

  const result = db.bulkImportExercises(prepared);
  return {
    added: result.added,
    updated: result.updated,
    total: db.getExercises().length,
    neededCount: matched.length
  };
}

/**
 * Translates all GitHub exercises currently loaded in the user's database.
 */
export function translateAllImportedGithubExercises(targetLang: 'pt-br' | 'en' = 'pt-br'): { count: number } {
  const res = translateAllGithubExercisesInLibrary(targetLang);
  return { count: res.translatedCount };
}

