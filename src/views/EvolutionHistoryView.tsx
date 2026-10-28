import React, { useState } from 'react';
import { db } from '../services/db';
import { WorkoutHistoryItem, PersonalRecord, Workout } from '../types';
import { SocialShareModal } from '../components/SocialShareModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  History, 
  TrendingUp, 
  Trophy, 
  Calendar, 
  Clock, 
  Flame, 
  Dumbbell, 
  Search, 
  Share2, 
  Trash2, 
  Play, 
  X, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight,
  Target
} from 'lucide-react';

interface EvolutionHistoryViewProps {
  onStartWorkout: (workout: Workout) => void;
}

export function EvolutionHistoryView({ onStartWorkout }: EvolutionHistoryViewProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'evolution' | 'records'>('evolution');
  const [history, setHistory] = useState<WorkoutHistoryItem[]>(() => db.getHistory());
  const [records, setRecords] = useState<PersonalRecord[]>(() => db.getRecords());
  const currentUser = db.getCurrentUser();

  // Search & Filter in History
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<WorkoutHistoryItem | null>(null);
  const [shareItem, setShareItem] = useState<WorkoutHistoryItem | null>(null);

  // Load progression filter for charts
  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState<string>('Supino Reto com Barra');

  const refreshData = () => {
    setHistory(db.getHistory());
    setRecords(db.getRecords());
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja remover este treino do histórico?')) {
      db.deleteHistoryItem(id);
      refreshData();
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
    }
  };

  const handleRepeatWorkout = (historyItem: WorkoutHistoryItem) => {
    // Look up original workout or recreate a temporary Workout object
    const existingWorkout = db.getWorkouts().find(w => w.title === historyItem.workoutTitle);
    if (existingWorkout) {
      onStartWorkout(existingWorkout);
    } else {
      // Build workout from history log
      const syntheticWorkout: Workout = {
        id: 'repeat-' + historyItem.id,
        userId: currentUser.id,
        title: historyItem.workoutTitle,
        description: 'Repetição de treino realizado em ' + historyItem.date,
        category: 'Personalizado',
        estimatedDurationMin: Math.round(historyItem.durationSeconds / 60),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exercises: historyItem.exercisesLog.map((log, idx) => ({
          id: 'swe-' + idx,
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          sets: log.sets.length || 3,
          reps: log.sets[0]?.reps || 10,
          loadKg: log.sets[0]?.loadKg || 20,
          restTimeSec: 60,
          order: idx
        }))
      };
      onStartWorkout(syntheticWorkout);
    }
  };

  // Evolution Stats Calculation
  const totalVolumeAllTime = history.reduce((sum, h) => sum + h.totalVolumeKg, 0);
  const totalDurationMinAllTime = Math.round(history.reduce((sum, h) => sum + h.durationSeconds, 0) / 60);
  const totalCaloriesAllTime = history.reduce((sum, h) => sum + (h.estimatedCalories || 0), 0);

  // Muscle frequency analysis
  const muscleCounts: Record<string, number> = {};
  history.forEach(h => {
    h.exercisesLog.forEach(ex => {
      const exData = db.getExerciseById(ex.exerciseId);
      const muscle = exData?.primaryMuscle || 'Outros';
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + ex.sets.length;
    });
  });

  const muscleChartData = Object.entries(muscleCounts).map(([name, sets]) => ({
    name,
    sets
  })).sort((a, b) => b.sets - a.sets);

  // Volume progression over time chart data
  const volumeHistoryData = [...history].reverse().map(h => ({
    date: h.date.substring(5), // MM-DD
    volume: h.totalVolumeKg,
    workout: h.workoutTitle
  }));

  // Progression for specific exercise (e.g. Supino Reto)
  const progressionData: { date: string; maxLoad: number }[] = [];
  [...history].reverse().forEach(h => {
    const matchedLog = h.exercisesLog.find(e => e.exerciseName.toLowerCase().includes(selectedProgressionExercise.toLowerCase()));
    if (matchedLog) {
      const maxL = Math.max(...matchedLog.sets.map(s => s.loadKg), 0);
      if (maxL > 0) {
        progressionData.push({
          date: h.date.substring(5),
          maxLoad: maxL
        });
      }
    }
  });

  // Filtered history list
  const filteredHistory = history.filter(h => 
    h.workoutTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.exercisesLog.some(e => e.exerciseName.toLowerCase().includes(historySearch.toLowerCase())) ||
    h.date.includes(historySearch)
  );

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6', '#6366f1'];

  return (
    <div id="evolution-history-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Progresso & Registro</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Evolução e Histórico</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Acompanhe a progressão de cargas, consistência semanal e recordes pessoais
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'evolution' 
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Evolução
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'history' 
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico ({history.length})
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'records' 
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Recordes ({records.length})
          </button>
        </div>
      </div>

      {/* TAB 1: EVOLUÇÃO E ESTATÍSTICAS */}
      {activeTab === 'evolution' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Volume Levantado</span>
                <Dumbbell className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                {(totalVolumeAllTime / 1000).toFixed(1)} <span className="text-xs font-normal text-neutral-400">toneladas</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">Carga acumulada em treinos</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Tempo Treinado</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                {Math.round(totalDurationMinAllTime / 60)} <span className="text-xs font-normal text-neutral-400">horas</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">{history.length} sessões registradas</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Calorias Queimadas</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                ~{totalCaloriesAllTime.toLocaleString('pt-BR')} <span className="text-xs font-normal text-neutral-400">kcal</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">Gasto calórico estimado</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Recordes Superados</span>
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                {records.length} <span className="text-xs font-normal text-neutral-400">marcas</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">PRs pessoais registrados</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Volume Progression */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Evolução do Volume Total (kg)
                  </h3>
                  <span className="text-xs text-neutral-400">Volume de carga levantado por treino</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeHistoryData.length > 0 ? volumeHistoryData : [{ date: 'Hoje', volume: 0, workout: 'Início' }]}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181f29', borderColor: '#2e3a4b', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#volumeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Muscles Trained Breakdown */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Distribuição por Músculos (Séries)
                  </h3>
                  <span className="text-xs text-neutral-400">Grupos musculares mais e menos trabalhados</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={muscleChartData.length > 0 ? muscleChartData.slice(0, 6) : [{ name: 'Peito', sets: 10 }]}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181f29', borderColor: '#2e3a4b', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="sets" fill="#10b981" radius={[8, 8, 0, 0]}>
                      {muscleChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Exercise-Specific Load Progression */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  Progressão de Carga por Exercício
                </h3>
                <span className="text-xs text-neutral-400">Acompanhe o aumento de força máxima ao longo das semanas</span>
              </div>

              <select
                value={selectedProgressionExercise}
                onChange={e => setSelectedProgressionExercise(e.target.value)}
                className="py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:border-emerald-500"
              >
                <option value="Supino Reto com Barra">Supino Reto com Barra</option>
                <option value="Agachamento Livre com Barra">Agachamento Livre com Barra</option>
                <option value="Levantamento Terra Convencional">Levantamento Terra</option>
                <option value="Puxada Alta no Pulley">Puxada Alta</option>
                <option value="Desenvolvimento Militar com Barra">Desenvolvimento Militar</option>
                <option value="Rosca Direta com Barra">Rosca Direta</option>
              </select>
            </div>

            {progressionData.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressionData}>
                    <defs>
                      <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181f29', borderColor: '#2e3a4b', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="maxLoad" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#loadGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400 bg-neutral-900/40 rounded-2xl border border-neutral-800/80">
                Nenhum dado de carga registrado ainda para "{selectedProgressionExercise}". Realize treinos com este exercício para ver a curva de progressão.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE TREINOS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Buscar treino por nome, exercício ou data (ex: 2026-09)..."
              className="w-full py-2.5 pl-10 pr-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center border border-neutral-800 rounded-3xl bg-[#12161c] space-y-2">
              <History className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhum treino no histórico</h3>
              <p className="text-xs text-neutral-400">Conclua um treino para começar a registrar seu progresso aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHistoryItem(item)}
                  className="group p-4 sm:p-5 rounded-2xl bg-[#12161c] border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-[10px] uppercase font-bold">{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-base font-black leading-none">{item.date.split('-')[2]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {item.workoutTitle}
                        </h3>
                        {item.newPrs && item.newPrs.length > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            🏆 PR
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {Math.round(item.durationSeconds / 60)} min
                        </span>
                        <span>•</span>
                        <span>{item.totalSets} séries</span>
                        <span>•</span>
                        <span>{item.totalReps} reps</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono font-semibold">{item.totalVolumeKg} kg volume</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShareItem(item);
                      }}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Compartilhar nas redes"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRepeatWorkout(item);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
                      title="Repetir este treino agora"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-300" />
                      Repetir
                    </button>

                    <button
                      onClick={e => handleDeleteHistory(item.id, e)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECORDES PESSOAIS (PR) */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Quadro de Honra FitPro</h3>
                <p className="text-xs text-neutral-400">
                  Suas maiores marcas históricas de força e carga registradas automaticamente durante a execução
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {records.map(record => (
              <div
                key={record.id}
                className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Recorde Pessoal
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      {record.exerciseName}
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    🏆
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-white">
                    {record.loadKg}
                  </span>
                  <span className="text-sm font-bold text-neutral-400">kg</span>
                  <span className="text-xs text-neutral-500 ml-auto">
                    ({record.reps} reps)
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <span>Conquistado em:</span>
                  <span className="font-mono text-neutral-300">
                    {new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED HISTORY LOG MODAL */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-6 bg-[#12161d] border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-white animate-in zoom-in-95">
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Detalhes da Sessão</span>
              <h2 className="text-xl font-black text-white mt-1">{selectedHistoryItem.workoutTitle}</h2>
              <p className="text-xs text-neutral-400">
                {new Date(selectedHistoryItem.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {selectedHistoryItem.startTime} às {selectedHistoryItem.endTime}
              </p>
            </div>

            {/* Metric pill row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase">Tempo</div>
                <div className="font-bold text-white font-mono text-sm mt-0.5">{Math.round(selectedHistoryItem.durationSeconds / 60)} min</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase">Séries</div>
                <div className="font-bold text-white font-mono text-sm mt-0.5">{selectedHistoryItem.totalSets}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase">Volume</div>
                <div className="font-bold text-white font-mono text-sm mt-0.5">{selectedHistoryItem.totalVolumeKg} kg</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase">Calorias</div>
                <div className="font-bold text-white font-mono text-sm mt-0.5">~{selectedHistoryItem.estimatedCalories} kcal</div>
              </div>
            </div>

            {/* List of sets per exercise */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
              {selectedHistoryItem.exercisesLog.map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <div className="font-bold text-white text-sm">{log.exerciseName}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-neutral-300">
                    {log.sets.map(s => (
                      <div key={s.setNumber} className="p-1.5 rounded bg-neutral-800/80 text-center font-mono text-[11px]">
                        Série {s.setNumber}: {s.loadKg}kg × {s.reps}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShareItem(selectedHistoryItem)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar Treino
              </button>
              <button
                onClick={() => {
                  handleRepeatWorkout(selectedHistoryItem);
                  setSelectedHistoryItem(null);
                }}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Repetir Treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL SHARE MODAL */}
      {shareItem && (
        <SocialShareModal
          historyItem={shareItem}
          user={currentUser}
          onClose={() => setShareItem(null)}
        />
      )}
    </div>
  );
}
