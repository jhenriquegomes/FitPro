import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkDailyWorkoutReminder,
  getTodayWorkoutInfo,
  playNotificationSound
} from '../services/notificationService';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Play, 
  Calendar,
  ShieldCheck,
  Dumbbell
} from 'lucide-react';

interface DailyReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const PRESET_TIMES = ['06:30', '07:30', '12:00', '18:00', '19:30', '21:00'];

export function DailyReminderModal({ isOpen, onClose, onUpdated }: DailyReminderModalProps) {
  const [settings, setSettings] = useState(() => db.getSettings());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(db.getSettings());
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const notifSettings = settings.notifications;
  const isEnabled = notifSettings?.workoutReminders ?? true;
  const scheduledTime = notifSettings?.reminderTime || '18:30';
  const soundEnabled = notifSettings?.soundEffects ?? true;
  const todayInfo = getTodayWorkoutInfo();

  const handleToggleReminders = (enabled: boolean) => {
    const updated = {
      ...notifSettings,
      workoutReminders: enabled
    };
    db.updateSettings({ notifications: updated });
    setSettings(db.getSettings());
    if (onUpdated) onUpdated();

    // If enabling and permission is default, ask for permission
    if (enabled && permission === 'default') {
      handleRequestPermission();
    }
  };

  const handleTimeChange = (time: string) => {
    const updated = {
      ...notifSettings,
      reminderTime: time
    };
    db.updateSettings({ notifications: updated });
    setSettings(db.getSettings());
    if (onUpdated) onUpdated();
  };

  const handleToggleSound = (enabled: boolean) => {
    const updated = {
      ...notifSettings,
      soundEffects: enabled
    };
    db.updateSettings({ notifications: updated });
    setSettings(db.getSettings());
    if (enabled) {
      playNotificationSound();
    }
    if (onUpdated) onUpdated();
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setTestStatus(null);

    // If permission not granted yet, ask first
    if (permission !== 'granted') {
      const p = await requestNotificationPermission();
      setPermission(p);
      if (p !== 'granted') {
        setIsTesting(false);
        setTestStatus('Permissão negada. Ative as notificações no navegador.');
        return;
      }
    }

    try {
      const result = await checkDailyWorkoutReminder(true);
      if (result.triggered) {
        setTestStatus('✅ Notificação de teste enviada com sucesso! Verifique a tela do seu dispositivo.');
      } else {
        setTestStatus(`Aviso: ${result.reason}`);
      }
    } catch {
      setTestStatus('Falha ao disparar notificação.');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e1319] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Lembretes Diários de Treino
              </h2>
              <p className="text-xs text-neutral-400">
                Notificações no navegador no horário agendado do seu treino
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* Permission Status Box */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            permission === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : permission === 'denied'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              : 'bg-blue-950/20 border-blue-500/30 text-blue-300'
          }`}>
            {permission === 'granted' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : permission === 'denied' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {permission === 'granted' 
                    ? 'Notificações Ativas e Permitidas' 
                    : permission === 'denied' 
                    ? 'Notificações Bloqueadas no Navegador' 
                    : 'Permissão de Notificação Pendente'}
                </span>
                {permission === 'granted' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400">
                    Pronto
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {permission === 'granted'
                  ? 'O navegador está autorizado a emitir alertas na hora marcada para seu treino diário.'
                  : permission === 'denied'
                  ? 'Você bloqueou as notificações. Para receber os lembretes, clique no ícone de ajustes/cadeado na barra de endereços do navegador e permita Notificações.'
                  : 'Autorize o navegador para que o FitPro possa alertá-lo no horário do seu treino.'}
              </p>

              {permission === 'default' && (
                <button
                  onClick={handleRequestPermission}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-black font-bold text-xs transition-colors cursor-pointer"
                >
                  Permitir Notificações Agora
                </button>
              )}
            </div>
          </div>

          {/* Toggle Reminders On/Off */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div>
              <span className="text-sm font-bold text-white block">Ativar Lembretes Diários</span>
              <span className="text-xs text-neutral-400">Receba um alerta diário com a ficha do seu treino</span>
            </div>

            <button
              onClick={() => handleToggleReminders(!isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Time Selector */}
          <div className={`p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3 transition-opacity ${
            isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Horário Agendado do Treino
              </span>

              {/* Manual Time Input */}
              <input
                type="time"
                value={scheduledTime}
                onChange={e => handleTimeChange(e.target.value)}
                className="bg-neutral-950 border border-neutral-700 text-emerald-400 font-mono font-bold text-sm px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1.5">Horários sugeridos:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PRESET_TIMES.map(t => (
                  <button
                    key={t}
                    onClick={() => handleTimeChange(t)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      scheduledTime === t
                        ? 'bg-emerald-500 text-black font-bold shadow-md'
                        : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              <div>
                <span className="text-xs font-bold text-neutral-200 block">Sinal Sonoro de Alerta</span>
                <span className="text-[11px] text-neutral-400">Tocar um sinal suave ao emitir o lembrete</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {soundEnabled ? 'Ativado' : 'Silencioso'}
            </button>
          </div>

          {/* Today's Workout Preview in Notification */}
          <div className="p-3.5 rounded-xl bg-[#090d12] border border-neutral-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Prévia do Lembrete de Hoje ({todayInfo.dayOfWeek})
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {scheduledTime}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                {todayInfo.isRest ? (
                  <>🧘 Dia de Descanso e Recuperação</>
                ) : todayInfo.workout ? (
                  <>🏋️‍♂️ Hora do Treino: {todayInfo.workout.title}</>
                ) : (
                  <>💪 Hora do Treino FitPro!</>
                )}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                {todayInfo.isRest
                  ? 'Hoje é seu dia de descanso programado. Hidrate-se e recupere as energias!'
                  : todayInfo.workout
                  ? `Seu treino tem ${todayInfo.workout.exercises.length} exercícios planejados. Vamos com tudo!`
                  : `São ${scheduledTime}! Hora de se exercitar e manter a constância!`}
              </p>
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus && (
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 text-center animate-in fade-in">
              {testStatus}
            </div>
          )}

          {/* Test Notification Button */}
          <button
            onClick={handleTestNotification}
            disabled={isTesting}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 border border-neutral-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Testar Notificação Agora</span>
          </button>

        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer"
          >
            Salvar e Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
