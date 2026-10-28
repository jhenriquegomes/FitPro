import React, { useState } from 'react';
import { db } from '../services/db';
import { Exercise, MuscleGroup, EquipmentType, ExerciseLevel, ExerciseType, User } from '../types';
import { 
  X, 
  Users, 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Download, 
  Upload, 
  UploadCloud,
  RefreshCw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { processImageFile, getSafeImageUrl, DEFAULT_AVATAR_IMAGE } from '../services/imageUtils';

interface AdminPanelModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export function AdminPanelModal({ onClose, onRefreshData }: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exercises' | 'users' | 'database'>('dashboard');
  
  // Data from DB
  const users = db.getAllUsers();
  const exercises = db.getExercises();
  const history = db.getHistory();
  const workouts = db.getWorkouts();
  const muscleGroups = db.getMuscleGroups();
  const equipmentList = db.getEquipment();

  // Exercise Create / Edit state
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [exerciseForm, setExerciseForm] = useState<Omit<Exercise, 'id'>>({
    name: '',
    primaryMuscle: 'Peito',
    secondaryMuscles: [],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    initialPosition: '',
    movement: '',
    breathing: '',
    executionSteps: [''],
    commonMistakes: [''],
    executionTips: [''],
    recommendedSets: 3,
    recommendedReps: '10-12',
    recommendedRestSec: 60
  });

  // Database import/export state
  const [importStatus, setImportStatus] = useState<string>('');

  // Admin Dashboard stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.streakDays > 0).length;
  const totalWorkoutsCompleted = history.length;
  const totalExercisesCount = exercises.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const workoutsToday = history.filter(h => h.date === todayStr).length;
  const newUsersCount = users.filter(u => u.createdAt.startsWith(todayStr.substring(0, 7))).length;

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseForm.name) return;

    if (editingExercise) {
      db.updateExercise(editingExercise.id, exerciseForm);
    } else {
      db.createExercise(exerciseForm);
    }

    setIsCreatingExercise(false);
    setEditingExercise(null);
    onRefreshData();
  };

  const handleEditClick = (ex: Exercise) => {
    setEditingExercise(ex);
    setExerciseForm({
      name: ex.name,
      primaryMuscle: ex.primaryMuscle,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      level: ex.level,
      type: ex.type,
      imageUrl: ex.imageUrl,
      initialPosition: ex.initialPosition,
      movement: ex.movement,
      breathing: ex.breathing,
      executionSteps: ex.executionSteps,
      commonMistakes: ex.commonMistakes,
      executionTips: ex.executionTips,
      recommendedSets: ex.recommendedSets,
      recommendedReps: ex.recommendedReps,
      recommendedRestSec: ex.recommendedRestSec
    });
    setIsCreatingExercise(true);
  };

  const handleDeleteExercise = (id: string) => {
    if (confirm('Tem certeza que deseja remover este exercício do catálogo?')) {
      db.deleteExercise(id);
      onRefreshData();
    }
  };

  const handleExportDb = () => {
    const jsonStr = db.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitpro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportDb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = db.importDatabaseJson(content);
      if (success) {
        setImportStatus('Banco de dados restaurado com sucesso!');
        onRefreshData();
      } else {
        setImportStatus('Falha ao importar: arquivo JSON inválido.');
      }
      setTimeout(() => setImportStatus(''), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="admin-panel-modal"
        className="relative w-full max-w-5xl my-6 bg-[#10141a] border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in-95"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Administração do Sistema</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Acesso Restrito
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Painel Administrativo FitPro</h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsCreatingExercise(false); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'exercises' ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Exercícios ({exercises.length})
            </button>
            <button
              onClick={() => { setActiveTab('users'); setIsCreatingExercise(false); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Usuários ({users.length})
            </button>
            <button
              onClick={() => { setActiveTab('database'); setIsCreatingExercise(false); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'database' ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Banco de Dados
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Users className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-[11px] text-neutral-400 uppercase font-medium">Total de Usuários</div>
                <div className="text-2xl font-black text-white mt-1">{totalUsers}</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Activity className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-[11px] text-neutral-400 uppercase font-medium">Usuários Ativos</div>
                <div className="text-2xl font-black text-white mt-1">{activeUsers}</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-[11px] text-neutral-400 uppercase font-medium">Treinos Feitos</div>
                <div className="text-2xl font-black text-white mt-1">{totalWorkoutsCompleted}</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Dumbbell className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-[11px] text-neutral-400 uppercase font-medium">Exercícios</div>
                <div className="text-2xl font-black text-white mt-1">{totalExercisesCount}</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Calendar className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-[11px] text-neutral-400 uppercase font-medium">Treinos Hoje</div>
                <div className="text-2xl font-black text-white mt-1">{workoutsToday}</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-[11px] text-neutral-400 uppercase font-medium">Novos no Mês</div>
                <div className="text-2xl font-black text-white mt-1">{newUsersCount}</div>
              </div>
            </div>

            {/* Quick overview of latest activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Últimos Treinos Concluídos
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {history.slice(0, 5).map(h => (
                    <div key={h.id} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{h.workoutTitle}</div>
                        <div className="text-[10px] text-neutral-400">{h.date} • {h.totalSets} séries • {Math.round(h.durationSeconds / 60)} min</div>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold">{h.totalVolumeKg}kg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Usuários Registrados
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {users.map(u => (
                    <div key={u.id} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={getSafeImageUrl(u.avatarUrl, DEFAULT_AVATAR_IMAGE)} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[10px] text-neutral-400">{u.email}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-neutral-300'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXERCISES CRUD */}
        {activeTab === 'exercises' && (
          <div className="space-y-4">
            {!isCreatingExercise ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Catálogo de Exercícios</h3>
                  <button
                    onClick={() => {
                      setEditingExercise(null);
                      setExerciseForm({
                        name: '',
                        primaryMuscle: 'Peito',
                        secondaryMuscles: [],
                        equipment: 'Halteres',
                        level: 'Iniciante',
                        type: 'Hipertrofia',
                        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
                        initialPosition: '',
                        movement: '',
                        breathing: '',
                        executionSteps: [''],
                        commonMistakes: [''],
                        executionTips: [''],
                        recommendedSets: 3,
                        recommendedReps: '10-12',
                        recommendedRestSec: 60
                      });
                      setIsCreatingExercise(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Novo Exercício
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {exercises.map(ex => (
                    <div key={ex.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={getSafeImageUrl(ex.imageUrl)} alt="" className="w-12 h-12 rounded-lg object-cover bg-black" />
                        <div>
                          <div className="font-bold text-white text-sm">{ex.name}</div>
                          <div className="text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span className="text-emerald-400">{ex.primaryMuscle}</span>
                            <span>•</span>
                            <span>{ex.equipment}</span>
                            <span>•</span>
                            <span>{ex.level}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(ex)}
                          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(ex.id)}
                          className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* CREATE / EDIT FORM */
              <form onSubmit={handleSaveExercise} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-white">
                    {editingExercise ? 'Editar Exercício' : 'Cadastrar Novo Exercício'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingExercise(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Nome do Exercício *</label>
                    <input
                      type="text"
                      required
                      value={exerciseForm.name}
                      onChange={e => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                      placeholder="Ex: Supino Declinado"
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-neutral-300 block">URL da Imagem Demonstrativa</label>
                      <label className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-semibold">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Importar Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const { dataUrl } = await processImageFile(file);
                                setExerciseForm(prev => ({ ...prev, imageUrl: dataUrl }));
                              } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : 'Erro ao processar imagem';
                                alert(msg);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={exerciseForm.imageUrl}
                        onChange={e => setExerciseForm({ ...exerciseForm, imageUrl: e.target.value })}
                        className="flex-1 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs"
                        placeholder="https://... ou clique em Importar Imagem"
                      />
                      {exerciseForm.imageUrl && exerciseForm.imageUrl.trim() !== '' && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                          <img src={exerciseForm.imageUrl.trim()} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Grupo Muscular Principal</label>
                    <select
                      value={exerciseForm.primaryMuscle}
                      onChange={e => setExerciseForm({ ...exerciseForm, primaryMuscle: e.target.value as MuscleGroup })}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    >
                      {muscleGroups.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Equipamento</label>
                    <select
                      value={exerciseForm.equipment}
                      onChange={e => setExerciseForm({ ...exerciseForm, equipment: e.target.value as EquipmentType })}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    >
                      {equipmentList.map(eq => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Dificuldade</label>
                    <select
                      value={exerciseForm.level}
                      onChange={e => setExerciseForm({ ...exerciseForm, level: e.target.value as ExerciseLevel })}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Tipo de Exercício</label>
                    <select
                      value={exerciseForm.type}
                      onChange={e => setExerciseForm({ ...exerciseForm, type: e.target.value as ExerciseType })}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    >
                      <option value="Hipertrofia">Hipertrofia</option>
                      <option value="Força">Força</option>
                      <option value="Resistência">Resistência</option>
                      <option value="Mobilidade">Mobilidade</option>
                      <option value="Cardio">Cardio</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Séries Recomendadas</label>
                    <input
                      type="number"
                      value={exerciseForm.recommendedSets}
                      onChange={e => setExerciseForm({ ...exerciseForm, recommendedSets: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Reps Recomendadas</label>
                    <input
                      type="text"
                      value={exerciseForm.recommendedReps}
                      onChange={e => setExerciseForm({ ...exerciseForm, recommendedReps: e.target.value })}
                      placeholder="8-12"
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Descanso (segundos)</label>
                    <input
                      type="number"
                      value={exerciseForm.recommendedRestSec}
                      onChange={e => setExerciseForm({ ...exerciseForm, recommendedRestSec: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Posição Inicial</label>
                  <textarea
                    rows={2}
                    value={exerciseForm.initialPosition}
                    onChange={e => setExerciseForm({ ...exerciseForm, initialPosition: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Movimento e Execução</label>
                  <textarea
                    rows={2}
                    value={exerciseForm.movement}
                    onChange={e => setExerciseForm({ ...exerciseForm, movement: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Respiração</label>
                  <input
                    type="text"
                    value={exerciseForm.breathing}
                    onChange={e => setExerciseForm({ ...exerciseForm, breathing: e.target.value })}
                    placeholder="Ex: Inspire na descida, expire ao subir"
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingExercise(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Exercício
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Gerenciamento de Usuários</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {users.map(u => (
                <div key={u.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={getSafeImageUrl(u.avatarUrl, DEFAULT_AVATAR_IMAGE)} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-neutral-400">{u.email} • {u.goal} • {u.daysPerWeek}d/sem</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newRole = u.role === 'admin' ? 'user' : 'admin';
                        db.updateUser(u.id, { role: newRole });
                        onRefreshData();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold"
                    >
                      Papel: {u.role.toUpperCase()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE BACKUP & RESTORE */}
        {activeTab === 'database' && (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold text-white">Backup e Manutenção do Banco de Dados</h3>
              <p className="text-neutral-400 mt-1">
                Exporte todo o estado do sistema (usuários, treinos, histórico, recordes, catálogo de exercícios) em formato JSON ou restaure um backup existente.
              </p>
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-bold">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Exportar Backup Completo
                </h4>
                <p className="text-neutral-400">
                  Gera um arquivo JSON contendo todas as tabelas: USUÁRIOS, EXERCÍCIOS, TREINOS, HISTÓRICO, RECORDES, PLANEJAMENTO_SEMANAL.
                </p>
                <button
                  onClick={handleExportDb}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo JSON
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Restaurar Backup
                </h4>
                <p className="text-neutral-400">
                  Carregue um arquivo JSON de backup previamente exportado para recuperar dados.
                </p>
                <label className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo JSON
                  <input type="file" accept=".json" onChange={handleImportDb} className="hidden" />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-2">
              <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Restaurar Padrões de Fábrica
              </h4>
              <p className="text-neutral-400">
                Redefine o banco de dados com os treinos padrão, exercícios iniciais e usuários demonstrativos.
              </p>
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja resetar o banco de dados para os valores originais?')) {
                    db.resetToFactoryDefaults();
                    onRefreshData();
                    alert('Banco restaurado com os valores de fábrica!');
                  }
                }}
                className="py-2 px-4 rounded-xl bg-red-900/40 hover:bg-red-900/60 text-red-200 font-semibold"
              >
                Resetar para Fábrica
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
