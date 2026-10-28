import { Workout, WorkoutExerciseItem, Exercise, MuscleGroup, EquipmentType } from '../types';
import { db } from './db';

// Master dictionary of common exercise names English -> Portuguese
export const EXERCISE_NAME_TRANSLATIONS: Record<string, string> = {
  // Chest
  'barbell bench press': 'Supino Reto com Barra',
  'bench press': 'Supino Reto com Barra',
  'flat bench press': 'Supino Reto',
  'incline barbell bench press': 'Supino Inclinado com Barra',
  'incline bench press': 'Supino Inclinado com Barra',
  'incline dumbbell press': 'Supino Inclinado com Halteres',
  'dumbbell incline bench press': 'Supino Inclinado com Halteres',
  'decline barbell bench press': 'Supino Declinado com Barra',
  'decline dumbbell bench press': 'Supino Declinado com Halteres',
  'dumbbell bench press': 'Supino Reto com Halteres',
  'dumbbell press': 'Supino com Halteres',
  'dumbbell fly': 'Crucifixo com Halteres',
  'dumbbell flyes': 'Crucifixo com Halteres',
  'incline dumbbell fly': 'Crucifixo Inclinado com Halteres',
  'decline dumbbell fly': 'Crucifixo Declinado com Halteres',
  'cable crossover': 'Crossover na Polia',
  'cable fly': 'Crucifixo no Cabo',
  'push-up': 'Flexão de Braços',
  'push up': 'Flexão de Braços',
  'pushups': 'Flexões de Braços',
  'chest dip': 'Paralelas para Peitoral',
  'dips': 'Barras Paralelas',
  'pec deck': 'Peck Deck / Voador',
  'pec deck fly': 'Voador no Aparelho',
  'machine chest press': 'Supino na Máquina',
  'cable chest press': 'Supino no Cabo',

  // Back
  'deadlift': 'Levantamento Terra',
  'barbell deadlift': 'Levantamento Terra com Barra',
  'romanian deadlift': 'Levantamento Terra Romeno (RDL)',
  'sumo deadlift': 'Levantamento Terra Sumô',
  'pull-up': 'Barra Fixa (Pronada)',
  'pull up': 'Barra Fixa',
  'pull-ups': 'Barra Fixa',
  'chin-up': 'Barra Fixa Supinada',
  'chin up': 'Barra Fixa Supinada',
  'lat pulldown': 'Puxada Frontal na Polia',
  'wide-grip lat pulldown': 'Puxada Frontal com Pegada Aberta',
  'close-grip lat pulldown': 'Puxada com Pegada Fechada',
  'behind-the-neck pulldown': 'Puxada Atrás da Nuca',
  'bent over row': 'Remada Curvada com Barra',
  'barbell bent over row': 'Remada Curvada com Barra',
  'dumbbell row': 'Remada Unilateral com Halter (Serrote)',
  'one-arm dumbbell row': 'Remada Serrote com Halter',
  'seated cable row': 'Remada Baixa no Cabo',
  'cable row': 'Remada no Cabo',
  't-bar row': 'Remada Cavalinho (Barra T)',
  'hyperextensions': 'Hiperextensão Lombar',
  'back extension': 'Extensão Lombar no Banco',
  'straight-arm pulldown': 'Pulldown com Braços Estendidos',
  'face pull': 'Face Pull na Polia',

  // Shoulders
  'overhead press': 'Desenvolvimento Militar com Barra',
  'barbell shoulder press': 'Desenvolvimento com Barra',
  'military press': 'Desenvolvimento Militar',
  'dumbbell shoulder press': 'Desenvolvimento com Halteres',
  'arnold press': 'Desenvolvimento Arnold',
  'lateral raise': 'Elevação Lateral com Halteres',
  'dumbbell lateral raise': 'Elevação Lateral com Halteres',
  'cable lateral raise': 'Elevação Lateral na Polia',
  'front raise': 'Elevação Frontal com Halteres',
  'dumbbell front raise': 'Elevação Frontal com Halteres',
  'barbell front raise': 'Elevação Frontal com Barra',
  'rear delt fly': 'Crucifixo Invertido com Halteres',
  'reverse fly': 'Crucifixo Invertido',
  'dumbbell rear delt fly': 'Crucifixo Invertido com Halteres',
  'shrug': 'Encolhimento com Barra/Halteres',
  'barbell shrug': 'Encolhimento com Barra',
  'dumbbell shrug': 'Encolhimento com Halteres',
  'upright row': 'Remada Alta com Barra',

  // Legs / Glutes
  'squat': 'Agachamento Livre',
  'barbell squat': 'Agachamento Livre com Barra',
  'back squat': 'Agachamento Livre com Barra nas Costas',
  'front squat': 'Agachamento Frontal com Barra',
  'goblet squat': 'Agachamento Goblet',
  'hack squat': 'Agachamento Hack',
  'smith machine squat': 'Agachamento no Smith',
  'leg press': 'Leg Press 45°',
  'leg extension': 'Cadeira Extensora',
  'leg curl': 'Mesa Flexora',
  'lying leg curl': 'Mesa Flexora Deitada',
  'seated leg curl': 'Cadeira Flexora Sentada',
  'lunge': 'Avanço / Passada com Halteres',
  'walking lunge': 'Passada Caminhando com Halteres',
  'dumbbell lunge': 'Avanço com Halteres',
  'bulgarian split squat': 'Agachamento Búlgaro',
  'hip thrust': 'Elevação Pélvica com Barra (Hip Thrust)',
  'barbell hip thrust': 'Elevação Pélvica com Barra',
  'glute bridge': 'Ponte de Glúteos',
  'calf raise': 'Elevação de Panturrilhas',
  'standing calf raise': 'Panturrilha em Pé',
  'seated calf raise': 'Panturrilha Sentado (Gêmeos)',
  'abductor machine': 'Cadeira Abdutora',
  'adductor machine': 'Cadeira Adutora',

  // Biceps
  'bicep curl': 'Rosca Direta com Barra',
  'barbell curl': 'Rosca Direta com Barra',
  'dumbbell bicep curl': 'Rosca Direta com Halteres',
  'dumbbell curl': 'Rosca com Halteres',
  'hammer curl': 'Rosca Martelo com Halteres',
  'dumbbell hammer curl': 'Rosca Martelo',
  'preacher curl': 'Rosca Scott',
  'concentration curl': 'Rosca Concentrada',
  'cable bicep curl': 'Rosca Direta na Polia',
  'incline dumbbell curl': 'Rosca Inclinada com Halteres',
  'reverse curl': 'Rosca Inversa',

  // Triceps
  'tricep pushdown': 'Tríceps na Polia Alta',
  'cable tricep pushdown': 'Tríceps Pulley na Polia',
  'triceps rope pushdown': 'Tríceps Corda na Polia Alta',
  'rope pushdown': 'Tríceps Corda',
  'skull crusher': 'Tríceps Testa com Barra',
  'skull crushers': 'Tríceps Testa com Barra',
  'lying triceps extension': 'Tríceps Testa Deitado',
  'overhead tricep extension': 'Tríceps Francês com Halter',
  'dumbbell tricep extension': 'Tríceps Francês',
  'tricep dip': 'Tríceps no Banco ou Paralelas',
  'close-grip bench press': 'Supino com Pegada Fechada',
  'cable overhead tricep extension': 'Tríceps Francês na Polia',

  // Abs & Core
  'plank': 'Prancha Abdominal Isométrica',
  'side plank': 'Prancha Lateral',
  'crunch': 'Abdominal Tradicional (Crunch)',
  'crunches': 'Abdominais Crunch',
  'hanging leg raise': 'Elevação de Pernas na Barra Fixa',
  'leg raise': 'Elevação de Pernas',
  'cable crunch': 'Abdominal na Polia Alta',
  'russian twist': 'Giro Russo (Russian Twist)',
  'mountain climber': 'Escalador (Mountain Climber)',
  'ab wheel rollout': 'Rolo Abdominal',

  // Cardio
  'treadmill run': 'Corrida na Esteira',
  'treadmill interval': 'Tiros de Corrida Intervalada (HIIT)',
  'jumping jacks': 'Polichinelos',
  'burpee': 'Burpee Completo com Salto',
  'burpees': 'Burpees',
  'jump rope': 'Pular Corda',
  'stationary bike': 'Bicicleta Ergométrica',
  'rowing machine': 'Remo Ergométrico',

  // GitHub Free Exercise DB Common Catalog
  '3/4 sit-up': 'Abdominal 3/4',
  '90/90 hamstring': 'Alongamento 90/90 para Isquiotibiais',
  'ab crunch machine': 'Abdominal na Máquina',
  'ab roller': 'Rolo Abdominal',
  'adductor': 'Alongamento de Adutores',
  'adductor/groin': 'Alongamento de Adutores e Virilha',
  'advanced kettlebell windmill': 'Moinho de Vento Avançado com Kettlebell',
  'air bike': 'Abdominal Bicicleta (Air Bike)',
  'all fours quad stretch': 'Alongamento de Quadríceps de Quatro',
  'alternate hammer curl': 'Rosca Martelo Alternada com Halteres',
  'alternate heel touchers': 'Toque Alternado nos Calcanhares',
  'alternate incline dumbbell curl': 'Rosca Inclinada Alternada com Halteres',
  'alternate leg diagonal bound': 'Salto Diagonal Alternado',
  'alternating cable shoulder press': 'Desenvolvimento Alternado na Polia',
  'alternating deltoid raise': 'Elevação Alternada de Deltoides',
  'alternating floor press': 'Supino Alternado no Chão',
  'alternating hang clean': 'Hang Clean Alternado com Kettlebell',
  'alternating kettlebell press': 'Desenvolvimento Alternado com Kettlebell',
  'alternating kettlebell row': 'Remada Alternada com Kettlebell',
  'alternating renegade row': 'Remada Renegade Alternada',
  'ankle circles': 'Rotação Circular de Tornozelos',
  'ankle on the knee': 'Alongamento Tornozelo no Joelho',
  'anterior tibialis-smr': 'Liberação Miofascial do Tibial Anterior',
  'anti-gravity press': 'Desenvolvimento Anti-Gravidade com Barra',
  'arm circles': 'Rotação de Braços em Círculo',
  'arnold dumbbell press': 'Desenvolvimento Arnold com Halteres',
  'around the worlds': 'Volta ao Mundo (Around The World)',
  'atlas stone trainer': 'Treino de Pedra Atlas',
  'axle deadlift': 'Levantamento Terra com Barra Grossa (Axle)',
  'ball leg curl': 'Flexora com Bola Suíça',
  'barbell ab rollout': 'Rolamento Abdominal com Barra',
  'barbell front squat': 'Agachamento Frontal com Barra',
  'barbell glute bridge': 'Elevação Pélvica com Barra no Solo',
  'barbell hack squat': 'Agachamento Hack com Barra',
  'barbell lunge': 'Avanço / Passada com Barra',
  'barbell step-ups': 'Subida no Banco com Barra (Step-Up)',
  'battling ropes': 'Corda Naval (Battle Rope)',
  'bear crawl': 'Passo do Urso (Bear Crawl)',
  'bent-arm dumbbell pullover': 'Pullover com Braços Fletidos',
  'bent-knee hip raise': 'Elevação de Quadril com Joelhos Dobrados',
  'biceps curl to shoulder press': 'Rosca Direta Conjugada com Desenvolvimento',
  'box jump': 'Salto na Caixa (Box Jump)',
  'broad jump': 'Salto em Distância',
  'cable seated row': 'Remada Sentada na Polia',
  'cable woodchoppers': 'Woodchopper no Cabo (Oblíquos)',
  'calf press on the leg press machine': 'Panturrilha no Leg Press',
  'cambered bar lying row': 'Remada Deitada com Barra Curva',
  'cat stretch': 'Alongamento do Gato (Yoga)',
  'chin-ups': 'Barra Fixa Supinada',
  'clean and jerk': 'Arranco e Arremesso (Clean and Jerk)',
  'clean and press': 'Clean com Desenvolvimento',
  'clock push-up': 'Flexão Relógio',
  'cossack squat': 'Agachamento Cossaco',
  'cuban press': 'Desenvolvimento Cubano',
  'decline crunch': 'Abdominal no Banco Declinado',
  'decline push-up': 'Flexão com Pés Elevados (Declinada)',
  'diamond push-up': 'Flexão Diamante (Tríceps)',
  'donkey calf raises': 'Panturrilha Burrinho (Donkey Calf Raise)',
  'dumbbell clean and jerk': 'Clean and Jerk com Halteres',
  'dumbbell farmers walk': 'Caminhada do Fazendeiro com Halteres',
  'dumbbell scaption': 'Elevação no Plano da Escápula (Scaption)',
  'dumbbell snatch': 'Arranco Unilateral com Halter (Snatch)',
  'elbow plank': 'Prancha com Apoio nos Cotovelos',
  'ez-bar curl': 'Rosca Direta com Barra W (EZ-Bar)',
  'ez-bar skullcrusher': 'Tríceps Testa com Barra W',
  'farmers walk': 'Caminhada do Fazendeiro',
  'glute ham raise': 'Elevação Glúteo-Posterior (GHR)',
  'incline dumbbell row': 'Remada no Banco Inclinado com Halteres',
  'incline hammer curl': 'Rosca Martelo no Banco Inclinado',
  'isometric wiper': 'Limpador de Pára-brisa Isométrico',
  'kettlebell swing': 'Balanço com Kettlebell (Swing)',
  'kettlebell turkish get-up': 'Levantamento Turco (Turkish Get-Up)',
  'kneeling cable crunch': 'Abdominal Ajoelhado na Polia Alta',
  'landmine press': 'Desenvolvimento Landmine',
  'latissimus dorsi-smr': 'Liberação Miofascial do Grande Dorsal',
  'leg pull-in': 'Encolhimento de Pernas Sentado',
  'monster walk': 'Caminhada Monstro com Elástico (Monster Walk)',
  'overhead dumbbell extension': 'Tríceps Francês Unilateral com Halter',
  'palms-down dumbbell wrist curl': 'Rosca de Punho com Palma para Baixo',
  'palms-up dumbbell wrist curl': 'Rosca de Punho com Palma para Cima',
  'pistol squat': 'Agachamento Pistola Unilateral (Pistol Squat)',
  'plate pinch': 'Pinça de Anilhas (Pegada)',
  'preacher hammer dumbbell curl': 'Rosca Scott Martelo com Halteres',
  'reverse grip bent-over row': 'Remada Curvada com Pegada Supinada',
  'seated dumbbell palms-down wrist curl': 'Rosca Punho Inversa Sentado',
  'seated leg press': 'Leg Press Sentado',
  'seated overhead dumbbell triceps extension': 'Tríceps Francês Sentado com Halter',
  'side bridge': 'Ponte Lateral (Prancha)',
  'single-leg leg press': 'Leg Press Unilateral',
  'sled 45 degree leg press': 'Leg Press 45 Graus',
  'standing dumbbell calf raise': 'Panturrilha em Pé com Halteres',
  'straight-arm dumbbell pullover': 'Pullover com Braços Retos',
  'swiss ball crunch': 'Abdominal na Bola Suíça',
  't-bar row with handle': 'Remada Cavalinho com Puxador',
  'tire flip': 'Tombamento de Pneu (Tire Flip)',
  'triceps dip': 'Mergulho de Tríceps nas Paralelas',
  'v-bar pull-down': 'Puxada com Triângulo na Polia',
  'wrist roller': 'Rolo de Punho para Antebraço',
  'zercher squat': 'Agachamento Zercher com Barra'
};

