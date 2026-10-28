import { db } from './db';
import { DayOfWeek } from '../types';

const DAYS_ORDER: DayOfWeek[] = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];
const LAST_REMINDER_KEY = 'fitpro_last_reminder_date';

/**
 * Checks if the browser supports Notification API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests permission to show desktop/mobile browser notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Plays a short, pleasant synthetic chime using Web Audio API
 * (no external audio assets required)
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth chime: C5 -> G5 -> C6
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export interface SendNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

/**
 * Dispatches a native browser notification
 */
export async function sendNativeNotification(
  title: string, 
  options: SendNotificationOptions = {}
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultIcon = '/favicon.ico';
  const notifOptions: any = {
    body: options.body || '',
    icon: options.icon || defaultIcon,
    badge: defaultIcon,
    tag: options.tag || 'fitpro-reminder',
    renotify: true,
    data: options.data
  };

  try {
    // 1. Try ServiceWorker registration first (superior mobile/PWA background support)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, notifOptions);
          return true;
        }
      } catch {
        // Fallback to window.Notification
      }
    }

    // 2. Standard window Notification
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (error) {
    console.warn('Could not dispatch browser notification:', error);
    return false;
  }
}

/**
 * Get details for today's scheduled workout
 */
export function getTodayWorkoutInfo() {
  const weeklySchedule = db.getWeeklySchedule();
  const workouts = db.getWorkouts();
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const currentDayOfWeek = DAYS_ORDER[todayIndex];
  const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === currentDayOfWeek);

  const todaysWorkout = todaySchedule?.workoutId 
    ? workouts.find(w => w.id === todaySchedule.workoutId) 
    : null;

  return {
    dayOfWeek: currentDayOfWeek,
    isRest: todaySchedule?.isRest || false,
    workout: todaysWorkout,
    notes: todaySchedule?.notes
  };
}

/**
 * Check if it is time to trigger the daily workout reminder
 * @param force If true, triggers regardless of time or whether already sent today (for testing)
 */
export async function checkDailyWorkoutReminder(force = false): Promise<{
  triggered: boolean;
  reason: string;
  workoutTitle?: string;
}> {
  if (!isNotificationSupported()) {
    return { triggered: false, reason: 'Navegador não suporta a Notification API' };
  }

  const settings = db.getSettings();
  const notifSettings = settings.notifications;

  if (!force && !notifSettings?.workoutReminders) {
    return { triggered: false, reason: 'Lembretes de treino estão desativados nas configurações' };
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    return { triggered: false, reason: `Permissão de notificação não concedida (${permission})` };
  }

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const lastReminderDate = localStorage.getItem(LAST_REMINDER_KEY);

  // If already triggered today and not forced, skip
  if (!force && lastReminderDate === todayDateStr) {
    return { triggered: false, reason: 'Lembrete de hoje já foi disparado' };
  }

  // Check scheduled time match
  const reminderTime = notifSettings?.reminderTime || '18:30';
  const [targetH, targetM] = reminderTime.split(':').map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  if (!force) {
    // Allow a 15-minute window if the user opens the app around the target time
    const targetTotalMin = targetH * 60 + targetM;
    const currentTotalMin = currentH * 60 + currentM;
    const diff = currentTotalMin - targetTotalMin;

    if (diff < 0 || diff > 15) {
      return { triggered: false, reason: `Fora do horário agendado (${reminderTime})` };
    }
  }

  // Build reminder content based on today's schedule
  const todayInfo = getTodayWorkoutInfo();
  let title = '💪 Hora do Treino FitPro!';
  let body = `São ${reminderTime}! Hora de treinar e manter a sua sequência!`;
  let workoutTitle: string | undefined = undefined;

  if (todayInfo.isRest) {
    title = '🧘 Dia de Descanso e Recuperação';
    body = 'Hoje é seu dia de descanso planejado no FitPro. Hidrate-se bem, alongue-se e recupere as energias!';
  } else if (todayInfo.workout) {
    workoutTitle = todayInfo.workout.title;
    title = `🏋️‍♂️ Hora do Treino: ${workoutTitle}`;
    body = `Seu treino de hoje (${workoutTitle}) tem ${todayInfo.workout.exercises.length} exercícios planejados. Vamos com tudo!`;
  } else {
    title = '🔥 Hora de se Exercitar!';
    body = `Horário agendado para o seu treino diário (${reminderTime}). Abra o FitPro e escolha sua rotina de hoje!`;
  }

  const success = await sendNativeNotification(title, {
    body,
    tag: 'fitpro-daily-workout',
    data: { url: '/', date: todayDateStr }
  });

  if (success) {
    localStorage.setItem(LAST_REMINDER_KEY, todayDateStr);
    if (notifSettings?.soundEffects !== false) {
      playNotificationSound();
    }
    return { triggered: true, reason: 'Notificação disparada com sucesso', workoutTitle };
  }

  return { triggered: false, reason: 'Falha ao exibir notificação nativa' };
}
