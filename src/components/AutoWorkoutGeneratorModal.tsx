import { useState } from 'react';
import { FitnessGoal, ExerciseLevel, TrainingLocation, EquipmentType, Workout, WeeklyScheduleDay } from '../types';
import { db } from '../services/db';
import { generateCustomRoutine } from '../services/routineGenerator';
import { 
  importFreeExerciseDbIntoLibrary, 
  importExercisesByEquipment, 
  importExercisesForWorkouts, 
  getExercisesCountByEquipment 
} from '../services/freeExerciseDbService';
import { 
  X, 
  Sparkles, 
  Dumbbell, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle, 
  Flame, 
  Target,
  Download,
  Zap,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AutoWorkoutGeneratorModalProps {
  onClose: () => void;
  onGenerated: () => void;
}

export function AutoWorkoutGeneratorModal({ onClose, onGenerated }: AutoWorkoutGeneratorModalProps) {
  const currentUser = db.getCurrentUser();
  const allExercises = db.getExercises();

  const [goal, setGoal] = useState<FitnessGoal>(currentUser.goal || 'Ganho de massa muscular');
  const [level, setLevel] = useState<ExerciseLevel>(currentUser.experienceLevel || 'Intermediário');
  const [splitStyle, setSplitStyle] = useState<'full_body' | 'ppl' | 'classic' | 'upper_lower'>('full_body');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(currentUser.daysPerWeek || 3);
  const [timeAvailable, setTimeAvailable] = useState<number>(50); // min
  const [location, setLocation] = useState<TrainingLocation>(currentUser.trainingLocation || 'Academia');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>(currentUser.availableEquipment || ['Barra', 'Halteres', 'Máquinas', 'Cabos']);

  const [isGenerated, setIsGenerated] = useState(false);
  const [suggestedWorkouts, setSuggestedWorkouts] = useState<Workout[]>([]);
  const [suggestedSchedule, setSuggestedSchedule] = useState<WeeklyScheduleDay[]>([]);

  // Downloading state & feedback
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const hasFreeWeights = selectedEquipment.includes('Barra') || selectedEquipment.includes('Halteres');

  const toggleEquipment = (eq: EquipmentType) => {
    if (selectedEquipment.includes(eq)) {
      if (selectedEquipment.length > 1) {
        setSelectedEquipment(selectedEquipment.filter(e => e !== eq));
      }
    } else {
      setSelectedEquipment([...selectedEquipment, eq]);
    }
  };

  const handleGenerate = () => {
    const result = generateCustomRoutine({
      userId: currentUser.id,
      goal,
      level,
      daysPerWeek,
      location,
      availableExercises: allExercises,
      splitType: splitStyle,
      selectedEquipment
    });

    setSuggestedWorkouts(result.workouts);
    setSuggestedSchedule(result.schedule);
    setIsGenerated(true);
  };

  const handleDownloadWorkoutExercisesOnly = async () => {
    setIsDownloading(true);
    try {
      const res = await importExercisesForWorkouts(suggestedWorkouts);
      setDownloadFeedback(`✅ ${res.added > 0 ? `${res.added} exercício(s) específico(s)` : 'Todos os exercícios'} deste treino sincronizados do GitHub com sucesso!`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setDownloadFeedback('Erro ao baixar exercícios do treino.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadBarbellDumbbell = async () => {
    setIsDownloading(true);
    try {
      const res = await importExercisesByEquipment(['Barra', 'Halteres']);
      setDownloadFeedback(`🏋️ ${res.added} novos exercícios com Barra e Halteres baixados do GitHub!`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setDownloadFeedback('Erro ao baixar exercícios com barra e halteres.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllRepository = async () => {
    setIsDownloading(true);
    try {
      const res = await importFreeExerciseDbIntoLibrary({ autoTranslate: true });
      setDownloadFeedback(`⚡ Todos os 876 exercícios do repositório GitHub foram baixados em 1 clique!`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setDownloadFeedback('Erro ao baixar todos os exercícios.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToMyWorkouts = () => {
    // Save generated workouts to database
    suggestedWorkouts.forEach(w => {
      db.createWorkout({
        userId: currentUser.id,
        title: w.title,
        description: w.description,
        category: w.category,
        estimatedDurationMin: w.estimatedDurationMin,
        exercises: w.exercises
      });
    });

    // Update schedule
    db.setWeeklySchedule(suggestedSchedule);

    onGenerated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div 
        id="auto-workout-generator-modal"
        className="relative w-full max-w-2xl my-6 bg-[#12161d] border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in-95"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Inteligência de Treinamento FitPro</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Gerar Meu Treino com IA</h2>
            <p className="text-xs text-neutral-400">
              Monte uma rotina sob medida, com opção Full Body e download seletivo do GitHub
            </p>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Aviso de Saúde:</strong> As rotinas geradas são orientativas e baseadas em diretrizes científicas de treinamento de força. Ajuste as cargas conforme sua resposta física.
          </span>
        </div>

        {!isGenerated ? (
          /* FORM INPUTS */
          <div className="space-y-4 max-h-[calc(80vh-230px)] overflow-y-auto pr-1">
            {/* Goal */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                1. Qual é o seu objetivo principal?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Ganho de massa muscular',
                  'Emagrecimento',
                  'Força',
                  'Condicionamento físico',
                  'Saúde e qualidade de vida'
                ].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g as FitnessGoal)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors flex items-center justify-between cursor-pointer ${
                      goal === g 
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{g}</span>
                    {goal === g && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Style - Requested: Full Body Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                  2. Divisão / Estilo de Treino
                </label>
                <span className="text-[11px] text-emerald-400 font-bold">Opção Full Body disponível</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitStyle('full_body')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    splitStyle === 'full_body'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      Treino Full Body (Corpo Inteiro)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Treina todos os grupos musculares principais a cada sessão. Máxima eficiência, queima calórica e estímulo frequente.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitStyle('ppl')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitStyle === 'ppl'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    Push / Pull / Legs
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Empurrar (Peitoral/Ombros/Tríceps), Puxar (Costas/Bíceps) e Pernas/Glúteos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitStyle('classic')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitStyle === 'classic'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                    Divisão Clássica ABCD / ABCDE
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Grupos musculares isolados por sessão para alta intensidade e volume localizado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitStyle('upper_lower')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitStyle === 'upper_lower'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Superior / Inferior (Upper / Lower)
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Alternância equilibrada entre membros superiores (tronco) e inferiores (pernas).
                  </p>
                </button>
              </div>
            </div>

            {/* Level & Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                  3. Nível de Experiência
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Iniciante', 'Intermediário', 'Avançado'] as ExerciseLevel[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        level === l 
                          ? 'bg-emerald-500 text-black border-emerald-500 font-bold' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                  4. Dias por Semana
                </label>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysPerWeek(d)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                        daysPerWeek === d 
                          ? 'bg-emerald-500 text-black border-emerald-500' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                  5. Tempo por Treino
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 45, 60, 90].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTimeAvailable(m)}
                      className={`py-2 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        timeAvailable === m 
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                  6. Local de Treino
                </label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value as TrainingLocation)}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Academia">Academia Completa</option>
                  <option value="Em casa">Em Casa (Home Gym)</option>
                  <option value="Parque / Ar livre">Parque / Ao ar livre</option>
                  <option value="Box / Funcional">Box / Espaço Funcional</option>
                </select>
              </div>
            </div>

            {/* Equipment Available */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                  7. Equipamentos Disponíveis
                </label>
                {hasFreeWeights && (
                  <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 text-amber-400" />
                    Barra / Halteres ativos
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {(['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Peso corporal', 'Kettlebell', 'Elásticos', 'Cardio/Esteira'] as EquipmentType[]).map(eq => {
                  const isSelected = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected 
                          ? (eq === 'Barra' || eq === 'Halteres' 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' 
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold')
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{eq}
                    </button>
                  );
                })}
              </div>

              {hasFreeWeights && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Você possui <strong>Barra e/ou Halteres</strong> selecionados! Após gerar o treino, você poderá baixar os exercícios do GitHub que usam esses pesos livres.
                  </span>
                </div>
              )}
            </div>

            <button
              id="btn-generate-routine-confirm"
              type="button"
              onClick={handleGenerate}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
              CRIAR SUGESTÃO DE ROTINA {splitStyle === 'full_body' ? 'FULL BODY' : ''}
            </button>
          </div>
        ) : (
          /* PREVIEW GENERATED ROUTINE */
          <div className="space-y-4 max-h-[calc(80vh-200px)] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {splitStyle === 'full_body' ? '⚡ Rotina Full Body' : 'Rotina Pronta'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">Plano Semanal: {goal}</h3>
                <span className="text-xs text-neutral-300">{daysPerWeek} dias/semana • Nível {level}</span>
              </div>
              <button
                onClick={() => setIsGenerated(false)}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Alterar parâmetros
              </button>
            </div>

            {/* DOWNLOAD EXERCISES ACTION BOX (Requested by User) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161b24] via-[#131720] to-[#0f1218] border border-neutral-700/80 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Download de Exercícios do GitHub
                  </span>
                </div>
                {hasFreeWeights && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Pesos Livres Detectados
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-400">
                Escolha como deseja baixar os exercícios do repositório GitHub para o seu FitPro:
              </p>

              {downloadFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{downloadFeedback}</span>
                </div>
              )}

              {/* Action Buttons: Download only for workout vs all repository */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Button 1: Download ONLY exercises needed by this generated workout */}
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadWorkoutExercisesOnly}
                  className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all cursor-pointer group disabled:opacity-50"
                  title="Baixa apenas os exercícios que este treino específico vai utilizar, mantendo o app leve"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Baixar Só os Deste Treino
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      Leve
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">
                    Baixa do GitHub apenas os exercícios que você irá fazer nesta rotina gerada.
                  </p>
                </button>

                {/* Button 2: Download ALL exercises in 1 single button */}
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadAllRepository}
                  className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-purple-500/40 hover:border-purple-400 text-left transition-all cursor-pointer group disabled:opacity-50"
                  title="Baixa de uma só vez todos os 876 arquivos de exercícios em um só clique"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      Baixar Todos (1 Só Botão)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                      876 itens
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">
                    Baixa todo o acervo completo do GitHub traduzido para PT-BR de uma só vez.
                  </p>
                </button>
              </div>

              {/* Extra button if user has Barbell / Dumbbells */}
              {hasFreeWeights && (
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadBarbellDumbbell}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Baixar Exercícios com Barra e Halteres do GitHub</span>
                </button>
              )}
            </div>

            {/* Generated Workouts preview */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Treinos Gerados</span>
              {suggestedWorkouts.map(w => (
                <div key={w.id} className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{w.title}</h4>
                    <span className="text-xs text-emerald-400 font-medium">~{w.estimatedDurationMin} min</span>
                  </div>
                  <div className="space-y-1">
                    {w.exercises.map((e, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-neutral-400">
                        <span>{e.exerciseName}</span>
                        <span className="font-mono">{e.sets} séries × {e.reps} reps ({e.restTimeSec}s descanso)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly calendar distribution */}
            <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Distribuição Semanal</span>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {suggestedSchedule.map(day => (
                  <div key={day.dayOfWeek} className={`p-2 rounded-xl border ${day.isRest ? 'bg-neutral-950 border-neutral-800 text-neutral-500' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'}`}>
                    <div className="text-[10px] uppercase opacity-75">{day.dayOfWeek.substring(0, 3)}</div>
                    <div className="text-[11px] truncate mt-1">{day.isRest ? 'Off' : 'Treino'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsGenerated(false)}
                className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                id="btn-save-generated-routine"
                onClick={handleSaveToMyWorkouts}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>SALVAR NOS MEUS TREINOS E NA SEMANA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
