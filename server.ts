import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { ONLINE_EXERCISE_CATALOG } from "./src/data/onlineExerciseCatalog";
import { findCuratedPhotoForExercise } from "./src/data/exercisePhotoCatalog";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Security: Enforce request body limits to prevent flooding
app.use(express.json({ limit: "512kb" }));

// Security helper: sanitize strings
function sanitizeInput(val: unknown, maxLen = 120): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

// Performance: High-speed In-Memory TTL Cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries = 300) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs = 15 * 60 * 1000): void {
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }
}

const exerciseSearchCache = new MemoryCache<any>(300);
const imageSearchCache = new MemoryCache<any>(300);
const coachTipCache = new MemoryCache<string>(250);

// Lazy Gemini Client with Quota Monitoring & Silent Smart Engine Fallback
let aiClient: GoogleGenAI | null = null;
let geminiQuotaExhaustedUntil = 0;

function isGeminiQuotaExhausted(): boolean {
  return Date.now() < geminiQuotaExhaustedUntil;
}

function markGeminiQuotaExhausted(minutes = 30): void {
  geminiQuotaExhaustedUntil = Date.now() + minutes * 60 * 1000;
}

function isQuotaDepletedError(error: any): boolean {
  const errMsg = String(error?.message || error || '');
  const status = error?.status || error?.code || '';
  return (
    errMsg.includes('402') ||
    errMsg.includes('prepayment') ||
    errMsg.includes('depleted') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('429') ||
    errMsg.includes('quota') ||
    status === 402 ||
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED'
  );
}

function handleGeminiError(error: any): boolean {
  if (isQuotaDepletedError(error)) {
    markGeminiQuotaExhausted(30);
    return true;
  }
  return false;
}

function getAI(): GoogleGenAI | null {
  if (isGeminiQuotaExhausted()) {
    return null; // Gracefully route to high-speed verified fitness engine
  }
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    aiEngine: isGeminiQuotaExhausted() ? 'smart-local-engine' : 'gemini-active'
  });
});