// Common workout titles translation
export const WORKOUT_TITLE_TRANSLATIONS: Record<string, string> = {
  'push day': 'Treino de Empurrar (Peito, Ombro e Tríceps)',
  'pull day': 'Treino de Puxar (Costas, Bíceps e Trapézio)',
  'leg day': 'Treino de Pernas e Glúteos (Legs)',
  'legs day': 'Treino de Pernas e Glúteos',
  'upper body': 'Treino Superior Completo (Upper Body)',
  'lower body': 'Treino Inferior Completo (Lower Body)',
  'full body': 'Treino Corpo Inteiro (Full Body)',
  'chest and triceps': 'Treino de Peito e Tríceps',
  'chest & triceps': 'Treino de Peito e Tríceps',
  'back and biceps': 'Treino de Costas e Bíceps',
  'back & biceps': 'Treino de Costas e Bíceps',
  'legs and abs': 'Treino de Pernas e Abdômen',
  'legs & abs': 'Treino de Pernas e Abdômen',
  'shoulders and arms': 'Treino de Ombros e Braços',
  'shoulders & arms': 'Treino de Ombros e Braços',
  'cardio and core': 'Treino de Cardio e Abdômen',
  'cardio & core': 'Treino de Cardio e Abdômen',
  'push': 'Treino A — Empurrar (Peito, Ombro, Tríceps)',
  'pull': 'Treino B — Puxar (Costas e Bíceps)',
  'legs': 'Treino C — Pernas e Glúteos',
  'arms': 'Treino de Braços (Bíceps e Tríceps)'
};

