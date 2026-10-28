import { useRef, useEffect, useState } from 'react';
import { WorkoutHistoryItem, Workout, User } from '../types';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  MessageCircle, 
  Instagram, 
  Facebook,
  Camera,
  FileText,
  Sparkles
} from 'lucide-react';

interface SocialShareModalProps {
  historyItem?: WorkoutHistoryItem;
  workout?: Workout;
  user: User;
  onClose: () => void;
  initialFormat?: 'photo' | 'text';
}

export function SocialShareModal({ 
  historyItem, 
  workout, 
  user, 
  onClose,
  initialFormat = 'photo'
}: SocialShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shareFormat, setShareFormat] = useState<'photo' | 'text'>(initialFormat);
  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const workoutTitle = historyItem?.workoutTitle || workout?.title || 'Treino FitPro';
  const formatMin = historyItem 
    ? Math.round(historyItem.durationSeconds / 60) 
    : (workout?.estimatedDurationMin || 45);

  const dateStr = historyItem 
    ? historyItem.date 
    : new Date().toISOString().split('T')[0];

  // Generate canvas visual photographic card
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI 800x1000 (standard high quality portrait)
    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // Dark athletic gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0c0f13');
    bgGradient.addColorStop(0.5, '#12171f');
    bgGradient.addColorStop(1, '#080a0c');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle athletic emerald radial glow
    const glow = ctx.createRadialGradient(width * 0.8, 150, 10, width * 0.8, 150, 380);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#1e2630';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Brand Header: FITPRO
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FITPRO', 60, 95);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('SEU TREINO, SEU RITMO', 60, 125);

    // User section
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Atleta: ${user.name}`, 60, 190);

    ctx.fillStyle = '#64748b';
    ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
    const dateFormatted = historyItem
      ? `${new Date(historyItem.date + 'T12:00:00').toLocaleDateString('pt-BR')} • ${historyItem.startTime}`
      : `Plano de Treino • ${workout?.category || 'Hipertrofia'}`;
    ctx.fillText(dateFormatted, 60, 220);

    // Divider
    ctx.strokeStyle = '#27313f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 260);
    ctx.lineTo(width - 60, 260);
    ctx.stroke();

    // Celebration or Sheet Header
    ctx.fillStyle = '#10b981';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(historyItem ? '🔥 TREINO CONCLUÍDO' : '📋 FICHA DE TREINO', 60, 310);

    // Workout Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px "Plus Jakarta Sans", sans-serif';
    const title = workoutTitle.length > 26 
      ? workoutTitle.substring(0, 26) + '...' 
      : workoutTitle;
    ctx.fillText(title, 60, 375);

    // Draw Metric helper
    const drawMetric = (x: number, y: number, w: number, h: number, icon: string, value: string, label: string) => {
      ctx.fillStyle = '#141a22';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.strokeStyle = '#222b38';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px "JetBrains Mono", monospace';
      ctx.fillText(value, x + 24, y + 52);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(label.toUpperCase(), x + 24, y + 82);
    };

    if (historyItem) {
      // Completed workout metrics
      drawMetric(60, 420, 320, 105, '⏱', `${formatMin} min`, 'Tempo Total');
      drawMetric(420, 420, 320, 105, '🏋️', `${historyItem.totalSets}`, 'Séries Feitas');
      drawMetric(60, 545, 320, 105, '🔁', `${historyItem.totalReps}`, 'Repetições');
      drawMetric(420, 545, 320, 105, '⚡', `${historyItem.totalVolumeKg} kg`, 'Volume Total');

      // Extra highlight (Calories & PRs)
      ctx.fillStyle = '#111720';
      ctx.beginPath();
      ctx.roundRect(60, 680, width - 120, 100, 16);
      ctx.fill();
      ctx.strokeStyle = '#10b98140';
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('ESTIMATIVA CALÓRICA & PERFORMANCE', 84, 715);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`🔥 ~${historyItem.estimatedCalories} kcal queimadas`, 84, 750);

      if (historyItem.newPrs && historyItem.newPrs.length > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`🏆 Novo Recorde: ${historyItem.newPrs[0].exerciseName} (${historyItem.newPrs[0].loadKg}kg)`, 360, 750);
      }
    } else if (workout) {
      // Workout template card metrics
      drawMetric(60, 420, 320, 105, '🏋️', `${workout.exercises.length}`, 'Exercícios');
      drawMetric(420, 420, 320, 105, '⏱', `~${workout.estimatedDurationMin} min`, 'Tempo Médio');

      // List of planned exercises
      ctx.fillStyle = '#111720';
      ctx.beginPath();
      ctx.roundRect(60, 545, width - 120, 240, 16);
      ctx.fill();
      ctx.strokeStyle = '#222b38';
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LISTA DE EXERCÍCIOS PLANEJADOS:', 84, 580);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
      const maxEx = Math.min(workout.exercises.length, 5);
      for (let i = 0; i < maxEx; i++) {
        const ex = workout.exercises[i];
        ctx.fillText(`• ${ex.exerciseName} — ${ex.sets}x${ex.reps}`, 84, 620 + i * 32);
      }
      if (workout.exercises.length > 5) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`+ mais ${workout.exercises.length - 5} exercícios...`, 84, 780);
      }
    }

    // Footer Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Feito com FitPro App • fitpro.app', 60, 930);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('#FitPro #SeuTreinoSeuRitmo', width - 320, 930);

    setDownloadUrl(canvas.toDataURL('image/png'));
  }, [historyItem, workout, user, workoutTitle, formatMin]);

  // Formatted Written Text
  const summaryText = historyItem
    ? `🔥 TREINO CONCLUÍDO NO FITPRO! 💪\n\n👤 Atleta: ${user.name}\n🏋️ Treino: ${historyItem.workoutTitle}\n📅 Data: ${new Date(historyItem.date + 'T12:00:00').toLocaleDateString('pt-BR')}\n⏱ Duração: ${formatMin} minutos\n📊 Séries Realizadas: ${historyItem.totalSets}\n🔁 Repetições: ${historyItem.totalReps}\n⚡ Volume de Carga: ${historyItem.totalVolumeKg} kg\n🔥 Estimativa Calórica: ~${historyItem.estimatedCalories} kcal\n${historyItem.newPrs && historyItem.newPrs.length > 0 ? `🏆 Recorde Superado: ${historyItem.newPrs[0].exerciseName} (${historyItem.newPrs[0].loadKg}kg)\n` : ''}\n📋 Exercícios:\n${historyItem.exercisesLog.map(e => `• ${e.exerciseName}: ${e.sets.filter(s => s.completed).length} séries`).join('\n')}\n\nTreine no seu ritmo com FitPro! #FitPro`
    : `🏋️ FICHA DE TREINO FITPRO 💪\n\n👤 Aluno: ${user.name}\n🎯 Treino: ${workout?.title}\n🏷 Categoria: ${workout?.category || 'Hipertrofia'}\n⏱ Duração Estimada: ~${workout?.estimatedDurationMin || 45} min\n${workout?.description ? `📝 Descrição: ${workout.description}\n` : ''}\n📋 Lista de Exercícios (${workout?.exercises.length || 0}):\n${workout?.exercises.map((e, idx) => `${idx + 1}. ${e.exerciseName} - ${e.sets} séries x ${e.reps} reps${e.notes ? ` (${e.notes})` : ''}`).join('\n')}\n\nBons treinos com FitPro! #FitPro`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setShareStatus('Texto copiado para a área de transferência!');
    setTimeout(() => {
      setCopied(false);
      setShareStatus(null);
    }, 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  const handleSharePhotoNative = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share && navigator.canShare) {
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `fitpro-treino-${dateStr}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Treino FitPro - ${workoutTitle}`,
              text: 'Confira meu treino no FitPro!'
            });
            setShareStatus('Fotografia compartilhada com sucesso!');
            setTimeout(() => setShareStatus(null), 3000);
          } else {
            // Trigger image download
            triggerDownload();
          }
        }, 'image/png');
        return;
      } catch {
        triggerDownload();
      }
    } else {
      triggerDownload();
    }
  };

  const triggerDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `fitpro-treino-${dateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShareStatus('Fotografia baixada com sucesso!');
    setTimeout(() => setShareStatus(null), 3000);
  };

  const handleShareTextNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Treino FitPro - ${workoutTitle}`,
          text: summaryText
        });
      } catch {
        // user canceled share
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="social-share-modal"
        className="relative w-full max-w-xl my-6 bg-[#12161d] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar Treino
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {workoutTitle}
          </h2>
          <p className="text-xs text-neutral-400">
            Escolha como prefere compartilhar o treino com seus contatos ou redes sociais
          </p>
        </div>

        {/* Format Selector: Fotografia vs Escrito */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
          <button
            id="btn-format-photo"
            type="button"
            onClick={() => setShareFormat('photo')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
              shareFormat === 'photo'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Como Fotografia</span>
          </button>

          <button
            id="btn-format-text"
            type="button"
            onClick={() => setShareFormat('text')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
              shareFormat === 'text'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>Como Escrito (Texto)</span>
          </button>
        </div>

        {/* Status Toast Notice */}
        {shareStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{shareStatus}</span>
          </div>
        )}

        {/* MODE 1: COMO FOTOGRAFIA */}
        {shareFormat === 'photo' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Generated Canvas Photographic Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 shadow-xl max-h-72 sm:max-h-80 flex items-center justify-center bg-black/60">
              <canvas ref={canvasRef} className="w-full h-auto max-h-72 sm:max-h-80 object-contain" />
            </div>

            {/* Quick Photographic Social Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold transition-colors"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={triggerDownload}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 text-xs font-semibold transition-colors"
                title="Baixar foto para Instagram Story"
              >
                <Instagram className="w-5 h-5 text-purple-400" />
                <span>Story Instagram</span>
              </button>

              <button
                type="button"
                onClick={handleFacebookShare}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 text-xs font-semibold transition-colors"
                title="Compartilhar no Facebook"
              >
                <Facebook className="w-5 h-5 text-blue-400" />
                <span>Facebook</span>
              </button>
            </div>

            {/* Main Primary Photo Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={triggerDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                BAIXAR FOTOGRAFIA
              </button>

              <button
                type="button"
                onClick={handleSharePhotoNative}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs sm:text-sm transition-colors border border-neutral-700"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar Foto
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: COMO ESCRITO */}
        {shareFormat === 'text' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Written Text Card Preview */}
            <div className="relative rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 max-h-72 overflow-y-auto font-sans text-xs text-neutral-300 space-y-2 leading-relaxed">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px] text-neutral-400">
                <span className="font-bold text-emerald-400 uppercase">Texto Formatado Pronto para Envio</span>
                <span>{summaryText.length} caracteres</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-neutral-200">
                {summaryText}
              </pre>
            </div>

            {/* Written Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors border border-neutral-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-800/80 text-emerald-300 font-bold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareTextNative}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              COMPARTILHAR TEXTO ESCRITO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