// Gemini AI Coach Tip Endpoint
app.post("/api/gemini/coach-tip", async (req, res) => {
  try {
    const { exerciseName, primaryMuscle, currentSet, targetReps, loadKg, userGoal, level, language = 'pt-br' } = req.body;
    const isEnglish = language === 'en';

    const ai = getAI();
    if (!ai) {
      if (isEnglish) {
        const defaultTipsEn: Record<string, string> = {
          'Bench Press': 'Keep scapulae retracted and elbows at ~60° to torso. Do not bounce the bar off your chest and squeeze your pecs at the top!',
          'Squat': 'Drive through heels, keep chest up, knees tracking toes. Inhale on descent and forcefully exhale on ascent!',
          'Deadlift': 'Maintain neutral spine and keep bar glued to shins. Drive through the floor, extend hips without hyperextending at lockout!',
          'Lat Pulldown': 'Pull with your elbows pointing down, not through forearm flexors. Depress your scapulae before initiating the pull!',
          'Shoulder Press': 'Keep core braced to protect your lumbar spine. Press overhead without excessively arching your back!'
        };
        const matched = Object.keys(defaultTipsEn).find(k => (exerciseName || '').toLowerCase().includes(k.toLowerCase()));
        const tip = matched 
          ? defaultTipsEn[matched]
          : `Focus on controlled tempo (2s lowering) and peak contraction in your ${primaryMuscle || 'target muscle'}. Keep core tight!`;
        return res.json({ tip, source: 'smart-engine' });
      }

      // Fallback smart coach tips when API key is not yet set (PT-BR)
      const defaultTips: Record<string, string> = {
        'Supino': 'Mantenha as escápulas aduzidas e os cotovelos a ~60° do tronco. Não bata a barra no peito e sinta o peitoral contrair na subida!',
        'Agachamento': 'Mantenha os calcanhares cravados no chão, peito aberto e joelhos alinhados com as pontas dos pés. Respire na descida e suba expulsando o ar!',
        'Levantamento Terra': 'Lombar neutra e barra colada na canela. O movimento começa nas pernas e estende com o quadril, sem hiperextensão no topo!',
        'Puxada': 'Puxe com os cotovelos apontando para baixo, não com a força do antebraço. Deprima as escápulas antes de puxar!',
        'Desenvolvimento': 'Mantenha o abdômen travado (brace) para proteger a lombar. Eleve a carga sem arquear excessivamente a coluna!'
      };

      const matchedKey = Object.keys(defaultTips).find(k => (exerciseName || '').toLowerCase().includes(k.toLowerCase()));
      const fallbackTip = matchedKey 
        ? defaultTips[matchedKey]
        : `Foque na cadência controlada (2s na descida) e contração máxima do músculo alvo (${primaryMuscle || 'músculo trabalhado'}). Mantenha o abdômen firme!`;

      return res.json({
        tip: fallbackTip,
        source: 'smart-engine'
      });
    }

    const prompt = isEnglish ? `You are an elite strength coach and sports physiologist at FitPro.
The athlete is performing "${exerciseName}" (${primaryMuscle || 'general'}).
Current details:
- Current set: ${currentSet || 1}
- Target reps: ${targetReps || '8-12'}
- Load: ${loadKg ? `${loadKg}kg` : 'Bodyweight'}
- Goal: ${userGoal || 'Hypertrophy'}
- Level: ${level || 'Intermediate'}

Provide a short, direct and technical biomechanical and motivational tip (maximum 2 to 3 sentences) in English.
Focus on mind-muscle connection, posture cue, and breathing/eccentric tempo. Keep it concise like a personal trainer right next to the athlete.` : `Você é um treinador de musculação de elite e fisiologista esportivo da FitPro.
O atleta está realizando o exercício "${exerciseName}" (${primaryMuscle || 'geral'}).
Detalhes atuais:
- Série atual: ${currentSet || 1}
- Repetições alvo: ${targetReps || '8-12'}
- Carga: ${loadKg ? `${loadKg}kg` : 'Peso corporal'}
- Objetivo do usuário: ${userGoal || 'Hipertrofia'}
- Nível de experiência: ${level || 'Intermediário'}

Forneça uma dica biomecânica e motivacional curta, direta e técnica (máximo de 2 a 3 frases) em português do Brasil.
Foque em:
1. Conexão mente-músculo e ajuste postural específico para o movimento.
2. Dica de respiração ou cadência excêntrica.
Não use enrolação, seja prático e encorajador como um personal trainer ao lado do atleta.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: isEnglish ? 'You are a concise, technical and encouraging elite strength coach.' : 'Você é um treinador de musculação técnico, acolhedor e direto ao ponto.',
        temperature: 0.7,
      }
    });

    const tip = response.text?.trim() || (isEnglish ? 'Focus on maximum tension and controlled eccentric phase!' : 'Mantenha o foco na contração máxima e controle da fase excêntrica!');

    return res.json({
      tip,
      source: 'gemini'
    });
  } catch (error: any) {
    handleGeminiError(error);
    const isEn = req.body?.language === 'en';
    return res.json({
      tip: isEn 
        ? 'Maintain strict alignment, breathe rhythmically, and focus on slow eccentric cadence to maximize fiber recruitment!'
        : 'Mantenha a postura alinhada, respire de forma ritmada e foque na cadência controlada para recrutar o máximo de fibras musculares!',
      source: 'smart-engine'
    });
  }
});

// Gemini Q&A Chat Endpoint for Tips Area
app.post("/api/gemini/coach-chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], userProfile, language = 'pt-br' } = req.body;
    const isEnglish = language === 'en';
    if (!message) {
      return res.status(400).json({ error: isEnglish ? "Message is required." : "Mensagem é obrigatória." });
    }

    const ai = getAI();
    if (!ai) {
      // Smart local fallback responses
      const query = message.toLowerCase();
      if (isEnglish) {
        let replyEn = "Maintain workout consistency and prioritize muscle recovery with 7-8 hours of sleep and adequate hydration (35 to 45ml per kg).";
        if (query.includes('bench') || query.includes('chest')) {
          replyEn = "To increase your bench press: retract and depress scapulae, plant your feet firmly for leg drive, and maintain elbows around 60° from torso to protect shoulders.";
        } else if (query.includes('squat') || query.includes('leg')) {
          replyEn = "On squats: keep core braced, chest up, knees tracking in line with toes, and heels flat on the floor.";
        } else if (query.includes('protein') || query.includes('diet') || query.includes('eat')) {
          replyEn = "For hypertrophy and retention, consume 1.6g to 2.2g of protein per kg of bodyweight daily distributed across 3 to 5 meals.";
        } else if (query.includes('creatine')) {
          replyEn = "Creatine works via cellular saturation: take 3g to 5g daily, even on rest days, preferably with carbohydrates.";
        }
        return res.json({ reply: replyEn, source: 'smart-engine' });
      }

      let reply = "Mantenha a consistência no treino e priorize a recuperação muscular com 7-8h de sono e ingestão adequada de água (35 a 45ml por kg).";
      if (query.includes('supino') || query.includes('peito')) {
        reply = "Para evoluir no supino: aduza bem as escápulas, apoie firmemente os pés no solo (leg drive) e mantenha os cotovelos a ~60° do tronco para proteger os ombros. Experimente fazer séries com pausa de 1s no peito!";
      } else if (query.includes('agachamento') || query.includes('perna')) {
        reply = "No agachamento: mantenha o tronco firme, joelhos acompanhando a ponta dos pés e calcanhares colados no chão. Se faltar amplitude, trabalhe a mobilidade de tornozelo!";
      } else if (query.includes('proteina') || query.includes('comer') || query.includes('dieta')) {
        reply = "Para hipertrofia e retenção muscular, busque consumir entre 1.6g e 2.2g de proteína por kg de peso corporal ao dia, distribuídos em 3 a 5 refeições com fontes de alto valor biológico.";
      } else if (query.includes('creatina')) {
        reply = "A creatina funciona por saturação celular: tome de 3g a 5g todos os dias, inclusive nos dias de descanso, preferencialmente junto de uma refeição com carboidrato para melhor absorção.";
      } else if (query.includes('dor') || query.includes('recupera')) {
        reply = "A dor muscular tardia (DOMS) é normal no início. Faça caminhadas leves, hidrate-se bem, mantenha o aporte calórico/proteico e não pule o aquecimento das articulações antes das séries de trabalho!";
      }
      return res.json({ reply, source: 'smart-engine' });
    }

    const athleteContext = userProfile ? (isEnglish ? `
Athlete Profile:
- Name: ${userProfile.name || 'Athlete'}
- Goal: ${userProfile.goal || 'Hypertrophy'}
- Level: ${userProfile.experienceLevel || 'Intermediate'}
- Frequency: ${userProfile.daysPerWeek || 4} days/week
- Weight: ${userProfile.weight || 75} kg, Height: ${userProfile.height || 175} cm
` : `
Perfil do Atleta:
- Nome: ${userProfile.name || 'Atleta'}
- Objetivo: ${userProfile.goal || 'Hipertrofia'}
- Nível: ${userProfile.experienceLevel || 'Intermediário'}
- Frequência: ${userProfile.daysPerWeek || 4} dias/semana
- Peso: ${userProfile.weight || 75} kg, Altura: ${userProfile.height || 175} cm
- Local: ${userProfile.trainingLocation || 'Academia'}
`) : '';

    const systemPrompt = isEnglish ? `You are the Official AI Coach of FitPro, an elite strength coach and sports nutritionist.
${athleteContext}
Guidelines:
1. Be motivating, technical, empathetic, and concise.
2. Provide practical and immediately actionable guidance (maximum 2 to 4 short paragraphs or bullet points).
3. Answer strictly in English.
4. Never recommend anabolic steroids or high-risk joint actions.` : `Você é o Treinador Oficial de IA do FitPro, um personal trainer de elite, mestre em biomecânica e nutrição esportiva.
${athleteContext}
Diretrizes:
1. Seja motivador, técnico, empático e conciso.
2. Dê orientações práticas e aplicáveis imediatamente (máximo de 2 a 4 parágrafos curtos ou bullet points objetivos).
3. Responda sempre em português do Brasil com linguagem acessível, segura e profissional.
4. Jamais recomende esteroides anabolizantes ou atitudes arriscadas para a saúde articular.`;

    const contents = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-4)) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const reply = response.text?.trim() || (isEnglish ? "Focus on immaculate technique and weekly progressive overload!" : "Foque na execução correta de cada repetição e na sobrecarga progressiva semanal!");
    return res.json({ reply, source: 'gemini' });
  } catch (error: any) {
    handleGeminiError(error);
    const isEn = req.body?.language === 'en';
    return res.json({
      reply: isEn 
        ? 'Gradually add progressive overload, rest 90s to 2min between sets, and prioritize technique over sheer weight.'
        : 'Ajuste a sobrecarga progressiva aos poucos, mantenha o descanso entre séries de 1m30s a 2min e priorize a boa execução sobre a carga absoluta.',
      source: 'smart-engine'
    });
  }
});

// Gemini Category Specific Tips Endpoint
app.post("/api/gemini/category-tip", async (req, res) => {
  try {
    const { category, userProfile, language = 'pt-br' } = req.body;
    const isEnglish = language === 'en';
    const ai = getAI();

    const categoryNamesPt: Record<string, string> = {
      treino: 'Biomecânica, técnica de execução e divisão de treino',
      nutricao: 'Nutrição esportiva, hidratação e timing de refeições',
      recuperacao: 'Recuperação muscular, descanso e qualidade do sono',
      cargas: 'Sobrecarga progressiva, quebra de platôs e periodização',
      prevencao: 'Mobilidade articular, aquecimento e prevenção de lesões'
    };

    const categoryNamesEn: Record<string, string> = {
      treino: 'Biomechanics, lifting technique and workout splits',
      nutricao: 'Sports nutrition, hydration and nutrient timing',
      recuperacao: 'Muscle recovery, rest and sleep quality',
      cargas: 'Progressive overload, plateau breaking and periodization',
      prevencao: 'Joint mobility, warming up and injury prevention'
    };

    const targetTopic = isEnglish ? (categoryNamesEn[category] || 'General fitness training') : (categoryNamesPt[category] || 'Treinamento físico geral');

    const fallbacksEn: Record<string, { title: string; text: string; action: string }> = {
      treino: {
        title: 'Control the Eccentric',
        text: 'Lowering weights for 2 to 3 seconds creates greater muscle fiber recruitment and reduces joint strain by up to 40% compared to dropping the weight.',
        action: 'On compound lifts today, count to 2 mentally during the descent of every rep.'
      },
      nutricao: {
        title: 'Intra-Workout Hydration',
        text: 'Losing just 2% of body weight in fluid can drop strength by up to 15%. Sip 150ml every 15-20 minutes.',
        action: 'Keep your bottle filled and drink 500ml over the 2 hours before your workout.'
      },
      recuperacao: {
        title: 'Deep Sleep & GH',
        text: 'Over 80% of daily growth hormone is released during non-REM deep sleep. Less than 7 hours compromises muscle protein synthesis.',
        action: 'Turn off screens 45 minutes before sleep to boost natural melatonin.'
      },
      cargas: {
        title: 'Micro-Overload Principle',
        text: 'You do not need to add 5kg at once. Adding 1kg to 2kg or an extra rep with the same weight constitutes sustainable progressive overload.',
        action: 'Target 1 extra rep on your first set of your primary movement next session.'
      },
      prevencao: {
        title: 'Specific Warm-Up Sets',
        text: 'Treadmill walking does not prepare rotator cuffs or hip capsules. Perform 2 light sets with 30-40% weight before working sets.',
        action: 'Perform arm circles and light movement patterns before heavy loading.'
      }
    };

    const fallbacks: Record<string, { title: string; text: string; action: string }> = {
      treino: {
        title: 'Controle da Fase Excêntrica',
        text: 'Estudos demonstram que descer o peso em 2 a 3 segundos gera maior microlesão controlada das fibras musculares e reduz em até 40% o estresse articular comparado a soltar o peso rápido.',
        action: 'Nos seus exercícios compostos de hoje, conte mentalmente até 2 na descida de cada repetição.'
      },
      nutricao: {
        title: 'Timing de Hidratação Intratreino',
        text: 'A perda de apenas 2% do peso corporal em líquidos durante o treino reduz a força em até 15%. Beba pequenos goles de 150ml a cada 15-20 minutos.',
        action: 'Mantenha sua garrafa de água cheia e beba 500ml nas 2 horas anteriores ao treino.'
      },
      recuperacao: {
        title: 'Sono Profundo e Liberação de GH',
        text: 'Mais de 80% do hormônio do crescimento (GH) diário é secretado durante o sono profundo não-REM. Dormir menos de 7 horas compromete a síntese proteica.',
        action: 'Evite luzes fortes e telas 45 minutos antes de dormir para aumentar a melatonina natural.'
      },
      cargas: {
        title: 'Princípio da Sobrecarga Fracionada',
        text: 'Você não precisa aumentar 5kg de uma vez. Subir 1kg a 2kg por semana ou adicionar 1 repetição a mais com a mesma carga já caracteriza sobrecarga progressiva sustentável.',
        action: 'Escolha 1 exercício do seu próximo treino para buscar 1 repetição extra na primeira série.'
      },
      prevencao: {
        title: 'Aquecimento Específico vs Geral',
        text: 'Caminhar 5 minutos na esteira ajuda, mas não prepara os manguitos e tendões para um supino ou agachamento. Faça 2 séries leves com 30% da carga antes das séries válidas.',
        action: 'Realize rotações de ombros ou agachamentos com peso corporal antes de carregar as barras.'
      }
    };

    const getFallbackTip = () => {
      const fb = isEnglish ? (fallbacksEn[category] || fallbacksEn.treino) : (fallbacks[category] || fallbacks.treino);
      return fb;
    };

    if (!ai) {
      return res.json({ tip: getFallbackTip(), source: 'smart-engine' });
    }

    const athleteContext = userProfile ? `Objetivo do atleta: ${userProfile.goal}, nível: ${userProfile.experienceLevel}, peso: ${userProfile.weight}kg, altura: ${userProfile.height}cm.` : '';

    const prompt = isEnglish ? `Generate 1 practical, high-impact and scientifically sound tip regarding "${targetTopic}".
${athleteContext}
Return strictly JSON matching:
{
  "title": "Short title (max 5 words)",
  "text": "Scientific and clear explanation of 2 to 3 sentences in English",
  "action": "Immediate practical action step for today (1 sentence)"
}` : `Gere 1 dica prática, inovadora e de alto impacto sobre "${targetTopic}".
${athleteContext}
Retorne estritamente em formato JSON com o seguinte schema:
{
  "title": "Título curto e instigante (máx 5 palavras)",
  "text": "Explicação científica e clara de 2 a 3 frases em português do Brasil",
  "action": "Ação prática e direta para aplicar hoje (1 frase)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    try {
      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.title && parsed.text) {
        return res.json({ tip: parsed, source: 'gemini' });
      }
    } catch {
      // fallback if JSON parse fails
    }

    return res.json({
      tip: getFallbackTip(),
      source: 'smart-engine'
    });
  } catch (error: any) {
    handleGeminiError(error);
    const isEn = req.body?.language === 'en';
    const cat = req.body?.category || 'treino';
    const defaultPt: Record<string, { title: string; text: string; action: string }> = {
      treino: {
        title: 'Controle da Fase Excêntrica',
        text: 'Descer a carga controlando a velocidade entre 2 e 3 segundos gera maior ativação miofibrilar e protege as articulações.',
        action: 'Em todos os exercícios de hoje, conte mentalmente até 2 na descida.'
      },
      nutricao: {
        title: 'Timing de Hidratação',
        text: 'Manter o aporte de líquidos antes e durante a sessão preserva a taxa de esforço e previne fadiga precoce.',
        action: 'Beba 150ml a cada 15 a 20 minutos durante o treino.'
      },
      recuperacao: {
        title: 'Sono e Reparo Tecidual',
        text: 'A recuperação completa das fibras musculares ocorre durante as fases profundas do descanso noturno.',
        action: 'Mantenha o quarto escuro e durma pelo menos 7 a 8 horas hoje.'
      },
      cargas: {
        title: 'Progressão Milimétrica',
        text: 'Adicionar 1 repetição com a mesma carga ou 1kg a mais na barra consolida a sobrecarga progressiva sem risco de lesão.',
        action: 'Tente 1 repetição extra na sua primeira série válida.'
      },
      prevencao: {
        title: 'Aquecimento Articular',
        text: 'Séries preparatórias com carga leve preparam tendões e líquido sinovial antes das cargas de trabalho.',
        action: 'Faça 2 séries com 30% a 40% do peso antes de começar pesado.'
      }
    };
    const defaultEn: Record<string, { title: string; text: string; action: string }> = {
      treino: {
        title: 'Control the Eccentric',
        text: 'Controlling the negative phase for 2-3 seconds enhances tension and joint protection.',
        action: 'Count to 2 during the lowering phase of every rep.'
      },
      nutricao: {
        title: 'Hydration Strategy',
        text: 'Staying hydrated sustains muscular contractility and mitigates cardiovascular drift.',
        action: 'Sip 150ml of water every 15-20 minutes during training.'
      },
      recuperacao: {
        title: 'Sleep & Muscle Synthesis',
        text: 'Peak restorative hormonal surges occur during deep REM and non-REM cycles.',
        action: 'Prioritize 7-8 hours of sound sleep in a cool, dark room.'
      },
      cargas: {
        title: 'Micro-Progression',
        text: 'Gaining even a single repetition with strict form drives sustained hypertrophy.',
        action: 'Push for one additional clean repetition on your primary movement.'
      },
      prevencao: {
        title: 'Warm-up Specificity',
        text: 'Ramping up with light sets primes neuromuscular patterns and synovial lubrication.',
        action: 'Perform 2 light warm-up sets before challenging working loads.'
      }
    };

    const chosen = isEn ? (defaultEn[cat] || defaultEn.treino) : (defaultPt[cat] || defaultPt.treino);
    return res.json({
      tip: chosen,
      source: 'smart-engine'
    });
  }
});

