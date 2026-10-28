import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { FitnessGoal, ExerciseLevel, TrainingLocation, EquipmentType } from '../types';
import { googleSignIn } from '../services/googleAuth';
import { 
  importFreeExerciseDbIntoLibrary, 
  importExercisesByEquipment, 
  importExercisesForWorkouts 
} from '../services/freeExerciseDbService';
import { 
  Sparkles, 
  Send, 
  User, 
  Dumbbell, 
  Target, 
  Flame, 
  Zap, 
  Heart, 
  ArrowRight, 
  Check, 
  Loader2, 
  LogIn,
  Download,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface ChatOnboardingViewProps {
  onComplete: () => void;
  onOpenLogin: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

type OnboardingStep = 
  | 'name' 
  | 'email' 
  | 'goal' 
  | 'level' 
  | 'stats' 
  | 'location'
  | 'equipment'
  | 'split'
  | 'days' 
  | 'generating' 
  | 'ready';

export function ChatOnboardingView({ onComplete, onOpenLogin }: ChatOnboardingViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('name');
  const [isTyping, setIsTyping] = useState(false);

  // Form states collected through chat
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userGoal, setUserGoal] = useState<FitnessGoal>('Ganho de massa muscular');
  const [userLevel, setUserLevel] = useState<ExerciseLevel>('Iniciante');
  const [userAge, setUserAge] = useState<number>(25);
  const [userWeight, setUserWeight] = useState<number>(72);
  const [userHeight, setUserHeight] = useState<number>(175);
  const [userLocation, setUserLocation] = useState<TrainingLocation>('Academia');
  const [userEquipment, setUserEquipment] = useState<EquipmentType[]>(['Barra', 'Halteres', 'Máquinas', 'Cabos']);
  const [userSplit, setUserSplit] = useState<'full_body' | 'ppl' | 'classic' | 'upper_lower'>('full_body');
  const [userDays, setUserDays] = useState<number>(3);
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');

  // Exercise download states in completion step
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const hasFreeWeights = userEquipment.includes('Barra') || userEquipment.includes('Halteres');

  // Input state for text questions
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    setIsTyping(true);
    const t = setTimeout(() => {
      setMessages([
        {
          id: 'msg-1',
          sender: 'bot',
          text: '👋 Olá! Seja muito bem-vindo ao FitPro. Eu sou o seu Treinador Virtual com IA Gemini.\n\nVamos montar a sua conta do zero e preparar o seu plano de treino ideal através de uma conversa rápida de perguntas e respostas.\n\nPara começarmos: qual é o seu nome ou como você gostaria de ser chamado?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const addBotMessage = (text: string, nextStep: OnboardingStep, delay = 500) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setCurrentStep(nextStep);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Step 1: Handle Name Submit
  const handleSendName = (e: React.FormEvent) => {
    e.preventDefault();
    const name = textInput.trim();
    if (!name) return;

    setUserName(name);
    setTextInput('');
    addUserMessage(name);

    addBotMessage(
      `Excelente, ${name}! 🚀\nQual é o seu e-mail? Ele será usado para salvar o seu acesso e permitir sincronizar backups seguros no seu Google Drive.`,
      'email'
    );
  };

  // Step 2: Handle Email Submit or Google Sign-In
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = textInput.trim();
    if (!email) return;

    setUserEmail(email);
    setTextInput('');
    addUserMessage(email);

    addBotMessage(
      `E-mail registrado! Agora me diga: qual é o seu principal objetivo físico neste momento?`,
      'goal'
    );
  };

  const handleGoogleQuickAuth = async () => {
    try {
      setIsTyping(true);
      const res = await googleSignIn();
      setUserName(res.name);
      setUserEmail(res.email);
      if (res.photoUrl) setUserAvatar(res.photoUrl);
      setAuthMethod('google');

      addUserMessage(`Conectado com o Google: ${res.name} (${res.email})`);
      addBotMessage(
        `Conta Google conectada com sucesso, ${res.name}! 🎉\n\nAgora vamos personalizar sua rotina: qual é o seu objetivo físico principal?`,
        'goal'
      );
    } catch (err) {
      console.warn('Google sign-in error or cancelled:', err);
      setIsTyping(false);
    }
  };

  // Step 3: Handle Goal Select
  const handleSelectGoal = (goal: FitnessGoal) => {
    setUserGoal(goal);
    addUserMessage(goal);

    addBotMessage(
      `Ótimo foco! E qual é o seu nível de experiência atual com musculação ou treinos de força?`,
      'level'
    );
  };

  // Step 4: Handle Level Select
  const handleSelectLevel = (level: ExerciseLevel) => {
    setUserLevel(level);
    addUserMessage(level);

    addBotMessage(
      `Perfeito! Para ajustarmos as cargas ideais e estimativas calóricas, confirme seus dados corporais básicos:`,
      'stats'
    );
  };

  // Step 5: Handle Stats Submit
  const handleSendStats = (e: React.FormEvent) => {
    e.preventDefault();
    addUserMessage(`${userAge} anos • ${userWeight} kg • ${userHeight} cm`);

    addBotMessage(
      `Anotado! Onde você pretende realizar os seus treinos na maior parte do tempo?`,
      'location'
    );
  };

  // Step 6: Handle Location Select
  const handleSelectLocation = (loc: TrainingLocation) => {
    setUserLocation(loc);
    addUserMessage(loc);

    addBotMessage(
      `Excelente! Quais equipamentos você tem à sua disposição para treinar?`,
      'equipment'
    );
  };

  // Step 7: Handle Equipment Select
  const handleSelectEquipmentOption = (label: string, equipments: EquipmentType[]) => {
    setUserEquipment(equipments);
    addUserMessage(label);

    addBotMessage(
      `Entendido! Agora me diga: qual estilo ou formato de treino você prefere realizar?`,
      'split'
    );
  };

  // Step 8: Handle Split Select (Requested: Full Body Option)
  const handleSelectSplit = (split: 'full_body' | 'ppl' | 'classic' | 'upper_lower', label: string) => {
    setUserSplit(split);
    addUserMessage(label);

    addBotMessage(
      `Ótima escolha de rotina! Quantos dias por semana você deseja se comprometer a treinar?`,
      'days'
    );
  };

  // Step 9: Handle Days Select & Start Generation
  const handleSelectDays = (days: number) => {
    setUserDays(days);
    addUserMessage(`${days} dias por semana`);

    setIsTyping(true);
    setCurrentStep('generating');

    setTimeout(() => {
      // Complete onboarding in DB with equipment & split
      db.completeChatOnboarding({
        name: userName || 'Atleta FitPro',
        email: userEmail || 'atleta@fitpro.com',
        avatarUrl: userAvatar || undefined,
        goal: userGoal,
        experienceLevel: userLevel,
        age: userAge,
        weight: userWeight,
        height: userHeight,
        trainingLocation: userLocation,
        daysPerWeek: days,
        availableEquipment: userEquipment,
        splitType: userSplit,
        authProvider: authMethod
      });

      setIsTyping(false);

      const splitDescription = userSplit === 'full_body' 
        ? '⚡ Treino Full Body (Corpo Inteiro)' 
        : userSplit === 'ppl' 
          ? '🔥 Push / Pull / Legs' 
          : userSplit === 'classic'
            ? '💪 Divisão Clássica ABCD'
            : '🎯 Superior / Inferior';

      const freeWeightsNotice = hasFreeWeights
        ? `\n\n🏋️ Equipamentos detectados: Barra e/ou Halteres! Se desejar, você pode baixar os exercícios com Barra e Halteres do repositório GitHub ou baixar todo o catálogo de uma só vez abaixo.`
        : '';

      setMessages(prev => [
        ...prev,
        {
          id: `bot-ready-${Date.now()}`,
          sender: 'bot',
          text: `🎯 Tudo pronto, ${userName.split(' ')[0] || 'Atleta'}!\n\nSua conta foi criada e seu ambiente está 100% pronto para você começar.\n\n• Objetivo: ${userGoal}\n• Formato: ${splitDescription}\n• Frequência: ${days}x por semana (${userLocation})\n• Equipamentos: ${userEquipment.join(', ')}${freeWeightsNotice}\n\nVocê pode baixar os exercícios agora ou entrar diretamente nos treinos!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setCurrentStep('ready');
    }, 1500);
  };

  // Action handlers for downloading exercises in ready step
  const handleDownloadWorkoutOnly = async () => {
    setIsDownloading(true);
    try {
      const workouts = db.getWorkouts();
      const res = await importExercisesForWorkouts(workouts);
      setDownloadFeedback(`✅ ${res.added > 0 ? `${res.added} exercícios` : 'Exercícios'} deste treino baixados do GitHub com sucesso!`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch {
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
    } catch {
      setDownloadFeedback('Erro ao baixar exercícios com barra e halteres.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllRepository = async () => {
    setIsDownloading(true);
    try {
      const res = await importFreeExerciseDbIntoLibrary({ autoTranslate: true });
      setDownloadFeedback(`⚡ Todos os 876 exercícios do GitHub foram baixados em 1 clique!`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch {
      setDownloadFeedback('Erro ao baixar acervo completo.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] text-neutral-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-[#0e131a]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider text-white">FITPRO</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  TREINADOR GEMINI
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Criação de Conta Interativa
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            title="Entrar com conta existente"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Já tenho conta</span>
          </button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md ${
                msg.sender === 'user'
                  ? 'bg-emerald-500 text-black font-semibold rounded-br-none'
                  : 'bg-[#131923] border border-neutral-800 text-neutral-200 rounded-bl-none'
              }`}
            >
              {msg.text}
              <div
                className={`text-[10px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-black/60' : 'text-neutral-500'
                }`}
              >
                {msg.time}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-[#131923] border border-neutral-800 rounded-2xl rounded-bl-none px-4 py-3 text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Action Input Area */}
      <div className="sticky bottom-0 z-20 bg-[#0e131a]/95 backdrop-blur-md border-t border-neutral-800/80 p-4">
        <div className="max-w-3xl mx-auto">
          {/* STEP 1: NAME INPUT */}
          {currentStep === 'name' && (
            <form onSubmit={handleSendName} className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Digite seu nome ou apelido..."
                className="flex-1 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: EMAIL INPUT & GOOGLE OPTION */}
          {currentStep === 'email' && (
            <div className="space-y-3">
              <form onSubmit={handleSendEmail} className="flex gap-2">
                <input
                  type="email"
                  autoFocus
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="flex-1 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Continuar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px bg-neutral-800 flex-1" />
                <span className="text-[11px] text-neutral-500">ou</span>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGoogleQuickAuth}
                className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
                Preencher e vincular com minha Conta Google
              </button>
            </div>
          )}

          {/* STEP 3: GOAL SELECT */}
          {currentStep === 'goal' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectGoal('Ganho de massa muscular')}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <Target className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Hipertrofia</div>
                <div className="text-[10px] text-neutral-400">Ganhar massa magra</div>
              </button>

              <button
                onClick={() => handleSelectGoal('Emagrecimento')}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <Flame className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Emagrecimento</div>
                <div className="text-[10px] text-neutral-400">Perda de gordura</div>
              </button>

              <button
                onClick={() => handleSelectGoal('Força')}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <Zap className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Aumento de Força</div>
                <div className="text-[10px] text-neutral-400">Cargas mais pesadas</div>
              </button>

              <button
                onClick={() => handleSelectGoal('Condicionamento físico')}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <Dumbbell className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Condicionamento</div>
                <div className="text-[10px] text-neutral-400">Resistência física</div>
              </button>

              <button
                onClick={() => handleSelectGoal('Saúde e qualidade de vida')}
                className="col-span-2 sm:col-span-2 p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <Heart className="w-5 h-5 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Saúde e Bem-estar</div>
                <div className="text-[10px] text-neutral-400">Postura, longevidade e disposição</div>
              </button>
            </div>
          )}

          {/* STEP 4: LEVEL SELECT */}
          {currentStep === 'level' && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectLevel('Iniciante')}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-center transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <span className="text-xl block mb-1">🟢</span>
                <div className="text-xs font-bold text-white">Iniciante</div>
                <div className="text-[10px] text-neutral-400">&lt; 6 meses</div>
              </button>

              <button
                onClick={() => handleSelectLevel('Intermediário')}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-center transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <span className="text-xl block mb-1">🟡</span>
                <div className="text-xs font-bold text-white">Intermediário</div>
                <div className="text-[10px] text-neutral-400">6 meses a 2 anos</div>
              </button>

              <button
                onClick={() => handleSelectLevel('Avançado')}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-center transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <span className="text-xl block mb-1">🔴</span>
                <div className="text-xs font-bold text-white">Avançado</div>
                <div className="text-[10px] text-neutral-400">&gt; 2 anos consistentes</div>
              </button>
            </div>
          )}

          {/* STEP 5: PHYSICAL STATS */}
          {currentStep === 'stats' && (
            <form onSubmit={handleSendStats} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Idade</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={14}
                      max={99}
                      value={userAge}
                      onChange={e => setUserAge(Number(e.target.value))}
                      className="w-full bg-transparent text-sm font-black text-white focus:outline-hidden"
                    />
                    <span className="text-xs text-neutral-500">anos</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Peso</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={35}
                      max={220}
                      value={userWeight}
                      onChange={e => setUserWeight(Number(e.target.value))}
                      className="w-full bg-transparent text-sm font-black text-white focus:outline-hidden"
                    />
                    <span className="text-xs text-neutral-500">kg</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Altura</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={120}
                      max={230}
                      value={userHeight}
                      onChange={e => setUserHeight(Number(e.target.value))}
                      className="w-full bg-transparent text-sm font-black text-white focus:outline-hidden"
                    />
                    <span className="text-xs text-neutral-500">cm</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98 cursor-pointer"
              >
                <span>Confirmar Dados Corporais</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 6: LOCATION SELECT */}
          {currentStep === 'location' && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectLocation('Academia')}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-center transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <span className="text-2xl block mb-1">🏋️</span>
                <div className="text-xs font-bold text-white">Na Academia</div>
                <div className="text-[10px] text-neutral-400">Equipamentos completos</div>
              </button>

              <button
                onClick={() => handleSelectLocation('Em casa')}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-center transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <span className="text-2xl block mb-1">🏠</span>
                <div className="text-xs font-bold text-white">Em Casa</div>
                <div className="text-[10px] text-neutral-400">Halteres ou peso livre</div>
              </button>

              <button
                onClick={() => handleSelectLocation('Parque / Ar livre')}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-center transition-all hover:border-emerald-500/50 group cursor-pointer"
              >
                <span className="text-2xl block mb-1">🌳</span>
                <div className="text-xs font-bold text-white">Calistenia</div>
                <div className="text-[10px] text-neutral-400">Ao ar livre / funcional</div>
              </button>
            </div>
          )}

          {/* STEP 7: EQUIPMENT SELECT (Requested: Barbell / Dumbbell handling) */}
          {currentStep === 'equipment' && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 text-center font-semibold mb-1">
                Quais equipamentos você possui para treinar?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectEquipmentOption(
                    'Barra e Halteres (Pesos Livres)',
                    ['Barra', 'Halteres', 'Peso corporal']
                  )}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-left transition-all hover:border-amber-400 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏋️</span>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300">
                      Barra e Halteres
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Treino com pesos livres. O FitPro sincronizará os exercícios correspondentes do GitHub!
                  </p>
                </button>

                <button
                  onClick={() => handleSelectEquipmentOption(
                    'Apenas Halteres',
                    ['Halteres', 'Peso corporal']
                  )}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🦾</span>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Apenas Halteres
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Par de halteres ajustáveis ou fixos em casa ou condomínio.
                  </p>
                </button>

                <button
                  onClick={() => handleSelectEquipmentOption(
                    'Academia Completa (Barras, Halteres, Máquinas, Cabos)',
                    ['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Peso corporal']
                  )}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏢</span>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Academia Completa
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Acesso a aparelhos, roldanas de cabos, anilhas, barras e halteres.
                  </p>
                </button>

                <button
                  onClick={() => handleSelectEquipmentOption(
                    'Apenas Peso Corporal (Sem Equipamentos)',
                    ['Peso corporal']
                  )}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🤸</span>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Peso Corporal
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Calistenia pura, flexões, agachamentos e movimentos funcionais.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: SPLIT SELECT (Requested: Treino Full Body Option) */}
          {currentStep === 'split' && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 text-center font-semibold mb-1">
                Qual estilo de divisão você prefere?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* FULL BODY OPTION */}
                <button
                  onClick={() => handleSelectSplit('full_body', 'Treino Full Body (Corpo Inteiro)')}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/50 text-left transition-all hover:border-emerald-400 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-white group-hover:text-emerald-300">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Treino Full Body</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">
                    Trabalha todos os grupos musculares principais a cada sessão. Máxima queima calórica e frequência.
                  </p>
                </button>

                {/* PUSH PULL LEGS */}
                <button
                  onClick={() => handleSelectSplit('ppl', 'Push / Pull / Legs (Empurrar, Puxar e Pernas)')}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-300 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Push / Pull / Legs</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">
                    Separação clássica de Empurrar (Peitoral/Tríceps), Puxar (Costas/Bíceps) e Pernas.
                  </p>
                </button>

                {/* CLASSIC ABCD */}
                <button
                  onClick={() => handleSelectSplit('classic', 'Divisão Clássica ABCD')}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-300 mb-1">
                    <Dumbbell className="w-4 h-4 text-blue-400" />
                    <span>Divisão Clássica ABCD</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">
                    Foco isolado por grupo muscular para maior carga e pump específico.
                  </p>
                </button>

                {/* UPPER LOWER */}
                <button
                  onClick={() => handleSelectSplit('upper_lower', 'Superior / Inferior (Upper/Lower)')}
                  className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all hover:border-emerald-500/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-300 mb-1">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Superior / Inferior</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-snug">
                    Alternância eficiente entre membros superiores e pernas.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 9: DAYS PER WEEK SELECT */}
          {currentStep === 'days' && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 text-center font-semibold mb-1">
                Escolha sua frequência semanal de treinos:
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => handleSelectDays(d)}
                    className="py-3 px-2 rounded-2xl bg-neutral-900 hover:bg-emerald-500 hover:text-black border border-neutral-800 text-center font-black text-sm transition-all cursor-pointer"
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GENERATING ANIMATION */}
          {currentStep === 'generating' && (
            <div className="py-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>O Gemini está estruturando sua conta e montando seu plano de treinos...</span>
              </div>
              <div className="w-48 h-1.5 bg-neutral-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* STEP: READY SCREEN WITH DOWNLOAD OPTIONS (Requested by User) */}
          {currentStep === 'ready' && (
            <div className="space-y-3">
              {downloadFeedback && (
                <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{downloadFeedback}</span>
                </div>
              )}

              {/* Download Option Box */}
              <div className="p-3.5 rounded-2xl bg-[#141922] border border-neutral-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Opções de Download do GitHub:
                  </span>
                  {hasFreeWeights && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Barra/Halteres Ativos
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Button 1: Download ONLY exercises for generated workout */}
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownloadWorkoutOnly}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
                        <Download className="w-3 h-3 text-emerald-400" />
                        Só Exercícios Deste Treino
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        Leve
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block">
                      Baixa do GitHub apenas os que você irá fazer nesta rotina.
                    </span>
                  </button>

                  {/* Button 2: Download ALL in 1 button */}
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownloadAllRepository}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-purple-500/40 hover:border-purple-400 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-purple-400" />
                        Baixar Todos (1 Só Botão)
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                        876 itens
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block">
                      Baixa o acervo completo de 876 exercícios de uma só vez.
                    </span>
                  </button>
                </div>

                {hasFreeWeights && (
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownloadBarbellDumbbell}
                    className="w-full py-2 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Baixar Exercícios com Barra e Halteres do GitHub</span>
                  </button>
                )}
              </div>

              {/* PRIMARY PROCEED BUTTON */}
              <button
                onClick={onComplete}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <span>ACESSAR MEUS TREINOS E DICAS GEMINI</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
