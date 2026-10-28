import { useRef, useEffect, useState } from 'react';
import { UserBadge, User } from '../types';
import { BadgeMedalIcon } from './BadgeMedalIcon';
import confetti from 'canvas-confetti';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  MessageCircle, 
  Instagram, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame,
  Award,
  Calendar
} from 'lucide-react';

interface AchievementShareModalProps {
  badge: UserBadge;
  allUnlockedBadges: UserBadge[];
  allLockedBadges?: UserBadge[];
  user: User;
  onClose: () => void;
  onSelectBadge?: (badge: UserBadge) => void;
}

export function AchievementShareModal({
  badge: initialBadge,
  allUnlockedBadges,
  allLockedBadges = [],
  user,
  onClose,
  onSelectBadge
}: AchievementShareModalProps) {
  const [currentBadge, setCurrentBadge] = useState<UserBadge>(initialBadge);
  const [viewTab, setViewTab] = useState<'photo' | 'history'>('photo');
  const [historyTab, setHistoryTab] = useState<'unlocked' | 'in_progress'>('unlocked');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#ffffff', '#38bdf8']
      });
    } catch {
      // ignore
    }
  }, [currentBadge.id]);

  // Generate high-resolution achievement photo on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // Dark sleek athletic background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0c0f14');
    bgGradient.addColorStop(0.5, '#121721');
    bgGradient.addColorStop(1, '#080a0d');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Dynamic glow matching tier
    const tierColors: Record<string, string> = {
      bronze: 'rgba(217, 119, 6, 0.22)',
      silver: 'rgba(148, 163, 184, 0.25)',
      gold: 'rgba(245, 158, 11, 0.30)',
      platinum: 'rgba(16, 185, 129, 0.28)'
    };
    const glowColor = tierColors[currentBadge.tier] || 'rgba(16, 185, 129, 0.25)';

    const radialGlow = ctx.createRadialGradient(width / 2, 380, 20, width / 2, 380, 420);
    radialGlow.addColorStop(0, glowColor);
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Outer double border
    ctx.strokeStyle = '#222c38';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.strokeStyle = currentBadge.tier === 'gold' ? '#fbbf24' : currentBadge.tier === 'platinum' ? '#34d399' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // FITPRO Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FITPRO', width / 2, 85);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SISTEMA OFICIAL DE CONQUISTAS', width / 2, 110);

    // Athlete Banner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(80, 140, width - 160, 56, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Atleta: ${user.name}`, width / 2, 175);

    // Big Circular Medal Graphic on Canvas
    const medalCenterX = width / 2;
    const medalCenterY = 360;
    const medalRadius = 110;

    // Outer ring
    const medalGrad = ctx.createLinearGradient(
      medalCenterX - medalRadius, 
      medalCenterY - medalRadius, 
      medalCenterX + medalRadius, 
      medalCenterY + medalRadius
    );
    if (currentBadge.tier === 'gold') {
      medalGrad.addColorStop(0, '#fef08a');
      medalGrad.addColorStop(0.5, '#eab308');
      medalGrad.addColorStop(1, '#713f12');
    } else if (currentBadge.tier === 'silver') {
      medalGrad.addColorStop(0, '#f8fafc');
      medalGrad.addColorStop(0.5, '#94a3b8');
      medalGrad.addColorStop(1, '#334155');
    } else if (currentBadge.tier === 'platinum') {
      medalGrad.addColorStop(0, '#a7f3d0');
      medalGrad.addColorStop(0.5, '#10b981');
      medalGrad.addColorStop(1, '#064e3b');
    } else {
      // Bronze
      medalGrad.addColorStop(0, '#fed7aa');
      medalGrad.addColorStop(0.5, '#c2410c');
      medalGrad.addColorStop(1, '#431407');
    }

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.arc(medalCenterX, medalCenterY, medalRadius, 0, Math.PI * 2);
    ctx.fillStyle = medalGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Inner ring
    ctx.beginPath();
    ctx.arc(medalCenterX, medalCenterY, medalRadius - 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = medalGrad;
    ctx.stroke();

    // Central Icon on Canvas (Trophy / Star / Medal)
    ctx.fillStyle = currentBadge.tier === 'gold' ? '#fde047' : currentBadge.tier === 'platinum' ? '#6ee7b7' : '#f1f5f9';
    ctx.font = '80px sans-serif';
    ctx.fillText('🏆', medalCenterX, medalCenterY + 28);

    // Tier Ribbon Label
    const tierLabels: Record<string, string> = {
      bronze: 'MEDALHA DE BRONZE',
      silver: 'MEDALHA DE PRATA',
      gold: 'MEDALHA DE OURO',
      platinum: 'MEDALHA DE PLATINA'
    };
    ctx.fillStyle = currentBadge.tier === 'gold' ? '#fde047' : currentBadge.tier === 'platinum' ? '#34d399' : '#e2e8f0';
    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(tierLabels[currentBadge.tier] || 'CONQUISTA OFICIAL', width / 2, 510);

    // "VOCÊ CONQUISTOU" Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CONQUISTA DESBLOQUEADA', width / 2, 550);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentBadge.title.toUpperCase(), width / 2, 600);

    // Description
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentBadge.description, width / 2, 645);

    // Metric Pill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.roundRect(140, 680, width - 280, 60, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    const formattedTarget = currentBadge.targetValue.toLocaleString('pt-BR');
    ctx.fillText(`Meta Concretizada: ${formattedTarget} ${currentBadge.unit}`, width / 2, 718);

    // Achievement Date
    const dateFormatted = currentBadge.unlockedAt 
      ? new Date(currentBadge.unlockedAt + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('pt-BR');

    ctx.fillStyle = '#64748b';
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Concretizada em ${dateFormatted}`, width / 2, 780);

    // User Stats Summary Footer Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.roundRect(60, 830, width - 120, 85, 18);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    const colWidth = (width - 120) / 3;
    // Col 1: Streak
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DIAS SEGUIDOS', 60 + colWidth * 0.5, 860);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`🔥 ${user.streakDays || 0} dias`, 60 + colWidth * 0.5, 890);

    // Col 2: Conquistas
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CONQUISTAS', 60 + colWidth * 1.5, 860);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`🏆 ${allUnlockedBadges.length} medalhas`, 60 + colWidth * 1.5, 890);

    // Col 3: Categoria
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OBJETIVO', 60 + colWidth * 2.5, 860);
    ctx.fillStyle = '#34d399';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(user.goal.substring(0, 16), 60 + colWidth * 2.5, 890);

    // Watermark
    ctx.fillStyle = '#475569';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Gerado via FitPro • Treino & Performance', width / 2, 955);

    setDownloadUrl(canvas.toDataURL('image/png'));
  }, [currentBadge, user, allUnlockedBadges]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.download = `fitpro-conquista-${currentBadge.id}-${Date.now()}.png`;
    link.href = downloadUrl;
    link.click();
    setShareStatus('Foto baixada com sucesso!');
    setTimeout(() => setShareStatus(null), 3000);
  };

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const shareText = `🏆 Conquistei a medalha "${currentBadge.title}" no FitPro! Meta superada: ${currentBadge.targetValue.toLocaleString('pt-BR')} ${currentBadge.unit}. #FitPro #Evolucao`;

    if (!navigator.share) {
      handleDownload();
      return;
    }

    try {
      canvas.toBlob(async blob => {
        if (!blob) {
          handleDownload();
          return;
        }

        try {
          if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'conquista.png', { type: 'image/png' })] })) {
            const file = new File([blob], `conquista-${currentBadge.id}.png`, { type: 'image/png' });
            await navigator.share({
              title: `Conquista FitPro: ${currentBadge.title}`,
              text: shareText,
              files: [file]
            });
            setShareStatus('Compartilhado com sucesso!');
          } else {
            await navigator.share({
              title: `Conquista FitPro: ${currentBadge.title}`,
              text: shareText,
              url: window.location.href
            });
            setShareStatus('Compartilhado com sucesso!');
          }
        } catch (err: unknown) {
          // If the user cancelled or aborted the native share sheet, ignore gracefully
          const error = err as { name?: string; message?: string };
          if (error?.name === 'AbortError' || error?.message?.includes('canceled') || error?.message?.includes('cancelled')) {
            return;
          }
          // Only fallback to downloading the image if sharing actually encountered an unexpected fault
          handleDownload();
        }
      }, 'image/png');
    } catch {
      handleDownload();
    }
    setTimeout(() => setShareStatus(null), 3500);
  };

  const handleShareWhatsApp = () => {
    const message = `🏆 *CONQUISTA DESBLOQUEADA NO FITPRO!*\n\n🥇 *${currentBadge.title}*\n_${currentBadge.description}_\n\n🎯 *Meta Superada:* ${currentBadge.targetValue.toLocaleString('pt-BR')} ${currentBadge.unit}\n📅 *Conquistada em:* ${currentBadge.unlockedAt || 'Hoje'}\n\n🔥 Minha sequência: ${user.streakDays || 0} dias de treino!\nBora treinar pesado! 💪`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    const text = `🏆 Conquistei a medalha "${currentBadge.title}" no FitPro! ${currentBadge.description} (Meta: ${currentBadge.targetValue.toLocaleString('pt-BR')} ${currentBadge.unit}).`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Ignore fallback error
      }
    }
  };

  const handleSelectDifferentBadge = (b: UserBadge) => {
    setCurrentBadge(b);
    if (onSelectBadge) onSelectBadge(b);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#11161d] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Central de Conquistas & Medalhas</h2>
              <p className="text-[11px] text-neutral-400">
                {allUnlockedBadges.length} de {allUnlockedBadges.length + allLockedBadges.length} Conquistas Concretizadas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Showcase Hero: "VOCÊ CONSEGUIU A CONQUISTA X" */}
          <div className="p-5 sm:p-6 rounded-3xl bg-radial from-[#1e261f] via-[#131922] to-[#0c0f13] border-2 border-emerald-500/50 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Medal Visual */}
              <div className="shrink-0">
                <BadgeMedalIcon
                  tier={currentBadge.tier}
                  iconName={currentBadge.iconName}
                  unlocked={currentBadge.unlocked}
                  size="xl"
                  showTierBadge={true}
                />
              </div>

              {/* Text Info */}
              <div className="flex-1 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>VOCÊ CONSEGUIU ESTA CONQUISTA!</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentBadge.title}
                </h1>

                <p className="text-sm text-neutral-300">
                  {currentBadge.description}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-neutral-400">
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Meta: {currentBadge.targetValue.toLocaleString('pt-BR')} {currentBadge.unit}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {currentBadge.unlockedAt 
                      ? `Concretizada em ${new Date(currentBadge.unlockedAt + 'T12:00:00').toLocaleDateString('pt-BR')}`
                      : 'Concretizada recentemente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Card Preview & Sharing Options */}
            <div className="relative z-10 mt-5 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Compartilhe a foto oficial desta medalha com seus amigos e nas redes!
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-download-badge-photo"
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>BAIXAR FOTO</span>
                </button>

                <button
                  id="btn-native-share-badge"
                  onClick={handleNativeShare}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Compartilhar foto no Instagram ou redes"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>COMPARTILHAR</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/30 transition-colors"
                  title="Compartilhar no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCopyText}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                  title="Copiar texto da conquista"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hidden Canvas for High-Resolution Photo Generation */}
            <div className="mt-4 flex justify-center">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[280px] rounded-2xl border border-neutral-800 shadow-2xl"
                style={{ aspectRatio: '800/1000' }}
              />
            </div>

            {shareStatus && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
                {shareStatus}
              </div>
            )}
          </div>

          {/* HISTÓRICO: TODAS AS CONQUISTAS JÁ CONCRETIZADAS (ABAIXO) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Histórico de Conquistas Concretizadas
                </h3>
                <p className="text-xs text-neutral-400">
                  Todas as medalhas que você já conquistou na sua jornada FitPro
                </p>
              </div>

              {/* Toggle to see Unlocked vs Upcoming */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto text-xs">
                <button
                  onClick={() => setHistoryTab('unlocked')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    historyTab === 'unlocked' ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Concretizadas ({allUnlockedBadges.length})
                </button>
                <button
                  onClick={() => setHistoryTab('in_progress')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    historyTab === 'in_progress' ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Próximas Metas ({allLockedBadges.length})
                </button>
              </div>
            </div>

            {/* UNLOCKED BADGES LIST */}
            {historyTab === 'unlocked' ? (
              allUnlockedBadges.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-xs">
                  Você ainda não possui conquistas concretizadas. Conclua seu próximo treino para desbloquear sua primeira medalha!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allUnlockedBadges.map(b => {
                    const isCurrent = b.id === currentBadge.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => handleSelectDifferentBadge(b)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent 
                            ? 'bg-[#15201a] border-emerald-500 shadow-md shadow-emerald-500/10' 
                            : 'bg-[#12161c] border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BadgeMedalIcon
                            tier={b.tier}
                            iconName={b.iconName}
                            unlocked={true}
                            size="sm"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">{b.title}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-black font-black uppercase">
                                  Exibindo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">{b.description}</p>
                            <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                              {b.unlockedAt ? `Conquistada em ${new Date(b.unlockedAt + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Concretizada'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDifferentBadge(b);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-500 hover:text-black text-neutral-300 text-[10px] font-bold shrink-0 transition-colors"
                        >
                          Ver Foto
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* IN PROGRESS / LOCKED BADGES LIST */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allLockedBadges.map(b => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-[#10141a] border border-neutral-800/80 flex flex-col justify-between gap-2.5 opacity-85"
                  >
                    <div className="flex items-center gap-3">
                      <BadgeMedalIcon
                        tier={b.tier}
                        iconName={b.iconName}
                        unlocked={false}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-200">{b.title}</div>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">{b.description}</p>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Meta: {b.targetValue.toLocaleString('pt-BR')} {b.unit}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>{b.currentValue.toLocaleString('pt-BR')} / {b.targetValue.toLocaleString('pt-BR')}</span>
                        <span className="text-emerald-400 font-bold">{b.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${b.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-black/40 text-xs">
          <span className="text-neutral-400">
            Conquistas e medalhas são atualizadas automaticamente ao registrar novos treinos e cargas.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