// Search and discover exercises online via Google Search, Gemini AI & Online Catalog
app.post("/api/exercises/search-online", async (req, res) => {
  try {
    const query = sanitizeInput(req.body?.query, 80);
    const muscleGroup = sanitizeInput(req.body?.muscleGroup || "Todos", 40);
    const equipment = sanitizeInput(req.body?.equipment || "Todos", 40);
    const limit = Math.min(Math.max(Number(req.body?.limit) || 8, 1), 24);
    const searchMode = sanitizeInput(req.body?.searchMode || "auto", 20);

    const cleanQuery = query.toLowerCase();
    const isGoogleSearchMode = searchMode === "google";
    const cacheKey = `${cleanQuery}:${muscleGroup}:${equipment}:${searchMode}:${limit}`;

    const cached = exerciseSearchCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // 1. If not strictly in Google Search mode, check our verified rich online catalog first for instant matching
    const catalogMatches = ONLINE_EXERCISE_CATALOG.filter(ex => {
      const matchText = !cleanQuery || 
        ex.name.toLowerCase().includes(cleanQuery) ||
        ex.primaryMuscle.toLowerCase().includes(cleanQuery) ||
        ex.equipment.toLowerCase().includes(cleanQuery) ||
        ex.type.toLowerCase().includes(cleanQuery) ||
        ex.secondaryMuscles.some(m => m.toLowerCase().includes(cleanQuery));

      const matchMuscle = muscleGroup === "Todos" || ex.primaryMuscle === muscleGroup;
      const matchEquip = equipment === "Todos" || ex.equipment === equipment;

      return matchText && matchMuscle && matchEquip;
    });

    if (!isGoogleSearchMode && (catalogMatches.length >= 3 || (!cleanQuery && catalogMatches.length > 0))) {
      const responsePayload = {
        exercises: catalogMatches.slice(0, limit),
        source: "online-catalog",
        totalFound: catalogMatches.length
      };
      exerciseSearchCache.set(cacheKey, responsePayload, 20 * 60 * 1000);
      return res.json(responsePayload);
    }

    // 2. Perform live Google Search or AI biomechanical synthesis with Gemini
    const ai = getAI();
    if (ai) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Gemini timeout")), isGoogleSearchMode ? 16000 : 14000)
        );

        let geminiPromise: Promise<any>;

        if (isGoogleSearchMode) {
          // Live Google Search Grounding
          const googlePrompt = `Você é um especialista em biomecânica e musculação com acesso direto à pesquisa do Google.
O usuário quer pesquisar e importar exercícios diretamente do Google para sua biblioteca no aplicativo FitPro.

Termo de pesquisa no Google: "${cleanQuery || 'exercícios inovadores de musculação, funcional e calistenia'}"
Filtro de Músculo: "${muscleGroup && muscleGroup !== 'Todos' ? muscleGroup : 'Qualquer'}"
Filtro de Equipamento: "${equipment && equipment !== 'Todos' ? equipment : 'Qualquer'}"

Instruções obrigatórias:
1. Realize uma pesquisa no Google para identificar de 3 a 5 exercícios reais e populares relacionados ao termo "${cleanQuery || 'exercícios musculação'}".
2. Para cada exercício encontrado, forneça os detalhes biomecânicos completos em Português do Brasil.
3. Valores para primaryMuscle: 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Panturrilhas', 'Cardio', 'Corpo inteiro'.
4. Valores para equipment: 'Halteres', 'Barra', 'Máquinas', 'Cabos', 'Peso corporal', 'Kettlebell', 'Elásticos', 'Cardio/Esteira'.
5. Valores para level: 'Iniciante', 'Intermediário', 'Avançado'.
6. Valores para type: 'Hipertrofia', 'Força', 'Resistência', 'Mobilidade', 'Cardio'.
7. imageUrl: URL válida do Unsplash com foto fitness (ex: https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80).
8. sourceUrl: se disponível, URL de referência ou artigo encontrado no Google.

Retorne estritamente um array JSON de objetos (sem explicações adicionais fora do JSON):
[
  {
    "id": "ex-google-...",
    "name": "Nome em Português",
    "primaryMuscle": "Peito",
    "secondaryMuscles": ["Tríceps"],
    "equipment": "Halteres",
    "level": "Intermediário",
    "type": "Hipertrofia",
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    "sourceUrl": "https://...",
    "initialPosition": "Descrição da posição inicial",
    "movement": "Descrição concêntrica e excêntrica",
    "breathing": "Instrução de respiração",
    "executionSteps": ["Passo 1", "Passo 2", "Passo 3"],
    "commonMistakes": ["Erro 1", "Erro 2"],
    "executionTips": ["Dica 1", "Dica 2"],
    "recommendedSets": 3,
    "recommendedReps": "10-12",
    "recommendedRestSec": 60
  }
]`;

          geminiPromise = ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: googlePrompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
        } else {
          // Standard AI Biomechanical Synthesis
          const prompt = `Você é uma enciclopédia fitness e biomecânica avançada conectada à internet. O usuário quer buscar novos exercícios para importar no FitPro.

Termo de busca: "${cleanQuery || 'exercícios inovadores e biomecanicamente eficazes de musculação e calistenia'}"
Filtro de Músculo: "${muscleGroup && muscleGroup !== 'Todos' ? muscleGroup : 'Qualquer'}"
Filtro de Equipamento: "${equipment && equipment !== 'Todos' ? equipment : 'Qualquer'}"

Instruções:
- Forneça 3 a 4 exercícios reais, biomecanicamente detalhados em Português do Brasil.
- Valores permitidos para primaryMuscle: 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Panturrilhas', 'Cardio', 'Corpo inteiro'.
- Valores permitidos para equipment: 'Halteres', 'Barra', 'Máquinas', 'Cabos', 'Peso corporal', 'Kettlebell', 'Elásticos', 'Cardio/Esteira'.
- Valores permitidos para level: 'Iniciante', 'Intermediário', 'Avançado'.
- Valores permitidos para type: 'Hipertrofia', 'Força', 'Resistência', 'Mobilidade', 'Cardio'.
- Para imageUrl, forneça uma URL válida do Unsplash com tema fitness.

Retorne estritamente um array JSON de objetos com o formato:
[
  {
    "id": "ex-ai-...",
    "name": "Nome em Português",
    "primaryMuscle": "Peito",
    "secondaryMuscles": ["Tríceps"],
    "equipment": "Halteres",
    "level": "Intermediário",
    "type": "Hipertrofia",
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    "initialPosition": "Descrição da posição inicial",
    "movement": "Descrição concêntrica e excêntrica",
    "breathing": "Instrução de respiração",
    "executionSteps": ["Passo 1", "Passo 2", "Passo 3"],
    "commonMistakes": ["Erro 1", "Erro 2"],
    "executionTips": ["Dica 1", "Dica 2"],
    "recommendedSets": 3,
    "recommendedReps": "10-12",
    "recommendedRestSec": 60
  }
]`;

          geminiPromise = ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7
            }
          });
        }

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        const rawText = response.text?.trim() || "[]";
        let jsonText = rawText;
        // Strip markdown code fences if present
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          jsonText = jsonMatch[1] || jsonMatch[0];
        }

        let parsed: any[] = [];
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          // If JSON parse failed, try lenient extraction
          const startIdx = rawText.indexOf('[');
          const endIdx = rawText.lastIndexOf(']');
          if (startIdx !== -1 && endIdx > startIdx) {
            parsed = JSON.parse(rawText.substring(startIdx, endIdx + 1));
          }
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          const validMuscles = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Panturrilhas', 'Cardio', 'Corpo inteiro'];
          const validEquipment = ['Halteres', 'Barra', 'Máquinas', 'Cabos', 'Peso corporal', 'Kettlebell', 'Elásticos', 'Cardio/Esteira'];

          const formatted = parsed.map((item: any, idx: number) => ({
            id: item.id || `ex-${isGoogleSearchMode ? 'google' : 'ai'}-${Date.now()}-${idx}`,
            name: item.name || 'Exercício Personalizado',
            primaryMuscle: validMuscles.includes(item.primaryMuscle) ? item.primaryMuscle : 'Corpo inteiro',
            secondaryMuscles: Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [],
            equipment: validEquipment.includes(item.equipment) ? item.equipment : 'Halteres',
            level: ['Iniciante', 'Intermediário', 'Avançado'].includes(item.level) ? item.level : 'Intermediário',
            type: ['Hipertrofia', 'Força', 'Resistência', 'Mobilidade', 'Cardio'].includes(item.type) ? item.type : 'Hipertrofia',
            imageUrl: item.imageUrl?.startsWith('http') ? item.imageUrl : 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
            sourceUrl: item.sourceUrl || (isGoogleSearchMode ? `https://www.google.com/search?q=${encodeURIComponent('exercicio ' + (item.name || cleanQuery))}` : undefined),
            source: isGoogleSearchMode ? 'google' : 'gemini',
            initialPosition: item.initialPosition || 'Posicione-se com alinhamento e coluna neutra.',
            movement: item.movement || 'Execute o movimento com controle e cadência estável.',
            breathing: item.breathing || 'Inspire na descida e expire no esforço.',
            executionSteps: Array.isArray(item.executionSteps) && item.executionSteps.length > 0 ? item.executionSteps : ['Mantenha a postura e contraia o músculo alvo.'],
            commonMistakes: Array.isArray(item.commonMistakes) && item.commonMistakes.length > 0 ? item.commonMistakes : ['Usar impulso em excesso.'],
            executionTips: Array.isArray(item.executionTips) && item.executionTips.length > 0 ? item.executionTips : ['Controle a fase excêntrica em 2 a 3 segundos.'],
            recommendedSets: Number(item.recommendedSets) || 3,
            recommendedReps: String(item.recommendedReps || '10-12'),
            recommendedRestSec: Number(item.recommendedRestSec) || 60
          }));

          const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

          if (isGoogleSearchMode) {
            const googlePayload = {
              exercises: formatted.slice(0, limit),
              source: "google",
              totalFound: formatted.length,
              searchQueries
            };
            exerciseSearchCache.set(cacheKey, googlePayload, 15 * 60 * 1000);
            return res.json(googlePayload);
          }

          // Merge any catalog matches with the new AI exercises
          const combined = [...catalogMatches, ...formatted];
          const uniqueMap = new Map<string, any>();
          combined.forEach(ex => uniqueMap.set(ex.name.toLowerCase(), ex));
          const uniqueResults = Array.from(uniqueMap.values());

          const geminiPayload = {
            exercises: uniqueResults.slice(0, limit),
            source: "gemini",
            totalFound: uniqueResults.length,
            searchQueries
          };
          exerciseSearchCache.set(cacheKey, geminiPayload, 15 * 60 * 1000);
          return res.json(geminiPayload);
        }
      } catch (geminiError) {
        handleGeminiError(geminiError);
      }
    }

    // 3. Fallback to our verified rich online catalog
    let results = catalogMatches;
    if (results.length === 0 && cleanQuery) {
      // Relax search: match muscle or equipment
      results = ONLINE_EXERCISE_CATALOG.filter(ex => {
        const matchMuscle = muscleGroup === "Todos" || ex.primaryMuscle === muscleGroup;
        const matchEquip = equipment === "Todos" || ex.equipment === equipment;
        return matchMuscle && matchEquip;
      });
    }

    if (results.length === 0) {
      results = ONLINE_EXERCISE_CATALOG;
    }

    const fallbackPayload = {
      exercises: results.slice(0, limit),
      source: "online-catalog",
      totalFound: results.length
    };
    exerciseSearchCache.set(cacheKey, fallbackPayload, 10 * 60 * 1000);
    return res.json(fallbackPayload);
  } catch (error: any) {
    console.warn("Notice in search-online exercises endpoint:", error?.message || error);
    return res.status(500).json({
      error: "Falha ao buscar exercícios online",
      exercises: ONLINE_EXERCISE_CATALOG.slice(0, 4),
      source: "fallback"
    });
  }
});

