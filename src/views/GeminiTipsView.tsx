import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { 
  sendCoachChatMessage, 
  getCategoryTip, 
  ChatMessage, 
  StructuredTip 
} from '../services/geminiCoach';
import { 
  Sparkles, 
  Send, 
  Dumbbell, 
  Apple, 
  Moon, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  MessageSquare, 
  Zap, 
  Copy, 
  Check, 
  Lightbulb, 
  Info, 
  Bot, 
  User as UserIcon,
  Flame
} from 'lucide-react';

type TipCategory = 'treino' | 'nutricao' | 'recuperacao' | 'cargas' | 'prevencao';

export function GeminiTipsView() {
  const currentUser = db.getCurrentUser();

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'gemini',
      text: `Olá, ${currentUser.name.split(' ')[0]}! Sou o seu Consultor e Treinador IA Gemini. Estou calibrado para o seu objetivo de ${currentUser.goal} (${currentUser.experienceLevel}).\n\nVocê pode me perguntar qualquer dúvida sobre biomecânica, técnica de exercícios, dieta, suplementos ou periodização de cargas!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Active Category & Structured Tip
  const [selectedCategory, setSelectedCategory] = useState<TipCategory>('treino');
  const [categoryTip, setCategoryTip] = useState<StructuredTip | null>(null);
  const [loadingCategoryTip, setLoadingCategoryTip] = useState(false);
  const [copiedTip, setCopiedTip] = useState(false);

  const categories: { id: TipCategory; label: string; icon: any; color: string }[] = [
    { id: 'treino', label: 'Técnica & Execução', icon: Dumbbell, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { id: 'nutricao', label: 'Nutrição & Dieta', icon: Apple, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { id: 'recuperacao', label: 'Sono & Recuperação', icon: Moon, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    { id: 'cargas', label: 'Sobrecarga de Peso', icon: TrendingUp, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
    { id: 'prevencao', label: 'Prevenção & Articulações', icon: ShieldCheck, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' }
  ];

  // Quick Questions
  const quickQuestions = [
    'Como aumentar a carga no supino com segurança?',
    'Quanta água e proteína devo consumir por dia?',
    'Como aquecer os ombros antes de treinar peito?',
    'Qual a melhor cadência excêntrica para hipertrofia?'
  ];

  // Load initial category tip
  useEffect(() => {
    loadTipForCategory(selectedCategory);
  }, [selectedCategory]);

  const loadTipForCategory = async (cat: TipCategory) => {
    setLoadingCategoryTip(true);
    try {
      const tip = await getCategoryTip(cat, currentUser);
      setCategoryTip(tip);
    } catch (err) {
      console.warn('Notice loading category tip:', err);
    } finally {
      setLoadingCategoryTip(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const reply = await sendCoachChatMessage(text, [...messages, userMsg], currentUser);
      const botMsg: ChatMessage = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn('Notice sending coach message:', err);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleCopyTip = () => {
    if (!categoryTip) return;
    const textToCopy = `💡 Dica Gemini FitPro: ${categoryTip.title}\n${categoryTip.text}\n\n👉 Ação: ${categoryTip.action}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl bg-linear-to-r from-emerald-950/40 via-[#121922] to-neutral-900 border border-emerald-500/20 p-5 sm:p-7 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INTELIGÊNCIA ARTIFICIAL GEMINI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Área de Dicas & Consultoria IA
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Orientações biomecânicas personalizadas para seu perfil ({currentUser.goal}, {currentUser.experienceLevel}, {currentUser.weight}kg).
            </p>
          </div>

          {/* User Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-[#0a0d12]/70 border border-neutral-800 rounded-2xl p-3 shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Objetivo</div>
              <div className="text-xs font-black text-emerald-400">{currentUser.goal.split(' ')[0]}</div>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Nível</div>
              <div className="text-xs font-bold text-neutral-200">{currentUser.experienceLevel}</div>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Frequência</div>
              <div className="text-xs font-bold text-neutral-200">{currentUser.daysPerWeek}x/sem</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Category Explorer & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Dynamic Category Tips */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Tópicos de Treinamento
            </h2>
            <button
              onClick={() => loadTipForCategory(selectedCategory)}
              disabled={loadingCategoryTip}
              className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Gerar nova dica nesta categoria"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCategoryTip ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Atualizar dica</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : ''}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Structured Category Tip Card */}
          <div className="rounded-2xl bg-[#121720] border border-neutral-800 p-5 space-y-4 relative shadow-md">
            {loadingCategoryTip ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-neutral-400">Consultando base esportiva com o Gemini...</p>
              </div>
            ) : categoryTip ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                      DICA ESTRATÉGICA
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">
                      {categoryTip.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleCopyTip}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
                    title="Copiar dica"
                  >
                    {copiedTip ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {categoryTip.text}
                </p>

                {categoryTip.action && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="text-[11px] font-black text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                      AÇÃO PRÁTICA PARA HOJE:
                    </div>
                    <p className="text-xs text-neutral-200 font-medium leading-normal">
                      {categoryTip.action}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Quick Biomechanical Reminders */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-4 space-y-2.5">
            <div className="text-xs font-black text-neutral-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Princípios Fundamentais FitPro
            </div>
            <ul className="text-xs text-neutral-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Cadência:</strong> 2 a 3 segundos na fase excêntrica garantem o máximo de tensão muscular.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Respiração:</strong> Inspire ao alongar o músculo e expire no pico de contração.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Sobrecarga:</strong> Busque progredir repetições ou carga mantendo sempre a técnica intacta.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column (7 cols): Interactive Coach Q&A Chat */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl bg-[#11161f] border border-neutral-800 overflow-hidden shadow-lg h-[640px]">
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-[#141b25] border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Chat com Treinador Gemini</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-neutral-400">
                  Pergunte qualquer dúvida de treino, biomecânica e dieta
                </div>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2.5 bg-[#0e131a] border-b border-neutral-800/80 overflow-x-auto shrink-0 flex items-center gap-2 no-scrollbar">
            <span className="text-[10px] font-bold uppercase text-neutral-500 whitespace-nowrap">
              Perguntas rápidas:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isSending}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0d1219]/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'gemini' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-black font-semibold rounded-br-none'
                      : 'bg-[#151c27] border border-neutral-800 text-neutral-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-black/60' : 'text-neutral-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#151c27] border border-neutral-800 rounded-2xl rounded-bl-none px-3 py-2 text-neutral-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#141b25] border-t border-neutral-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Pergunte sobre exercícios, repetições, dieta..."
              disabled={isSending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isSending}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black transition-all active:scale-95 shrink-0"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