// Muscle names mapping
export const MUSCLE_TRANSLATIONS: Record<string, MuscleGroup> = {
  'chest': 'Peito',
  'pectorals': 'Peito',
  'back': 'Costas',
  'lats': 'Costas',
  'latissimus': 'Costas',
  'shoulders': 'Ombros',
  'deltoids': 'Ombros',
  'delts': 'Ombros',
  'biceps': 'Bíceps',
  'triceps': 'Tríceps',
  'legs': 'Pernas',
  'quadriceps': 'Pernas',
  'quads': 'Pernas',
  'hamstrings': 'Pernas',
  'glutes': 'Glúteos',
  'gluteus': 'Glúteos',
  'buttocks': 'Glúteos',
  'abs': 'Abdômen',
  'abdominals': 'Abdômen',
  'core': 'Abdômen',
  'calves': 'Panturrilhas',
  'calf': 'Panturrilhas',
  'cardio': 'Cardio',
  'full body': 'Corpo inteiro'
};

// Categories mapping
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'hypertrophy': 'Hipertrofia',
  'strength': 'Força',
  'endurance': 'Resistência',
  'mobility': 'Mobilidade',
  'cardio': 'Cardio',
  'weight loss': 'Emagrecimento',
  'functional': 'Funcional'
};

// Check if string contains strong indicators of English
export function isTextInEnglish(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // English words and patterns common in gym apps
  const englishKeywords = [
    'bench press', 'deadlift', 'squat', 'curl', 'pulldown', 'raise', 'lunge', 
    'pushup', 'push-up', 'chest', 'back', 'biceps', 'triceps', 'shoulders', 
    'pull day', 'push day', 'leg day', 'full body', 'upper body', 'lower body', 
    'dumbbell', 'barbell', 'incline', 'decline', 'seated', 'standing', 'with', 
    'for', 'and', 'workout', 'training', 'sets', 'reps', 'weight', 'rest'
  ];

  // Portuguese words and accents
  const portugueseKeywords = [
    'treino', 'supino', 'agachamento', 'remada', 'rosca', 'puxada', 'elevação', 
    'prancha', 'pernas', 'peito', 'costas', 'ombros', 'braços', 'panturrilha', 
    'série', 'repetições', 'descanso', 'com', 'para', 'na', 'no', 'de', 'do', 'da'
  ];

  // Portuguese special characters
  if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(text)) {
    return false;
  }

  let enScore = 0;
  let ptScore = 0;

  for (const kw of englishKeywords) {
    if (lower.includes(kw)) enScore += 2;
  }
  for (const kw of portugueseKeywords) {
    if (lower.includes(kw)) ptScore += 3;
  }

  return enScore > ptScore && enScore >= 2;
}