// Image Search API for exercises via Google Search Grounding and Curated High-Res Fitness Photography
app.post("/api/exercises/search-image", async (req, res) => {
  try {
    const cleanName = sanitizeInput(req.body?.exerciseName, 80);
    const primaryMuscle = sanitizeInput(req.body?.primaryMuscle, 40);
    const equipment = sanitizeInput(req.body?.equipment, 40);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        error: "Nome do exercício é obrigatório para busca de imagem"
      });
    }

    const imageCacheKey = `${cleanName.toLowerCase()}:${primaryMuscle.toLowerCase()}`;
    const cachedImage = imageSearchCache.get(imageCacheKey);
    if (cachedImage) {
      return res.json({ ...cachedImage, fromCache: true });
    }

    // 1. Try Gemini with Google Search tool if available
    const ai = getAI();
    if (ai) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        );

        const prompt = `Você é um mecanismo de busca de imagens esportivas para o app FitPro.
O usuário precisa de uma foto real e demonstrativa da internet para o exercício "${cleanName}" (${primaryMuscle || 'geral'}, ${equipment || 'geral'}).
Faça uma pesquisa no Google e retorne estritamente um JSON no seguinte formato:
{
  "imageUrl": "URL direta de foto esportiva em alta resolução (ex: https://images.unsplash.com/...)",
  "title": "${cleanName}",
  "source": "google-search"
}
Atenção: A URL deve começar com https:// e apontar diretamente para uma foto demonstrando o exercício ou treino relevante.`;

        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3
          }
        });

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const rawText = response.text?.trim() || "";
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/\{\s*[\s\S]*\s*\}/);
        const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawText;

        try {
          const parsed = JSON.parse(jsonText);
          if (parsed && typeof parsed.imageUrl === 'string' && parsed.imageUrl.startsWith('https://')) {
            const resultData = {
              success: true,
              imageUrl: parsed.imageUrl.trim(),
              thumbUrl: parsed.imageUrl.trim().replace('w=800', 'w=300'),
              title: parsed.title || cleanName,
              source: "google-search"
            };
            imageSearchCache.set(imageCacheKey, resultData, 2 * 60 * 60 * 1000);
            return res.json(resultData);
          }
        } catch {
          // JSON parsing failed, proceed to fallback
        }
      } catch (geminiErr) {
        handleGeminiError(geminiErr);
      }
    }

    // 2. High-precision curated movement & muscle photography fallback
    const curated = findCuratedPhotoForExercise(cleanName, primaryMuscle);
    if (curated) {
      const curatedResult = {
        success: true,
        imageUrl: curated,
        thumbUrl: curated.replace('w=800', 'w=300'),
        title: cleanName,
        source: "curated-library"
      };
      imageSearchCache.set(imageCacheKey, curatedResult, 4 * 60 * 60 * 1000);
      return res.json(curatedResult);
    }

    // 3. Fallback default fitness image
    const defaultPhoto = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80';
    const fallbackResult = {
      success: true,
      imageUrl: defaultPhoto,
      thumbUrl: defaultPhoto.replace('w=800', 'w=300'),
      title: cleanName,
      source: "default-library"
    };
    imageSearchCache.set(imageCacheKey, fallbackResult, 60 * 60 * 1000);
    return res.json(fallbackResult);
  } catch (error: any) {
    console.warn("Notice in search-image endpoint:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Falha ao buscar imagem do exercício",
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      source: "fallback"
    });
  }
});

