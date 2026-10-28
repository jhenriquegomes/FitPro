import { getFirestore, doc, setDoc, getDoc, collection, getDocs, getDocFromServer } from 'firebase/firestore';
import { getApps, getApp, initializeApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Workout, WorkoutHistoryItem, PersonalRecord } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use the database specified in config or default
export const firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Connection test on boot (as required by Firestore guidelines)
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore: client is running in offline mode.');
    }
    return false;
  }
}

// User Profile Cloud Sync
export async function syncUserProfileToCloud(userId: string, userData: Partial<User>): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(firestore, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Silent cloud sync failed (offline or unauthenticated):', err);
  }
}

export async function fetchUserProfileFromCloud(userId: string): Promise<Partial<User> | null> {
  if (!userId) return null;
  try {
    const userRef = doc(firestore, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<User>;
    }
  } catch (err) {
    console.warn('Error fetching cloud profile:', err);
  }
  return null;
}

// Workout Cloud Sync
export async function syncWorkoutToCloud(userId: string, workout: Workout): Promise<void> {
  if (!userId || !workout.id) return;
  try {
    const workoutRef = doc(firestore, 'users', userId, 'workouts', workout.id);
    await setDoc(workoutRef, {
      ...workout,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync workout to cloud:', err);
  }
}

// History Cloud Sync
export async function syncHistoryItemToCloud(userId: string, item: WorkoutHistoryItem): Promise<void> {
  if (!userId || !item.id) return;
  try {
    const histRef = doc(firestore, 'users', userId, 'history', item.id);
    await setDoc(histRef, {
      ...item,
      userId,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync history item to cloud:', err);
  }
}

// Personal Records Cloud Sync
export async function syncPersonalRecordToCloud(userId: string, record: PersonalRecord): Promise<void> {
  if (!userId || !record.id) return;
  try {
    const prRef = doc(firestore, 'users', userId, 'records', record.id);
    await setDoc(prRef, {
      ...record,
      userId,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync record to cloud:', err);
  }
}