// Translate single exercise name
export function translateExerciseName(name: string, targetLang: 'pt-br' | 'en' = 'pt-br'): string {
  if (!name) return name;
  const clean = name.trim().toLowerCase();

  if (targetLang === 'pt-br') {
    // 1. Direct dictionary match
    if (EXERCISE_NAME_TRANSLATIONS[clean]) {
      return EXERCISE_NAME_TRANSLATIONS[clean];
    }

    // 2. Pattern replacements
    let translated = name;

    const patterns: [RegExp, string][] = [
      [/\bbarbell\b/gi, 'com Barra'],
      [/\bdumbbell\b/gi, 'com Halteres'],
      [/\bcable\b/gi, 'na Polia'],
      [/\bmachine\b/gi, 'na Máquina'],
      [/\bincline\b/gi, 'Inclinado'],
      [/\bdecline\b/gi, 'Declinado'],
      [/\bseated\b/gi, 'Sentado'],
      [/\bstanding\b/gi, 'em Pé'],
      [/\blying\b/gi, 'Deitado'],
      [/\bone-arm\b/gi, 'Unilateral'],
      [/\bsingle-arm\b/gi, 'Unilateral'],
      [/\bsingle-leg\b/gi, 'Unilateral'],
      [/\breverse\b/gi, 'Inverso'],
      [/\bwide-grip\b/gi, 'Pegada Aberta'],
      [/\bclose-grip\b/gi, 'Pegada Fechada'],
      [/\bbench press\b/gi, 'Supino'],
      [/\bsquat\b/gi, 'Agachamento'],
      [/\bdeadlift\b/gi, 'Levantamento Terra'],
      [/\blat pulldown\b/gi, 'Puxada Frontal'],
      [/\bpulldown\b/gi, 'Puxada na Polia'],
      [/\bbicep curl\b/gi, 'Rosca Direta'],
      [/\bcurl\b/gi, 'Rosca'],
      [/\btricep pushdown\b/gi, 'Tríceps na Polia'],
      [/\bpushdown\b/gi, 'Tríceps Pulley'],
      [/\blateral raise\b/gi, 'Elevação Lateral'],
      [/\bfront raise\b/gi, 'Elevação Frontal'],
      [/\brear delt fly\b/gi, 'Crucifixo Invertido'],
      [/\bfly\b/gi, 'Crucifixo'],
      [/\bshrug\b/gi, 'Encolhimento'],
      [/\brow\b/gi, 'Remada'],
      [/\blunge\b/gi, 'Avanço / Passada'],
      [/\bleg press\b/gi, 'Leg Press'],
      [/\bleg extension\b/gi, 'Cadeira Extensora'],
      [/\bleg curl\b/gi, 'Mesa Flexora'],
      [/\bcalf raise\b/gi, 'Panturrilha'],
      [/\bhip thrust\b/gi, 'Elevação Pélvica'],
      [/\bplank\b/gi, 'Prancha Abdominal'],
      [/\bcrunch\b/gi, 'Abdominal Crunch'],
      [/\bpush-up\b/gi, 'Flexão de Braços'],
      [/\bpush up\b/gi, 'Flexão de Braços'],
      [/\bpull-up\b/gi, 'Barra Fixa'],
      [/\bpull up\b/gi, 'Barra Fixa'],
      [/\bdip\b/gi, 'Paralelas']
    ];

    for (const [regex, replacement] of patterns) {
      if (regex.test(translated)) {
        translated = translated.replace(regex, replacement);
      }
    }

    // Clean up phrasing if English words got reordered
    translated = translated
      .replace(/\s+/g, ' ')
      .replace(/com Barra com Barra/gi, 'com Barra')
      .replace(/com Halteres com Halteres/gi, 'com Halteres')
      .trim();

    return translated;
  } else {
    // PT -> EN reverse lookup
    for (const [en, pt] of Object.entries(EXERCISE_NAME_TRANSLATIONS)) {
      if (pt.toLowerCase() === clean) {
        return en.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return name;
  }
}

// Translate workout title
export function translateWorkoutTitle(title: string, targetLang: 'pt-br' | 'en' = 'pt-br'): string {
  if (!title) return title;
  const clean = title.trim().toLowerCase();

  if (targetLang === 'pt-br') {
    if (WORKOUT_TITLE_TRANSLATIONS[clean]) {
      return WORKOUT_TITLE_TRANSLATIONS[clean];
    }

    let result = title;
    const replacements: [RegExp, string][] = [
      [/\bpush day\b/gi, 'Treino de Empurrar (Push)'],
      [/\bpull day\b/gi, 'Treino de Puxar (Pull)'],
      [/\bleg day\b/gi, 'Treino de Pernas (Legs)'],
      [/\blegs day\b/gi, 'Treino de Pernas'],
      [/\bupper body\b/gi, 'Superior Completo'],
      [/\blower body\b/gi, 'Inferior Completo'],
      [/\bfull body\b/gi, 'Corpo Inteiro (Full Body)'],
      [/\bchest & triceps\b/gi, 'Peito e Tríceps'],
      [/\bchest and triceps\b/gi, 'Peito e Tríceps'],
      [/\bback & biceps\b/gi, 'Costas e Bíceps'],
      [/\bback and biceps\b/gi, 'Costas e Bíceps'],
      [/\blegs & abs\b/gi, 'Pernas e Abdômen'],
      [/\blegs and abs\b/gi, 'Pernas e Abdômen'],
      [/\bshoulders & arms\b/gi, 'Ombros e Braços'],
      [/\bshoulders and arms\b/gi, 'Ombros e Braços'],
      [/\bworkout\b/gi, 'Treino'],
      [/\broutine\b/gi, 'Rotina']
    ];

    for (const [re, rep] of replacements) {
      result = result.replace(re, rep);
    }
    return result;
  }

  return title;
}

// Translate entire workout object
export function translateWorkout(workout: Workout, targetLang: 'pt-br' | 'en' = 'pt-br'): Workout {
  const newTitle = translateWorkoutTitle(workout.title, targetLang);
  
  let newCategory = workout.category || 'Hipertrofia';
  if (targetLang === 'pt-br') {
    const catLower = (workout.category || '').toLowerCase();
    if (CATEGORY_TRANSLATIONS[catLower]) {
      newCategory = CATEGORY_TRANSLATIONS[catLower];
    }
  }

  let newDesc = workout.description;
  if (newDesc && targetLang === 'pt-br' && isTextInEnglish(newDesc)) {
    newDesc = `Rotina focada em ${newCategory.toLowerCase()} estruturada para máxima eficiência e recuperação muscular.`;
  }

  const translatedExercises: WorkoutExerciseItem[] = workout.exercises.map(exItem => {
    const currentName = exItem.exerciseName || '';
    const translatedName = translateExerciseName(currentName, targetLang);

    // Also look up in exercise library if there's a better matching Portuguese name
    const libEx = db.getExerciseById(exItem.exerciseId);
    const finalName = (targetLang === 'pt-br' && libEx && !isTextInEnglish(libEx.name))
      ? libEx.name
      : translatedName;

    return {
      ...exItem,
      exerciseName: finalName
    };
  });

  return {
    ...workout,
    title: newTitle,
    category: newCategory,
    description: newDesc,
    exercises: translatedExercises,
    updatedAt: new Date().toISOString()
  };
}

// Translate all workouts in the database
export function translateAllWorkouts(targetLang: 'pt-br' | 'en' = 'pt-br'): { workoutsCount: number; exercisesCount: number } {
  const allWorkouts = db.getWorkouts();
  let wCount = 0;
  let exCount = 0;

  allWorkouts.forEach(w => {
    const translated = translateWorkout(w, targetLang);
    db.updateWorkout(w.id, translated);
    wCount++;
    exCount += translated.exercises.length;
  });

  // Also update weekly schedule notes
  const schedule = db.getWeeklySchedule();
  const updatedSchedule = schedule.map(day => {
    if (day.workoutId) {
      const matchW = db.getWorkoutById(day.workoutId);
      if (matchW) {
        return {
          ...day,
          notes: matchW.title
        };
      }
    }
    return day;
  });
  db.setWeeklySchedule(updatedSchedule);

  return { workoutsCount: wCount, exercisesCount: exCount };
}

// Equipment names mapping
export const EQUIPMENT_TRANSLATIONS: Record<string, EquipmentType> = {
  'barbell': 'Barra',
  'dumbbell': 'Halteres',
  'dumbbells': 'Halteres',
  'cable': 'Cabos',
  'cables': 'Cabos',
  'machine': 'Máquinas',
  'body only': 'Peso corporal',
  'bodyweight': 'Peso corporal',
  'body weight': 'Peso corporal',
  'kettlebell': 'Kettlebell',
  'kettlebells': 'Kettlebell',
  'bands': 'Elásticos',
  'band': 'Elásticos',
  'resistance band': 'Elásticos',
  'foam roll': 'Peso corporal',
  'medicine ball': 'Peso corporal',
  'exercise ball': 'Peso corporal',
  'other': 'Peso corporal'
};

// Level mapping
export const LEVEL_TRANSLATIONS: Record<string, 'Iniciante' | 'Intermediário' | 'Avançado'> = {
  'beginner': 'Iniciante',
  'intermediate': 'Intermediário',
  'expert': 'Avançado',
  'advanced': 'Avançado'
};

/**
 * Translates English execution steps and movement text to clean Brazilian Portuguese.
 */
export function translateExerciseStepText(text: string): string {
  if (!text || !isTextInEnglish(text)) return text;

  let translated = text;

  const phraseReplacements: [RegExp, string][] = [
    [/Lie down on the floor and secure your feet\./gi, 'Deite-se no chão e firme bem os pés.'],
    [/Your legs should be bent at the knees\./gi, 'Mantenha os joelhos flexionados.'],
    [/Lie flat on the floor with your lower back pressed to the ground\./gi, 'Deite-se reto no chão com a região lombar apoiada no solo.'],
    [/Lie on your back, with one leg extended straight out\./gi, 'Deite-se de costas, com uma das pernas estendida.'],
    [/Lie on your back with your feet raised towards the ceiling\./gi, 'Deite-se de costas com os pés voltados para o teto.'],
    [/Lie on a flat bench holding a dumbbell in each hand\./gi, 'Deite-se em um banco reto segurando um halter em cada mão.'],
    [/Lay down on a flat bench holding a dumbbell in each hand\./gi, 'Deite-se em um banco reto segurando um halter em cada mão.'],
    [/Stand up with your torso upright\./gi, 'Fique em pé com o tronco ereto.'],
    [/Stand up and extend your arms straight out\./gi, 'Fique em pé e estenda os braços à frente.'],
    [/Stand with your feet shoulder-width apart\./gi, 'Fique em pé com os pés na largura dos ombros.'],
    [/Sit down on the ab machine\./gi, 'Sente-se na máquina de abdominal.'],
    [/Sit on an exercise bench with back support\./gi, 'Sente-se em um banco com encosto para as costas.'],
    [/Sit down on an incline bench\./gi, 'Sente-se em um banco inclinado.'],
    [/This will be your starting position\./gi, 'Esta será a sua posição inicial.'],
    [/This is your starting position\./gi, 'Esta é a posição inicial.'],
    [/Flex your hips and spine to raise your torso toward your knees\./gi, 'Flexione o quadril e o abdômen para elevar o tronco em direção aos joelhos.'],
    [/Reverse the motion, going only ¾ of the way down\./gi, 'Inverta o movimento, descendo cerca de ¾ do caminho com controle.'],
    [/Repeat for the recommended amount of repetitions\./gi, 'Repita pela quantidade recomendada de repetições.'],
    [/Repeat for 10-20 repetitions, and then switch to the other leg\./gi, 'Repita de 10 a 20 repetições e troque para a outra perna.'],
    [/While holding the upper arm stationary, curl the right weight forward\./gi, 'Mantendo o braço parado, flexione o antebraço direito para cima contraindo o bíceps.'],
    [/Continue the movement until your biceps is fully contracted\./gi, 'Continue o movimento até que o bíceps esteja completamente contraído.'],
    [/Hold the contracted position for a second as you squeeze the biceps\./gi, 'Segure a posição de contração por 1 segundo apertando o músculo.'],
    [/Slowly begin to bring the dumbbells back to starting position\./gi, 'Inicie o retorno lento dos halteres à posição inicial.'],
    [/Repeat the movement with the left hand\./gi, 'Repita o movimento com o braço esquerdo.'],
    [/Continue alternating in this manner\./gi, 'Continue alternando os lados dessa maneira.'],
    [/Breathe out as you perform this movement\./gi, 'Expire enquanto realiza esta fase de esforço.'],
    [/Breathe in during this portion of the movement\./gi, 'Inspire durante esta fase do movimento.'],
    [/Only the forearms should move\./gi, 'Apenas os antebraços devem se mover.'],
    [/Slowly roll the ab roller straight forward\./gi, 'Role lentamente a roda abdominal para a frente.'],
    [/Go slowly and keep your abs tight at all times\./gi, 'Mova-se lentamente e mantenha o abdômen travado o tempo todo.'],
    [/Extend your leg straight into the air\./gi, 'Estenda a perna reta em direção ao alto.'],
    [/Return the leg to the starting position\./gi, 'Retorne a perna para a posição inicial.'],
    [/After a second pause, slowly return to the starting position\./gi, 'Após uma pausa de 1 segundo, retorne lentamente à posição inicial.'],
    [/Clean and press a kettlebell overhead with one arm\./gi, 'Faça o clean e desenvolva o kettlebell acima da cabeça com um braço.'],
    [/Clean two kettlebells to your shoulders\./gi, 'Puxe os dois kettlebells até a altura dos ombros.'],
    [/Press one directly overhead by extending through the elbow\./gi, 'Empurre um dos braços diretamente para cima estendendo o cotovelo.'],
    [/Lower yourself as far as possible\./gi, 'Abaixe-se o máximo que conseguir mantendo a postura firme.'],
    [/Pause for a second and reverse the motion\./gi, 'Pause por 1 segundo e reverta o movimento com controle.'],
    [/Rotate the leg so that the foam roll contacts against your inner thigh\./gi, 'Gire a perna para que o rolo toque a parte interna da coxa.'],
    [/Roll over the foam between your hip and knee\./gi, 'Role sobre a espuma entre o quadril e o joelho.'],
    [/holding points of tension for 10-30 seconds\./gi, 'mantendo os pontos de tensão por 10 a 30 segundos.'],
    [/Repeat with the other leg\./gi, 'Repita com a outra perna.'],
    [/Start off on your hands and knees\./gi, 'Comece apoiado sobre as mãos e os joelhos (quatro apoios).'],
    [/Keep the non-working arm behind your back\./gi, 'Mantenha o braço livre apoiado atrás das costas.'],
    [/Hold for 10-20 seconds and then switch sides\./gi, 'Segure por 10 a 20 segundos e troque de lado.']
  ];

  for (const [pattern, rep] of phraseReplacements) {
    translated = translated.replace(pattern, rep);
  }

  // Common vocabulary replacements
  const wordReplacements: [RegExp, string][] = [
    [/\bstarting position\b/gi, 'posição inicial'],
    [/\bdumbbell\b/gi, 'halter'],
    [/\bdumbbells\b/gi, 'halteres'],
    [/\bbarbell\b/gi, 'barra'],
    [/\bkettlebell\b/gi, 'kettlebell'],
    [/\bkettlebells\b/gi, 'kettlebells'],
    [/\bbench\b/gi, 'banco'],
    [/\bfloor\b/gi, 'chão'],
    [/\bshoulders?\b/gi, 'ombros'],
    [/\belbows?\b/gi, 'cotovelos'],
    [/\bknees?\b/gi, 'joelhos'],
    [/\bchest\b/gi, 'peito'],
    [/\babs\b/gi, 'abdômen'],
    [/\bbiceps\b/gi, 'bíceps'],
    [/\btriceps\b/gi, 'tríceps'],
    [/\bhands?\b/gi, 'mãos'],
    [/\bfeet\b/gi, 'pés'],
    [/\blegs?\b/gi, 'pernas'],
    [/\bexhale\b/gi, 'expire'],
    [/\binhale\b/gi, 'inspire'],
    [/\brepetitions?\b/gi, 'repetições'],
    [/\bweight\b/gi, 'peso']
  ];

  for (const [rg, rep] of wordReplacements) {
    translated = translated.replace(rg, rep);
  }

  return translated;
}

/**
 * Translates an entire Exercise object (from GitHub Free DB or library)
 * into Brazilian Portuguese (PT-BR) or English.
 */
export function translateExercise(exercise: Exercise, targetLang: 'pt-br' | 'en' = 'pt-br'): Exercise {
  if (targetLang !== 'pt-br') return exercise;

  const translatedName = translateExerciseName(exercise.name, 'pt-br');

  // Primary muscle
  const pMuscleLower = (exercise.primaryMuscle || '').toLowerCase();
  const primaryMuscle = MUSCLE_TRANSLATIONS[pMuscleLower] || exercise.primaryMuscle;

  // Secondary muscles
  const secondaryMuscles = (exercise.secondaryMuscles || []).map(m => {
    const lower = (m || '').toLowerCase();
    return MUSCLE_TRANSLATIONS[lower] || m;
  });

  // Equipment
  const eqLower = (exercise.equipment || '').toLowerCase();
  const equipment = EQUIPMENT_TRANSLATIONS[eqLower] || exercise.equipment;

  // Level
  const lvlLower = (exercise.level || '').toLowerCase();
  const level = LEVEL_TRANSLATIONS[lvlLower] || exercise.level;

  // Type
  let type = exercise.type;
  if (type) {
    const tLower = type.toLowerCase();
    if (tLower === 'strength' || tLower === 'hypertrophy') type = 'Hipertrofia';
    else if (tLower === 'stretching' || tLower === 'mobility') type = 'Mobilidade';
    else if (tLower === 'cardio') type = 'Cardio';
    else if (tLower === 'plyometrics') type = 'Resistência';
    else if (tLower === 'powerlifting') type = 'Força';
  }

  // Execution steps
  const executionSteps = (exercise.executionSteps || []).map(step => translateExerciseStepText(step));
  const initialPosition = exercise.initialPosition ? translateExerciseStepText(exercise.initialPosition) : undefined;
  const movement = exercise.movement ? translateExerciseStepText(exercise.movement) : undefined;

  return {
    ...exercise,
    name: translatedName,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    level,
    type,
    executionSteps,
    initialPosition,
    movement
  };
}

// Translate all exercise names in exercise library
export function translateAllExercisesInLibrary(targetLang: 'pt-br' | 'en' = 'pt-br'): { translatedCount: number } {
  const exercises = db.getExercises();
  let count = 0;

  exercises.forEach(ex => {
    if (targetLang === 'pt-br') {
      const isEn = isTextInEnglish(ex.name);
      if (isEn || ex.id.startsWith('fedb-')) {
        const translated = translateExercise(ex, 'pt-br');
        if (
          translated.name !== ex.name ||
          translated.primaryMuscle !== ex.primaryMuscle ||
          translated.equipment !== ex.equipment ||
          (translated.executionSteps && translated.executionSteps.length > 0 && translated.executionSteps[0] !== ex.executionSteps?.[0])
        ) {
          db.updateExercise(ex.id, translated);
          count++;
        }
      }
    }
  });

  return { translatedCount: count };
}

// Translate specifically all exercises originating from the GitHub repository
export function translateAllGithubExercisesInLibrary(targetLang: 'pt-br' | 'en' = 'pt-br'): { translatedCount: number } {
  const exercises = db.getExercises();
  let count = 0;

  exercises.forEach(ex => {
    const isGithub = ex.id?.startsWith('fedb-') || (ex.sourceUrl && ex.sourceUrl.includes('free-exercise-db'));
    if (isGithub && targetLang === 'pt-br') {
      const translated = translateExercise(ex, 'pt-br');
      db.updateExercise(ex.id, translated);
      count++;
    }
  });

  return { translatedCount: count };
}

