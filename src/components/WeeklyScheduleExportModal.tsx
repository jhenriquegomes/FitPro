import { useRef, useEffect, useState } from 'react';
import { WeeklyScheduleDay, Workout, User } from '../types';
import { db } from '../services/db';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  Camera, 
  FileText, 
  MessageCircle, 
  Copy, 
  Check, 
  Sparkles,
  Info,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';

interface WeeklyScheduleExportModalProps {
  schedule: WeeklyScheduleDay[];
  user: User;
  onClose: () => void;
}

// Universal Canvas rounded rect helper compatible with all browsers
function drawRoundRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function WeeklyScheduleExportModal({ schedule, user, onClose }: WeeklyScheduleExportModalProps) {
  const [activeTab, setActiveTab] = useState<'photo' | 'pdf' | 'text'>('photo');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isRenderingPhoto, setIsRenderingPhoto] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const workouts = db.getWorkouts();

  // Helper to get workout details for a day
  const getDayWorkout = (day: WeeklyScheduleDay): Workout | undefined => {
    if (day.isRest || !day.workoutId) return undefined;
    return workouts.find(w => w.id === day.workoutId);
  };

  // Generate Photo Canvas for Weekly Routine
  useEffect(() => {
    let isCancelled = false;

    const renderPhoto = async () => {
      setIsRenderingPhoto(true);
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore font loading errors
        }
      }

      if (isCancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        setIsRenderingPhoto(false);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsRenderingPhoto(false);
        return;
      }

      try {
        // High resolution 900 x 1350 graphic
        const width = 900;
        const height = 1350;
        canvas.width = width;
        canvas.height = height;

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#090d12');
        bgGrad.addColorStop(0.3, '#0f1722');
        bgGrad.addColorStop(0.7, '#0b1017');
        bgGrad.addColorStop(1, '#05070a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Radial green sports glow top right
        const radial = ctx.createRadialGradient(width - 120, 160, 20, width - 120, 160, 480);
        radial.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);

        // Frame Border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.strokeRect(24, 24, width - 48, height - 48);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(32, 32, width - 64, height - 64);

        // Brand Header
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('FITPRO', 60, 84);

        ctx.fillStyle = '#10b981';
        ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('PLANEJAMENTO SEMANAL DE TREINO', 60, 108);

        // Athlete Card on right
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 17px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(`Atleta: ${user.name}`, width - 60, 84);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(`${user.goal} • ${user.daysPerWeek} dias/semana`, width - 60, 108);

        // Divider line
        ctx.strokeStyle = '#243242';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(60, 134);
        ctx.lineTo(width - 60, 134);
        ctx.stroke();

        // Render 7 Day Cards
        const startY = 155;
        const cardHeight = 145;
        const cardGap = 16;

        schedule.forEach((day, idx) => {
          const y = startY + idx * (cardHeight + cardGap);
          const workout = getDayWorkout(day);
          const isRest = day.isRest || !workout;

          // Card Background
          ctx.fillStyle = isRest ? 'rgba(18, 24, 34, 0.85)' : 'rgba(20, 28, 40, 0.95)';
          drawRoundRect(ctx, 60, y, width - 120, cardHeight, 18);
          ctx.fill();

          // Card border
          ctx.strokeStyle = isRest ? '#223042' : 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = isRest ? 1.5 : 2;
          drawRoundRect(ctx, 60, y, width - 120, cardHeight, 18);
          ctx.stroke();

          // Left Day Badge Box
          ctx.fillStyle = isRest ? '#273549' : '#10b981';
          drawRoundRect(ctx, 78, y + 22, 110, 100, 14);
          ctx.fill();

          // Day Abbreviation
          ctx.fillStyle = isRest ? '#cbd5e1' : '#000000';
          ctx.font = '900 16px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(day.dayOfWeek.substring(0, 3), 78 + 55, y + 62);

          ctx.font = '800 11px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(isRest ? 'DESCANSO' : 'TREINO', 78 + 55, y + 84);

          // Content inside card
          ctx.textAlign = 'left';
          if (isRest) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 19px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText('Recuperação & Descanso Muscular', 215, y + 56);

            ctx.fillStyle = '#64748b';
            ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText('Sono reparador, hidratação e reconstrução das fibras musculares.', 215, y + 86);
          } else if (workout) {
            // Workout Title
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 20px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText(workout.title, 215, y + 46);

            // Exercises summary
            const exListStr = (workout.exercises || [])
              .slice(0, 4)
              .map(e => e.exerciseName || 'Exercício')
              .join(' • ');

            ctx.fillStyle = '#34d399';
            ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
            const suffix = workout.exercises.length > 4 ? ` (+${workout.exercises.length - 4} mais)` : '';
            ctx.fillText(`${workout.exercises.length} Exercícios: ${exListStr}${suffix}`, 215, y + 76);

            // Stats row
            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText(`⏱️ ~${workout.estimatedDurationMin} min  •  Categoria: ${workout.category || 'Hipertrofia'}`, 215, y + 104);
          }
        });

        // Watermark Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('Gerado pelo FitPro • Seu assistente inteligente de musculação e performance', width / 2, height - 46);

        const dataUrl = canvas.toDataURL('image/png');
        setDownloadUrl(dataUrl);
      } catch (err) {
        console.error('Erro ao renderizar foto do treino:', err);
      } finally {
        setIsRenderingPhoto(false);
      }
    };

    renderPhoto();

    return () => {
      isCancelled = true;
    };
  }, [schedule, user]);

  const handleDownloadPhoto = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.download = `fitpro-planejamento-semanal-${Date.now()}.png`;
    link.href = downloadUrl;
    link.click();
    setShareStatus('Foto do treino semanal baixada com sucesso!');
    setTimeout(() => setShareStatus(null), 3000);
  };

  const handleSharePhoto = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      handleDownloadPhoto();
      return;
    }

    try {
      canvas.toBlob(async blob => {
        if (!blob) {
          handleDownloadPhoto();
          return;
        }

        try {
          if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'treino-semana.png', { type: 'image/png' })] })) {
            const file = new File([blob], 'fitpro-treino-semana.png', { type: 'image/png' });
            await navigator.share({
              title: 'Meu Treino da Semana - FitPro',
              text: `Confira meu planejamento de treinos no FitPro! Foco: ${user.goal}`,
              files: [file]
            });
            setShareStatus('Compartilhado com sucesso!');
          } else if (navigator.share) {
            await navigator.share({
              title: 'Meu Treino da Semana - FitPro',
              text: generateWeeklyText(),
              url: window.location.href
            });
            setShareStatus('Compartilhado com sucesso!');
          } else {
            handleDownloadPhoto();
          }
        } catch (err: unknown) {
          const error = err as { name?: string; message?: string };
          if (error?.name === 'AbortError' || error?.message?.includes('canceled') || error?.message?.includes('cancelled')) {
            return;
          }
          handleDownloadPhoto();
        }
      }, 'image/png');
    } catch {
      handleDownloadPhoto();
    }
    setTimeout(() => setShareStatus(null), 3500);
  };

  // Standalone Printable HTML for 100% reliable PDF printing in all environments & iframes
  const generatePrintableHtml = (): string => {
    let rowsHtml = '';
    schedule.forEach(day => {
      const workout = getDayWorkout(day);
      if (day.isRest || !workout) {
        rowsHtml += `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #f8fafc; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              <div>
                <span style="background: #1e293b; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">${day.dayOfWeek}</span>
                <strong style="margin-left: 8px; font-size: 14px; color: #334155;">Descanso & Recuperação Muscular</strong>
              </div>
              <span style="font-size: 11px; color: #64748b;">Recuperação</span>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">
              Dia programado para descanso ativo, sono restaurador e reparação de tecidos musculares.
            </p>
          </div>
        `;
      } else {
        let exRows = '';
        (workout.exercises || []).forEach((ex, i) => {
          exRows += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 8px; font-weight: 600; color: #0f172a;">${i + 1}. ${ex.exerciseName || 'Exercício'}</td>
              <td style="padding: 6px 8px; text-align: center;">${ex.sets}</td>
              <td style="padding: 6px 8px; text-align: center;">${ex.reps}</td>
              <td style="padding: 6px 8px; text-align: center;">${ex.loadKg > 0 ? ex.loadKg + ' kg' : 'Livre'}</td>
              <td style="padding: 6px 8px; text-align: center;">${ex.restTimeSec}s</td>
            </tr>
          `;
        });

        rowsHtml += `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #ffffff; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
              <div>
                <span style="background: #059669; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">${day.dayOfWeek}</span>
                <strong style="margin-left: 8px; font-size: 15px; color: #0f172a;">${workout.title}</strong>
              </div>
              <span style="font-size: 12px; font-weight: 600; color: #475569;">
                ~${workout.estimatedDurationMin} min • ${workout.category || 'Geral'}
              </span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px;">
              <thead>
                <tr style="background: #f1f5f9; text-transform: uppercase; font-size: 10px; color: #475569;">
                  <th style="padding: 6px 8px; text-align: left;">Exercício</th>
                  <th style="padding: 6px 8px; text-align: center;">Séries</th>
                  <th style="padding: 6px 8px; text-align: center;">Reps</th>
                  <th style="padding: 6px 8px; text-align: center;">Carga</th>
                  <th style="padding: 6px 8px; text-align: center;">Descanso</th>
                </tr>
              </thead>
              <tbody>
                ${exRows}
              </tbody>
            </table>
          </div>
        `;
      }
    });

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>FitPro - Treino Semanal (${user.name})</title>
        <style>
          @page { size: A4; margin: 12mm 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
          }
          .brand-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
          }
          .meta-box {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .meta-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .meta-value {
            font-weight: 700;
            color: #0f172a;
          }
          .footer-signs {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            font-size: 11px;
            page-break-inside: avoid;
          }
          .sign-line {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
            color: #475569;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #065f46; font-size: 13px; font-weight: 600;">Documento pronto para impressão ou para Salvar como PDF.</span>
          <button onclick="window.print()" style="background: #059669; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="brand">FITPRO PERFORMANCE</div>
            <div class="brand-subtitle">FICHA OFICIAL DE PLANEJAMENTO SEMANAL</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div>Emissão: <strong>${new Date().toLocaleDateString('pt-BR')}</strong></div>
            <div>Status: <strong>Treino Ativo e Validado</strong></div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <div class="meta-label">Atleta</div>
            <div class="meta-value">${user.name}</div>
          </div>
          <div>
            <div class="meta-label">Objetivo Principal</div>
            <div class="meta-value">${user.goal}</div>
          </div>
          <div>
            <div class="meta-label">Frequência</div>
            <div class="meta-value">${user.daysPerWeek} dias / semana</div>
          </div>
          <div>
            <div class="meta-label">Nível / Local</div>
            <div class="meta-value">${user.experienceLevel} • ${user.trainingLocation}</div>
          </div>
        </div>

        ${rowsHtml}

        <div class="footer-signs">
          <div>
            <div style="height: 35px;"></div>
            <div class="sign-line">Assinatura do Atleta (${user.name})</div>
          </div>
          <div>
            <div style="height: 35px;"></div>
            <div class="sign-line">Acompanhamento Técnico • FitPro App</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleOpenPdfView = () => {
    const html = generatePrintableHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // If popup was blocked, fallback to standard window.print
      window.print();
    }
  };

  const handlePrintPdf = () => {
    // Try opening clean printable tab or fallback to in-page print
    try {
      const html = generatePrintableHtml();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
        return;
      }
    } catch {
      // Fallback
    }
    window.print();
  };

  const generateWeeklyText = (): string => {
    let text = `📋 *MEU PLANEJAMENTO DE TREINO DA SEMANA — FITPRO*\n`;
    text += `👤 *Atleta:* ${user.name}\n`;
    text += `🎯 *Objetivo:* ${user.goal}\n`;
    text += `🗓️ *Frequência:* ${user.daysPerWeek} dias por semana\n\n`;

    schedule.forEach(day => {
      const workout = getDayWorkout(day);
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📅 *${day.dayOfWeek}*:\n`;
      if (day.isRest || !workout) {
        text += `😴 *Descanso & Recuperação Muscular*\n`;
      } else {
        text += `🏋️‍♂️ *${workout.title}* (~${workout.estimatedDurationMin} min)\n`;
        workout.exercises.forEach((ex, i) => {
          text += `  ${i + 1}. ${ex.exerciseName || 'Exercício'} — ${ex.sets}x${ex.reps} (${ex.loadKg}kg) [Desc: ${ex.restTimeSec}s]\n`;
        });
      }
      text += `\n`;
    });

    text += `💪 Gerado pelo FitPro`;
    return text;
  };

  const handleCopyWeeklyText = async () => {
    const text = generateWeeklyText();
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateWeeklyText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#11161d] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header with Title and Mode Switcher */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                FitPro Export
              </span>
              <h2 className="text-lg font-black text-white">Treino da Semana em PDF & Foto</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Visualize, salve como PDF ou baixe a foto em alta definição
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab selector */}
            <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center text-xs font-bold">
              <button
                id="tab-export-photo"
                onClick={() => setActiveTab('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'photo' ? 'bg-emerald-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Em Foto</span>
              </button>

              <button
                id="tab-export-pdf"
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pdf' ? 'bg-emerald-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Em PDF</span>
              </button>

              <button
                id="tab-export-text"
                onClick={() => setActiveTab('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'text' ? 'bg-emerald-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Escrito</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar based on Mode */}
        <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-neutral-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {activeTab === 'photo' && 'Foto vertical em alta resolução com todos os 7 dias formatados'}
            {activeTab === 'pdf' && 'Ficha técnica A4 oficial com tabelas de exercícios e cargas'}
            {activeTab === 'text' && 'Texto estruturado pronto para copiar ou enviar no WhatsApp'}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'photo' && (
              <>
                <button
                  id="btn-download-weekly-photo"
                  onClick={handleDownloadPhoto}
                  disabled={!downloadUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>BAIXAR FOTO (PNG)</span>
                </button>
                <button
                  onClick={handleSharePhoto}
                  disabled={!downloadUrl}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>COMPARTILHAR</span>
                </button>
              </>
            )}

            {activeTab === 'pdf' && (
              <>
                <button
                  id="btn-open-pdf-window"
                  onClick={handleOpenPdfView}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5 transition-colors"
                  title="Abrir página completa formatada em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Abrir em Nova Aba</span>
                </button>
                <button
                  id="btn-print-pdf"
                  onClick={handlePrintPdf}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>IMPRIMIR / SALVAR PDF</span>
                </button>
              </>
            )}

            {activeTab === 'text' && (
              <>
                <button
                  onClick={handleCopyWeeklyText}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  <span>{copied ? 'COPIADO!' : 'COPIAR TEXTO'}</span>
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </>
            )}
          </div>
        </div>

        {shareStatus && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
            {shareStatus}
          </div>
        )}

        {/* TAB BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: EM FOTO (CANVAS & IMAGE PREVIEW) */}
          {activeTab === 'photo' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              {isRenderingPhoto && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 py-6">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <span>Gerando imagem em alta resolução...</span>
                </div>
              )}

              {/* Hidden Canvas used for high-dpi rendering */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {/* Image Preview */}
              {downloadUrl && downloadUrl.trim() !== '' ? (
                <div className="relative p-2.5 rounded-2xl bg-black/60 border border-neutral-800 shadow-2xl max-w-full overflow-hidden group">
                  <img
                    src={downloadUrl.trim()}
                    alt="Treino da Semana FitPro"
                    className="w-full max-w-[460px] rounded-xl shadow-2xl border border-neutral-800/80 object-contain mx-auto"
                  />
                  <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-400 px-1">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Pronta para salvar ou compartilhar
                    </span>
                    <button
                      onClick={handleDownloadPhoto}
                      className="text-emerald-400 font-bold hover:underline"
                    >
                      Toque para baixar (.png)
                    </button>
                  </div>
                </div>
              ) : !isRenderingPhoto && (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  Não foi possível renderizar a foto. Tente a aba "Em PDF" ou "Escrito".
                </div>
              )}

              <p className="text-xs text-neutral-400 text-center max-w-md">
                Esta imagem contém os 7 dias da sua rotina organizada com as cargas e categorias. Você pode salvar no seu celular ou enviar pelo WhatsApp.
              </p>
            </div>
          )}

          {/* TAB 2: EM PDF (PRINTABLE SHEET) */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>
                    Para salvar como arquivo PDF: clique em <strong>"IMPRIMIR / SALVAR PDF"</strong> e, no destino da impressora, selecione <strong>"Salvar como PDF"</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleOpenPdfView}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir em Tela Cheia
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
                  >
                    Salvar PDF
                  </button>
                </div>
              </div>

              {/* Printable PDF Sheet Component */}
              <div
                id="printable-weekly-pdf"
                className="p-6 sm:p-8 rounded-2xl bg-white text-black border border-neutral-300 shadow-xl space-y-6"
              >
                {/* Official PDF Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 text-white font-black flex items-center justify-center text-sm">
                        FP
                      </div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        FITPRO PERFORMANCE
                      </h1>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase mt-1">
                      Ficha Oficial de Planejamento Semanal
                    </p>
                  </div>

                  <div className="text-left sm:text-right text-xs text-slate-600">
                    <div>Data de Emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
                    <div>Status: <strong>Planejamento Ativo</strong></div>
                  </div>
                </div>

                {/* Athlete Details Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">Atleta</span>
                    <strong className="text-slate-900 text-sm">{user.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">Objetivo Principal</span>
                    <strong className="text-slate-900">{user.goal}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">Frequência</span>
                    <strong className="text-slate-900">{user.daysPerWeek} dias / semana</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">Nível / Local</span>
                    <strong className="text-slate-900">{user.experienceLevel} • {user.trainingLocation}</strong>
                  </div>
                </div>

                {/* Days Schedule */}
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Cronograma Completo de Segunda a Domingo
                  </h2>

                  <div className="space-y-3">
                    {schedule.map(day => {
                      const workout = getDayWorkout(day);
                      const isRest = day.isRest || !workout;

                      return (
                        <div
                          key={day.dayOfWeek}
                          className="p-4 rounded-xl border border-slate-300 bg-white"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded font-black text-xs text-white ${
                                isRest ? 'bg-slate-700' : 'bg-emerald-600'
                              }`}>
                                {day.dayOfWeek}
                              </span>
                              <strong className="text-sm text-slate-900">
                                {isRest ? 'Recuperação & Descanso Muscular' : workout.title}
                              </strong>
                            </div>

                            {!isRest && (
                              <span className="text-xs font-semibold text-slate-600">
                                ~{workout.estimatedDurationMin} min • {workout.category}
                              </span>
                            )}
                          </div>

                          {!isRest && workout ? (
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold bg-slate-50">
                                    <th className="py-1.5 px-2">Exercício</th>
                                    <th className="py-1.5 px-2 text-center">Séries</th>
                                    <th className="py-1.5 px-2 text-center">Repetições</th>
                                    <th className="py-1.5 px-2 text-center">Carga Alvo</th>
                                    <th className="py-1.5 px-2 text-center">Descanso</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {workout.exercises.map((ex, exIdx) => (
                                    <tr key={ex.id || exIdx} className="text-slate-800">
                                      <td className="py-2 px-2 font-bold">
                                        {exIdx + 1}. {ex.exerciseName || 'Exercício'}
                                      </td>
                                      <td className="py-2 px-2 text-center">{ex.sets} séries</td>
                                      <td className="py-2 px-2 text-center">{ex.reps} reps</td>
                                      <td className="py-2 px-2 text-center font-mono">
                                        {ex.loadKg > 0 ? `${ex.loadKg} kg` : 'Carga livre'}
                                      </td>
                                      <td className="py-2 px-2 text-center">{ex.restTimeSec} seg</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500 italic">
                              Dia programado para descanso ativo, sono restaurador e regeneração neuromuscular.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Signatures & Notes */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 pb-8 mb-1"></div>
                    <p className="font-bold text-slate-800">Assinatura do Atleta</p>
                    <p className="text-[11px] text-slate-500">{user.name}</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 pb-8 mb-1"></div>
                    <p className="font-bold text-slate-800">Acompanhamento FitPro</p>
                    <p className="text-[11px] text-slate-500">Planejamento gerado e validado pelo sistema</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EM TEXTO (WHATSAPP / MENSAGEM) */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#12161c] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300">
                    Pré-visualização do texto formatado para WhatsApp:
                  </span>
                  <button
                    onClick={handleCopyWeeklyText}
                    className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={generateWeeklyText()}
                  rows={14}
                  className="w-full p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>ENVIAR NO WHATSAPP</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-black/40 text-xs">
          <span className="text-neutral-400">
            FitPro • Treino semanal disponível em PDF, foto (.png) e texto.
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