// Endpoint to proxy images for cross-origin canvas rendering (social share card)
app.get("/api/proxy-image", async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || !rawUrl.startsWith('http')) {
      return res.status(400).send("URL de imagem inválida");
    }

    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FitPro/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send("Falha ao buscar imagem de origem");
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buffer);
  } catch (error: any) {
    console.warn("Notice in proxy-image endpoint:", error?.message || error);
    return res.status(500).send("Erro no proxy de imagem");
  }
});

// Endpoint to access GitHub Free Exercise DB (876 exercises)
app.get("/api/exercises/github-free-db", (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=1800');
    const { query, muscle, equipment, limit = 50, offset = 0 } = req.query;
    let list = ONLINE_EXERCISE_CATALOG.filter(e => e.id?.startsWith('fedb-') || (e.sourceUrl && e.sourceUrl.includes('free-exercise-db')));
    
    if (query) {
      const q = String(query).toLowerCase().trim();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.primaryMuscle.toLowerCase().includes(q) ||
        (e.secondaryMuscles || []).some(m => m.toLowerCase().includes(q))
      );
    }
    if (muscle && muscle !== 'Todos') {
      list = list.filter(e => e.primaryMuscle === muscle || (e.secondaryMuscles || []).includes(muscle as any));
    }
    if (equipment && equipment !== 'Todos') {
      list = list.filter(e => e.equipment === equipment);
    }

    const total = list.length;
    const paginated = list.slice(Number(offset) || 0, (Number(offset) || 0) + (Number(limit) || 50));

    return res.json({
      success: true,
      total,
      exercises: paginated,
      source: "github-free-exercise-db",
      sourceUrl: "https://yuhonas.github.io/free-exercise-db/"
    });
  } catch (error: any) {
    console.warn("Notice in github-free-db endpoint:", error?.message || error);
    return res.status(500).json({ success: false, error: "Falha ao consultar repertório do GitHub" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
