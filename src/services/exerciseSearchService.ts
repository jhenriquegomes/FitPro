import { Exercise } from '../types';
import { ONLINE_EXERCISE_CATALOG } from '../data/onlineExerciseCatalog';
import { db } from './db';
import { getBestWebPhotoForExercise } from './exercisePhotoService';
import { DEFAULT_EXERCISE_IMAGE } from './imageUtils';

export interface SearchOnlineParams {
  query: string;
  muscleGroup?: string;
  equipment?: string;
  limit?: number;
  searchMode?: 'google' | 'auto' | 'catalog';
  autoEnrichImages?: boolean;
}

export interface SearchOnlineResult {
  exercises: Exercise[];
  source: 'google' | 'gemini' | 'online-catalog' | 'fallback';
  totalFound: number;
  searchQueries?: string[];
  autoUpdatedInDbCount?: number;
  imagesEnrichedCount?: number;
}

export interface ImageSearchResult {
  imageUrl: string;
  thumbUrl?: string;
  title?: string;
  source: string;
}

/**
 * Checks if an exercise has no visual image or only a placeholder/empty string
 */
export function isExerciseMissingImage(exercise: Partial<Exercise> | null | undefined): boolean {
  if (!exercise) return true;
  if (!exercise.imageUrl) return true;
  const url = exercise.imageUrl.trim();
  if (url === '') return true;
  if (url.includes('placeholder') || url.includes('placeholder.com')) return true;
  return false;
}

/**
 * Checks if an exercise is new (not yet present in the local database library)
 */
export function isExerciseNew(exercise: Partial<Exercise>): boolean {
  if (!exercise) return true;
  if (exercise.id && db.getExerciseById(exercise.id)) return false;
  if (exercise.name && db.isExerciseInLibrary(exercise.name)) return false;
  return true;
}

/**
 * Determines whether an exercise is new or lacks a visual image reference
 */
export function isExerciseNewOrMissingImage(exercise: Exercise): boolean {
  return isExerciseMissingImage(exercise) || isExerciseNew(exercise);
}

/**
 * Searches for a verified, high-resolution visual reference for an exercise
 * using the backend Image Search API with live Google Search Grounding and fitness library fallback.
 */
export async function searchImageForExercise(params: {
  exerciseName: string;
  primaryMuscle?: string;
  equipment?: string;
}): Promise<ImageSearchResult> {
  const cleanName = (params.exerciseName || '').trim();

  try {
    const res = await fetch('/api/exercises/search-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exerciseName: cleanName,
        primaryMuscle: params.primaryMuscle,
        equipment: params.equipment,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http')) {
        return {
          imageUrl: data.imageUrl,
          thumbUrl: data.thumbUrl,
          title: data.title || cleanName,
          source: data.source || 'api-search',
        };
      }
    }
  } catch (err) {
    console.warn('Network error calling /api/exercises/search-image, using local curated photography:', err);
  }

  // Fallback to verified fitness photo curated registry
  const curated = getBestWebPhotoForExercise(cleanName, params.primaryMuscle);
  return {
    imageUrl: curated || DEFAULT_EXERCISE_IMAGE,
    title: cleanName,
    source: 'curated-fallback',
  };
}

/**
 * Automatically inspects an exercise; if new or missing an image, queries the Image Search API
 * and immediately updates the visual reference in the database if the exercise exists in the library.
 */
export async function ensureAndUpdateExerciseImage(
  exercise: Exercise,
  autoSaveToDb: boolean = true
): Promise<{ updated: boolean; imageUrl: string; exercise: Exercise }> {
  const needsImage = isExerciseMissingImage(exercise);
  const isNew = isExerciseNew(exercise);

  if (needsImage || isNew) {
    const searchRes = await searchImageForExercise({
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
    });

    const newImageUrl = searchRes.imageUrl;
    exercise.imageUrl = newImageUrl;

    let updatedInDb = false;
    if (autoSaveToDb) {
      // Find if this exercise matches an existing record in the database
      const existingInDb = db.getExercises().find(
        e => (exercise.id && e.id === exercise.id) || e.name.trim().toLowerCase() === exercise.name.trim().toLowerCase()
      );

      if (existingInDb) {
        db.updateExercise(existingInDb.id, { imageUrl: newImageUrl });
        updatedInDb = true;
      }
    }

    return {
      updated: updatedInDb || needsImage,
      imageUrl: newImageUrl,
      exercise: { ...exercise, imageUrl: newImageUrl },
    };
  }

  return {
    updated: false,
    imageUrl: exercise.imageUrl,
    exercise,
  };
}

/**
 * Scans all exercises in the database and automatically updates any exercise that lacks an image
 * using the Image Search API.
 */
