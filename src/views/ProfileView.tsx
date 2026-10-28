import React, { useState } from 'react';
import { db } from '../services/db';
import { User, FitnessGoal, ExerciseLevel, TrainingLocation, EquipmentType, UserBadge } from '../types';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { GoogleBackupManager } from '../components/GoogleBackupManager';
import { badgeService } from '../services/badgeService';
import { BadgeMedalIcon } from '../components/BadgeMedalIcon';
import { AchievementShareModal } from '../components/AchievementShareModal';
import { DailyReminderModal } from '../components/DailyReminderModal';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../services/i18n';
import { getSafeImageUrl, DEFAULT_AVATAR_IMAGE } from '../services/imageUtils';
import { 
  User as UserIcon, 
  Settings, 
  Crown, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Flame, 
  Check, 
  Save, 
  LogOut, 
  Sparkles,
  Award,
  Bell,
  Trash2,
  AlertTriangle,
  Mail,
  Edit3,
  X,
  RotateCcw,
  Trophy,
  Target,
  Dumbbell,
  Share2,
  Calendar
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAdmin: () => void;
  onOpenPro: () => void;
  onOpenAuth: () => void;
}

export function ProfileView({ onOpenAdmin, onOpenPro, onOpenAuth }: ProfileViewProps) {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form states
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [age, setAge] = useState(currentUser.age || 26);
  const [height, setHeight] = useState(currentUser.height || 175);
  const [weight, setWeight] = useState(currentUser.weight || 75);
  const [goal, setGoal] = useState<FitnessGoal>(currentUser.goal || 'Ganho de massa muscular');
  const [experienceLevel, setExperienceLevel] = useState<ExerciseLevel>(currentUser.experienceLevel || 'Intermediário');
  const [daysPerWeek, setDaysPerWeek] = useState(currentUser.daysPerWeek || 4);
  const [location, setLocation] = useState<TrainingLocation>(currentUser.trainingLocation || 'Academia');

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState(currentUser.soundEnabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(currentUser.vibrationEnabled ?? true);
  const [autoRestTimer, setAutoRestTimer] = useState(currentUser.autoRestTimer ?? true);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(currentUser.unitSystem || 'metric');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Badges & Achievements System
  const [selectedBadgeForModal, setSelectedBadgeForModal] = useState<UserBadge | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'days' | 'volume' | 'records'>('all');

  const history = db.getHistory();
  const records = db.getRecords();
  const allBadges = badgeService.getUserBadges(currentUser, history, records);
  const unlockedBadges = badgeService.getUnlockedBadges(currentUser, history, records);
  const lockedBadges = badgeService.getLockedBadges(currentUser, history, records);
  const totalVolumeLifted = history.reduce((sum, h) => sum + (h.totalVolumeKg || 0), 0);

  const filteredBadges = allBadges.filter(b => {
    if (badgeFilter === 'unlocked') return b.unlocked;
    if (badgeFilter === 'days') return b.category === 'days' || b.category === 'streak';
    if (badgeFilter === 'volume') return b.category === 'volume';
    if (badgeFilter === 'records') return b.category === 'records';
    return true;
  });

  // Avatar presets
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300'
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.updateUser(currentUser.id, {
      name,
      email,
      avatarUrl: avatarUrl || currentUser.avatarUrl,
      age,
      height,
      weight,
      goal,
      experienceLevel,
      daysPerWeek,
      trainingLocation: location,
      soundEnabled,
      vibrationEnabled,
      autoRestTimer,
      unitSystem
    });

    if (updated) {
      setCurrentUser(updated);
    }
    setIsEditingProfile(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR') return;

    setIsDeletingAccount(true);
    try {
      db.deleteAccount(currentUser.id);
      const nextUser = db.getCurrentUser();
      setCurrentUser(nextUser);
      setShowDeleteAccountModal(false);
      setDeleteConfirmText('');
      onOpenAuth();
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleTogglePreference = (key: 'soundEnabled' | 'vibrationEnabled' | 'autoRestTimer') => {
    let newVal = false;
    if (key === 'soundEnabled') {
      newVal = !soundEnabled;
      setSoundEnabled(newVal);
    } else if (key === 'vibrationEnabled') {
      newVal = !vibrationEnabled;
      setVibrationEnabled(newVal);
    } else if (key === 'autoRestTimer') {
      newVal = !autoRestTimer;
      setAutoRestTimer(newVal);
    }

    db.updateUser(currentUser.id, { [key]: newVal });
  };

  // BMI Calculation
  const heightM = (currentUser.height || 175) / 100;
  const bmi = ((currentUser.weight || 75) / (heightM * heightM)).toFixed(1);

  return (
    <div id="profile-view" className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Profile Card Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-radial from-[#151c22] via-[#11151b] to-[#0c0f13] border border-neutral-800 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative">
            <img
              src={getSafeImageUrl(currentUser.avatarUrl, DEFAULT_AVATAR_IMAGE)}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/50 shadow-xl"
            />
            {currentUser.isPro && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold shadow-md">
                <Crown className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
              {currentUser.role === 'admin' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">{currentUser.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {currentUser.goal}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                Nível {currentUser.experienceLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Pro Banner Button */}
        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenPro}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              currentUser.isPro
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:opacity-90 shadow-md shadow-amber-500/20'
            }`}
          >
            <Crown className="w-4 h-4" />
            {currentUser.isPro ? 'PLANO PRO ATIVO 🌟' : 'FAZER UPGRADE PRO'}
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Painel do Administrador
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          Perfil e configurações atualizados com sucesso!
        </div>
      )}

      {/* Google Drive Cloud Backup & Sync */}
      <GoogleBackupManager onDataRestored={() => setCurrentUser(db.getCurrentUser())} />

      {/* Body Stats & Streak */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">Peso Corporal</div>
          <div className="text-xl font-black font-mono text-white mt-1">{currentUser.weight} kg</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">Altura</div>
          <div className="text-xl font-black font-mono text-white mt-1">{currentUser.height} cm</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">IMC Estimado</div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">{bmi}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">Frequência</div>
          <div className="text-xl font-black font-mono text-white mt-1">{currentUser.daysPerWeek} dias/sem</div>
        </div>
      </div>

      {/* Sistema de Conquistas & Medalhas (Badges) */}
      <section id="profile-achievements-section" className="p-6 sm:p-7 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Conquistas & Medalhas</h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {unlockedBadges.length}/{allBadges.length} Concretizadas
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Desbloqueie medalhas exclusivas atingindo metas de dias de treino, carga levantada e recordes
              </p>
            </div>
          </div>

          {unlockedBadges.length > 0 && (
            <button
              onClick={() => setSelectedBadgeForModal(unlockedBadges[0])}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Histórico & Compartilhar</span>
            </button>
          )}
        </div>

        {/* Highlight KPI metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Medalhas Ativas</span>
            <span className="text-base font-black text-amber-400 font-mono">🏆 {unlockedBadges.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Levantado</span>
            <span className="text-base font-black text-emerald-400 font-mono">{totalVolumeLifted.toLocaleString('pt-BR')} kg</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Sequência (Streak)</span>
            <span className="text-base font-black text-orange-400 font-mono">🔥 {currentUser.streakDays || 0} dias</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Recordes Pessoais</span>
            <span className="text-base font-black text-blue-400 font-mono">⚡ {records.length} PRs</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setBadgeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              badgeFilter === 'all' ? 'bg-emerald-500 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todas ({allBadges.length})
          </button>
          <button
            onClick={() => setBadgeFilter('unlocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              badgeFilter === 'unlocked' ? 'bg-emerald-500 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Concretizadas ({unlockedBadges.length})
          </button>
          <button
            onClick={() => setBadgeFilter('days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              badgeFilter === 'days' ? 'bg-emerald-500 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Dias & Frequência
          </button>
          <button
            onClick={() => setBadgeFilter('volume')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              badgeFilter === 'volume' ? 'bg-emerald-500 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Carga Levantada (kg)
          </button>
          <button
            onClick={() => setBadgeFilter('records')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              badgeFilter === 'records' ? 'bg-emerald-500 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Recordes (PRs)
          </button>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredBadges.map(badge => (
            <div
              key={badge.id}
              onClick={() => {
                if (badge.unlocked) {
                  setSelectedBadgeForModal(badge);
                } else if (unlockedBadges.length > 0) {
                  setSelectedBadgeForModal(unlockedBadges[0]);
                }
              }}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-[#161d26] to-[#0f141a] border-emerald-500/40 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer'
                  : 'bg-[#0f1217]/70 border-neutral-800/80 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <BadgeMedalIcon
                  tier={badge.tier}
                  iconName={badge.iconName}
                  unlocked={badge.unlocked}
                  size="md"
                  showTierBadge={badge.unlocked}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white truncate">{badge.title}</h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                    {badge.description}
                  </p>
                  
                  {badge.unlocked ? (
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Concretizada!
                      </span>
                      {badge.unlockedAt && (
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {new Date(badge.unlockedAt + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>{badge.currentValue.toLocaleString('pt-BR')} / {badge.targetValue.toLocaleString('pt-BR')} {badge.unit}</span>
                        <span className="text-emerald-400 font-bold">{badge.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${badge.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {badge.unlocked && (
                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium">Meta: {badge.targetValue.toLocaleString('pt-BR')} {badge.unit}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBadgeForModal(badge);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Share2 className="w-3 h-3" />
                    Compartilhar Foto
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Profile Form (Edit Mode or Read Mode) */}
      <div className="p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Dados Físicos & Treinamento</h2>
            <p className="text-xs text-neutral-400">Suas preferências guiam o gerador automático e estimativas calóricas</p>
          </div>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            {isEditingProfile ? 'Cancelar Edição' : 'Editar Dados'}
          </button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Avatar Selection */}
            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">Foto de Perfil / Avatar</label>
              <div className="flex items-center gap-3 mb-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === preset ? 'border-emerald-400 scale-105 shadow-md' : 'border-neutral-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="Ou cole a URL da imagem de avatar..."
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-neutral-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-neutral-300 block mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-neutral-300 block mb-1">Objetivo</label>
                <select
                  value={goal}
                  onChange={e => setGoal(e.target.value as FitnessGoal)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                >
                  <option value="Ganho de massa muscular">Ganho de massa muscular</option>
                  <option value="Emagrecimento">Emagrecimento</option>
                  <option value="Força">Força</option>
                  <option value="Condicionamento físico">Condicionamento físico</option>
                  <option value="Saúde e qualidade de vida">Saúde e qualidade de vida</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1">Nível de Treino</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value as ExerciseLevel)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1">Local de Treino</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value as TrainingLocation)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                >
                  <option value="Academia">Academia</option>
                  <option value="Casa">Casa</option>
                  <option value="Ao ar livre">Ao ar livre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-neutral-300 block mb-1">Idade</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-300 block mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-300 block mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-300">
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Local Principal</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">{currentUser.trainingLocation || 'Academia'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Nível de Experiência</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">{currentUser.experienceLevel}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Frequência Semanal</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">{currentUser.daysPerWeek || 4} dias por semana</span>
            </div>
          </div>
        )}
      </div>

      {/* PWA Install Action */}
      <PWAInstallButton variant="card" />

      {/* Preferences & App Settings */}
      <div className="p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-5 text-xs">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          {t.preferencesTitle}
        </h2>

        {/* Global Language Selector */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <LanguageSelector variant="profile" />
        </div>

        <div className="space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-neutral-500" />}
              <div>
                <div className="font-bold text-white text-sm">{t.soundEffects}</div>
                <div className="text-neutral-400 text-[11px]">{t.soundEffectsDesc}</div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePreference('soundEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${soundEnabled ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-sm">{t.vibration}</div>
                <div className="text-neutral-400 text-[11px]">{t.vibrationDesc}</div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePreference('vibrationEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative ${vibrationEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${vibrationEnabled ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-sm">{t.autoRestTimer}</div>
                <div className="text-neutral-400 text-[11px]">{t.autoRestTimerDesc}</div>
              </div>
            </div>
            <button
              onClick={() => handleTogglePreference('autoRestTimer')}
              className={`w-12 h-6 rounded-full transition-colors relative ${autoRestTimer ? 'bg-emerald-500' : 'bg-neutral-800'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${autoRestTimer ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Daily Workout Reminders row */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-sm">Lembretes Diários de Treino</div>
                <div className="text-neutral-400 text-[11px]">
                  Horário: {db.getSettings().notifications?.reminderTime || '18:30'} • Notificações no navegador
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReminderModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
            >
              Configurar
            </button>
          </div>
        </div>

        {/* Account Switching & Log out */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={onOpenAuth}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            Trocar de Conta / Entrar como Outro Usuário
          </button>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da Sessão
          </button>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="p-6 rounded-3xl bg-red-950/20 border border-red-900/40 space-y-4 text-xs">
        <div className="flex items-center gap-2.5 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">Gerenciar ou Excluir Conta</h2>
        </div>
        <p className="text-neutral-300 leading-relaxed">
          Se você desejar excluir sua conta, todos os treinos personalizados, históricos e recordes pessoais vinculados a este perfil serão permanentemente removidos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-emerald-400" />
            Editar Dados da Conta
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center gap-2 transition-colors"
            title="Reiniciar aplicação do zero para responder o chat de perguntas e respostas"
          >
            <RotateCcw className="w-4 h-4" />
            Zerar e Refazer Onboarding
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setShowDeleteAccountModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Minha Conta
          </button>
        </div>
      </div>

      {/* Reset To Zero Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#13171f] border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Zerar e Reiniciar</h3>
                  <p className="text-xs text-amber-400 font-semibold">Iniciar com perfil limpo através do chat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              O aplicativo retornará ao estado zerado e você será guiado novamente pelo chat inteligente de perguntas e respostas para criar seu perfil e rotina sob medida.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  db.resetToZero();
                  window.location.reload();
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                Sim, Zerar e Iniciar Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#13171f] border border-red-900/60 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Excluir Conta Definitivamente</h3>
                  <p className="text-xs text-red-400 font-semibold">Esta ação é permanente e irreversível</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Você está prestes a excluir a conta de <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}). Todos os treinos criados, históricos e dados salvos serão apagados.
            </p>

            <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <label className="text-xs text-neutral-300 font-bold block">
                Para confirmar, digite <span className="text-red-400 font-mono">EXCLUIR</span> abaixo:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Digite EXCLUIR"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR' || isDeletingAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white text-xs font-black flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingAccount ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement & Badge Share Modal */}
      {selectedBadgeForModal && (
        <AchievementShareModal
          badge={selectedBadgeForModal}
          allUnlockedBadges={unlockedBadges}
          allLockedBadges={lockedBadges}
          user={currentUser}
          onClose={() => setSelectedBadgeForModal(null)}
          onSelectBadge={(b) => setSelectedBadgeForModal(b)}
        />
      )}

      {/* Daily Workout Reminders Modal */}
      <DailyReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onUpdated={() => {
          setCurrentUser(db.getCurrentUser());
        }}
      />
    </div>
  );
}
