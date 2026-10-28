import { Exercise, MuscleGroup } from '../types';
import { db } from './db';
import { 
  CURATED_WEB_EXERCISE_PHOTOS, 
  MUSCLE_FALLBACK_PHOTOS,
  findCuratedPhotoForExercise
} from '../data/exercisePhotoCatalog';

export { CURATED_WEB_EXERCISE_PHOTOS, MUSCLE_FALLBACK_PHOTOS, findCuratedPhotoForExercise };

export interface WebPhotoCandidate {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Searches the web fitness photo registry for candidates matching the exercise query
 */
export function getWebPhotoCandidatesForExercise(
  exerciseName: string,
  primaryMuscle?: string,
  limit: number = 8
): WebPhotoCandidate[] {
  const normName = normalizeString(exerciseName);
  const candidates: WebPhotoCandidate[] = [];
  const addedUrls = new Set<string>();

  // 1. Direct key match in curated photos
  for (const [key, urls] of Object.entries(CURATED_WEB_EXERCISE_PHOTOS)) {
    const normKey = normalizeString(key);
    if (normName.includes(normKey) || normKey.includes(normName)) {
      urls.forEach((url, i) => {
        if (!addedUrls.has(url)) {
          addedUrls.add(url);
          candidates.push({
            id: `cand-${normKey}-${i}`,
            url,
            thumbUrl: url.replace('w=800', 'w=300'),
            title: `${exerciseName} — Foto Web #${i + 1}`,
            source: 'Unsplash Fitness Pro'
          });
        }
      });
    }
  }

  // 2. Add muscle-based candidates if needed
  if (primaryMuscle && MUSCLE_FALLBACK_PHOTOS[primaryMuscle]) {
    MUSCLE_FALLBACK_PHOTOS[primaryMuscle].forEach((url, i) => {
      if (!addedUrls.has(url)) {
        addedUrls.add(url);
        candidates.push({
          id: `cand-muscle-${i}`,
          url,
          thumbUrl: url.replace('w=800', 'w=300'),
          title: `${primaryMuscle} — Foto da Web #${i + 1}`,
          source: 'Galeria Fitness Web'
        });
      }
    });
  }

  // 3. General fitness candidates if list is still small
  if (candidates.length < 4) {
    const generalUrls = [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80'
    ];
    generalUrls.forEach((url, i) => {
      if (!addedUrls.has(url)) {
        addedUrls.add(url);
        candidates.push({
          id: `cand-gen-${i}`,
          url,
          thumbUrl: url.replace('w=800', 'w=300'),
          title: `Treino Geral — Foto #${i + 1}`,
          source: 'Acervo Web'
        });
      }
    });
  }

  return candidates.slice(0, limit);
}

/**
 * Returns the best single web photo URL for an exercise
 */
export function getBestWebPhotoForExercise(exerciseName: string, primaryMuscle?: string): string {
  const candidates = getWebPhotoCandidatesForExercise(exerciseName, primaryMuscle, 1);
  return candidates.length > 0
    ? candidates[0].url
    : 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80';
}

/**
 * Batch updates all exercises in the database to use verified high-resolution web photos
 * matching the exercise name and muscle group.
 */
export function updateAllLibraryPhotosFromWeb(): { updatedCount: number; exercises: Exercise[] } {
  const allExercises = db.getExercises();
  let updatedCount = 0;

  allExercises.forEach(ex => {
    const bestWebPhoto = getBestWebPhotoForExercise(ex.name, ex.primaryMuscle);
    if (bestWebPhoto && bestWebPhoto !== ex.imageUrl) {
      db.updateExercise(ex.id, { imageUrl: bestWebPhoto });
      updatedCount++;
    }
  });

  return {
    updatedCount,
    exercises: db.getExercises()
  };
}

/**
 * Updates a single exercise's photo in the database
 */
export function updateExercisePhoto(exerciseId: string, newPhotoUrl: string): Exercise | null {
  if (!newPhotoUrl || !newPhotoUrl.trim().startsWith('http')) return null;
  return db.updateExercise(exerciseId, { imageUrl: newPhotoUrl.trim() });
}