export async function syncAllMissingImagesInDatabase(): Promise<{
  checked: number;
  updated: number;
  exercises: Exercise[];
}> {
  const allExercises = db.getExercises();
  let updatedCount = 0;

  for (const ex of allExercises) {
    if (isExerciseMissingImage(ex)) {
      const imgRes = await searchImageForExercise({
        exerciseName: ex.name,
        primaryMuscle: ex.primaryMuscle,
        equipment: ex.equipment,
      });

      if (imgRes.imageUrl && imgRes.imageUrl !== ex.imageUrl) {
        db.updateExercise(ex.id, { imageUrl: imgRes.imageUrl });
        updatedCount++;
      }
    }
  }

  return {
    checked: allExercises.length,
    updated: updatedCount,
    exercises: db.getExercises(),
  };
}

/**
 * Primary Exercise Search function with automatic image discovery and database synchronization:
 * When an exercise is identified as new or without an image, it utilizes the image search API
 * to find and automatically update the visual reference in the database.
 */
export async function searchOnlineExercises(params: SearchOnlineParams): Promise<SearchOnlineResult> {
  let rawExercises: Exercise[] = [];
  let source: 'google' | 'gemini' | 'online-catalog' | 'fallback' = 'gemini';
  let totalFound = 0;
  let searchQueries: string[] | undefined = undefined;

  try {
    const res = await fetch('/api/exercises/search-online', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.exercises)) {
        rawExercises = data.exercises;
        source = data.source || 'gemini';
        totalFound = data.totalFound ?? data.exercises.length;
        searchQueries = data.searchQueries;
      }
    }
  } catch (error) {
    console.warn('Network error searching exercises online, using rich local catalog fallback:', error);
  }

  // Client-side fallback if server is unreachable or returned no exercises
  if (rawExercises.length === 0) {
    const clean = (params.query || '').trim().toLowerCase();
    let filtered = ONLINE_EXERCISE_CATALOG.filter(ex => {
      const matchText = !clean ||
        ex.name.toLowerCase().includes(clean) ||
        ex.primaryMuscle.toLowerCase().includes(clean) ||
        ex.equipment.toLowerCase().includes(clean) ||
        ex.type.toLowerCase().includes(clean) ||
        ex.secondaryMuscles.some(m => m.toLowerCase().includes(clean));

      const matchMuscle = !params.muscleGroup || params.muscleGroup === 'Todos' || ex.primaryMuscle === params.muscleGroup;
      const matchEquip = !params.equipment || params.equipment === 'Todos' || ex.equipment === params.equipment;

      return matchText && matchMuscle && matchEquip;
    });

    if (filtered.length === 0) {
      filtered = ONLINE_EXERCISE_CATALOG;
    }

    rawExercises = filtered.slice(0, params.limit || 8);
    source = 'online-catalog';
    totalFound = filtered.length;
  }

  // AUTOMATIC IMAGE SEARCH & DATABASE SYNCHRONIZATION MECHANISM:
  // For every identified exercise that is new or without an image:
  // 1. Utilize the Image Search API to find a high-resolution visual reference.
  // 2. Automatically update the visual reference of the exercise in the database.
  let autoUpdatedInDbCount = 0;
  let imagesEnrichedCount = 0;

  const currentDbExercises = db.getExercises();

  // Process exercises concurrently
  const enrichedExercises = await Promise.all(
    rawExercises.map(async (ex) => {
      const missingImage = isExerciseMissingImage(ex);
      const isNew = isExerciseNew(ex);

      if (missingImage || isNew) {
        // Query the image search API
        const imgResult = await searchImageForExercise({
          exerciseName: ex.name,
          primaryMuscle: ex.primaryMuscle,
          equipment: ex.equipment,
        });

        const newImageUrl = imgResult.imageUrl;
        imagesEnrichedCount++;

        // Check if this exercise already exists in the database
        const existingInDb = currentDbExercises.find(
          dbEx => (ex.id && dbEx.id === ex.id) || dbEx.name.trim().toLowerCase() === ex.name.trim().toLowerCase()
        );

        // If it exists in the database and was missing an image or had a generic placeholder,
        // automatically update its visual reference in the database!
        if (existingInDb && isExerciseMissingImage(existingInDb)) {
          db.updateExercise(existingInDb.id, { imageUrl: newImageUrl });
          autoUpdatedInDbCount++;
        }

        return {
          ...ex,
          imageUrl: newImageUrl,
        };
      }

      return ex;
    })
  );

  return {
    exercises: enrichedExercises,
    source,
    totalFound,
    searchQueries,
    autoUpdatedInDbCount,
    imagesEnrichedCount,
  };
}
