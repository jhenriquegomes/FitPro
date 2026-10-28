import { db } from './db';

interface CoachTipRequest {
  exerciseName: string;
  primaryMuscle?: string;
  currentSet?: number;
  targetReps?: number | string;
  loadKg?: number;
  userGoal?: string;
  level?: string;
  language?: 'pt-br' | 'en';
}

interface CoachTipResponse {
  tip: string;
  source: 'gemini' | 'smart-engine' | 'fallback';
}

const tipsCache = new Map<string, string>();

export async function getGeminiCoachTip(params: CoachTipRequest): Promise<string> {
  const currentLang = params.language || db.getLanguage();
  const cacheKey = `${params.exerciseName}_set${params.currentSet || 1}_${currentLang}`;
  if (tipsCache.has(cacheKey)) {
    return tipsCache.get(cacheKey)!;
  }

  try {
    const res = await fetch('/api/gemini/coach-tip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...params, language: currentLang }),
    });

    if (res.ok) {
      const data: CoachTipResponse = await res.json();
      if (data.tip) {
        tipsCache.set(cacheKey, data.tip);
        return data.tip;
      }
    }
  } catch {
    // Graceful fallback to rich physiological guidance
  }

  // High quality client-side physiological fallback
  const fallback = currentLang === 'en'
    ? `Maintain eccentric phase for 2 to 3 seconds and feel the deep stretch in your ${params.primaryMuscle || 'target muscle'}. Exhale powerfully during the lifting phase!`
    : `Mantenha a fase excêntrica em 2 a 3 segundos e sinta o alongamento no ${params.primaryMuscle || 'músculo trabalhado'}. Expire o ar na fase de esforço!`;
  tipsCache.set(cacheKey, fallback);
  return fallback;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

export async function sendCoachChatMessage(
  message: string, 
  history: ChatMessage[], 
  userProfile?: any,
  language?: 'pt-br' | 'en'
): Promise<string> {
  const currentLang = language || db.getLanguage();
  try {
    const res = await fetch('/api/gemini/coach-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory: history.map(m => ({ sender: m.sender, text: m.text })),
        userProfile,
        language: currentLang
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch {
    // Graceful fallback to verified training principles
  }

  return currentLang === 'en'
    ? "Maintain strict form, control every rep cadence, drink at least 2.5L of water daily, and get 7-8 hours of quality sleep for recovery."
    : "Mantenha a postura correta, controle a velocidade em cada repetição e garanta pelo menos 2 litros de água e descanso entre os treinos.";
}

export interface StructuredTip {
  title: string;
  text: string;
  action: string;
}

export async function getCategoryTip(
  category: 'treino' | 'nutricao' | 'recuperacao' | 'cargas' | 'prevencao',
  userProfile?: any,
  language?: 'pt-br' | 'en'
): Promise<StructuredTip> {
  const currentLang = language || db.getLanguage();
  try {
    const res = await fetch('/api/gemini/category-tip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, userProfile, language: currentLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.tip && data.tip.title) {
        return data.tip;
      }
    }
  } catch {
    // Graceful fallback to verified structured guidance
  }

  return currentLang === 'en'
    ? {
        title: 'Form Over Ego',
        text: 'Clean biomechanics and muscle tension always build more muscle than loose momentum.',
        action: 'Perform your first 2 warm-up sets today focusing exclusively on slow eccentric control.'
      }
    : {
        title: 'Qualidade Antes da Quantidade',
        text: 'A evolução muscular sustentável depende de precisão biomecânica, paciência e estímulo constante adaptado ao seu nível.',
        action: 'Concentre-se em executar cada série de hoje com postura impecável.'
      };
}

