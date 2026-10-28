import { useRef, useEffect, useState, useMemo } from 'react';
import { Exercise, MuscleGroup } from '../types';
import { db } from '../services/db';
import { getSafeImageUrl } from '../services/imageUtils';
import { MuscleHighlightSvg } from './MuscleHighlightSvg';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  MessageCircle, 
  Camera, 
  Sparkles,
  Dumbbell,
  Repeat,
  Flame,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ListOrdered,
  Eye,
  Info
} from 'lucide-react';

interface ExerciseShareModalProps {
  exercise: Exercise;
  onClose: () => void;
}

// Universal rounded rect helper for Canvas
function drawRoundedRect(
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

// Text word wrap helper for Canvas
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let linesCount = 0;
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
      linesCount++;
      if (linesCount >= maxLines - 1 && n < words.length - 1) {
        // truncate remaining
        line = line + words.slice(n + 1, n + 4).join(' ') + '...';
        ctx.fillText(line.trim(), x, curY);
        return curY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

// Anatomical Muscle Figure drawer for Canvas ("desenho do boneco com músculo alvo")
function drawMuscleFigureOnCanvas(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  targetY: number,
  targetW: number,
  targetH: number,
  primaryMuscle: MuscleGroup,
  secondaryMuscles: MuscleGroup[] = []
) {
  ctx.save();

  // Background container
  drawRoundedRect(ctx, targetX, targetY, targetW, targetH, 20);
  ctx.fillStyle = '#0a0e14';
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header Badge
  const headerBadgeW = targetW - 24;
  drawRoundedRect(ctx, targetX + 12, targetY + 12, headerBadgeW, 26, 7);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = '800 11px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ MÚSCULO ALVO', targetX + targetW / 2, targetY + 29);

  // SVG coordinate box is 160 x 220
  const svgW = 160;
  const svgH = 220;
  const availableH = targetH - 80;
  const availableW = targetW - 24;
  const scale = Math.min(availableW / svgW, availableH / svgH);
  const drawW = svgW * scale;
  const drawH = svgH * scale;
  const offsetX = targetX + (targetW - drawW) / 2;
  const offsetY = targetY + 44 + (availableH - drawH) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const isPrimary = (m: MuscleGroup) =>
    primaryMuscle === m ||
    primaryMuscle === 'Corpo inteiro' ||
    (primaryMuscle === 'Cardio' && (m === 'Pernas' || m === 'Peito'));

  const isSecondary = (m: MuscleGroup) =>
    secondaryMuscles.includes(m);

  const getColor = (m: MuscleGroup) => {
    if (isPrimary(m)) return '#10b981'; // vibrant neon athletic emerald
    if (isSecondary(m)) return '#059669'; // secondary darker emerald
    return '#272f38'; // neutral dark body silhouette
  };

  const drawPath = (pathString: string, fillStyle: string) => {
    ctx.fillStyle = fillStyle;
    if (typeof Path2D !== 'undefined') {
      ctx.fill(new Path2D(pathString));
    }
  };

  // Head
  ctx.fillStyle = '#272f38';
  ctx.beginPath();
  ctx.arc(80, 24, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(75, 36, 10, 8);

  // Traps / Costas
  drawPath('M68 44 L92 44 L102 54 L58 54 Z', getColor('Costas'));

  // Ombros (Shoulders)
  drawPath('M56 52 C50 54 44 62 48 72 C52 74 58 66 60 56 Z', getColor('Ombros'));
  drawPath('M104 52 C110 54 116 62 112 72 C108 74 102 66 100 56 Z', getColor('Ombros'));

  // Peito (Chest)
  drawPath('M60 56 C70 56 78 62 78 76 C66 78 58 72 58 64 Z', getColor('Peito'));
  drawPath('M100 56 C90 56 82 62 82 76 C94 78 102 72 102 64 Z', getColor('Peito'));

  // Bíceps
  drawPath('M47 73 C42 80 40 92 45 102 C49 100 51 90 51 77 Z', getColor('Bíceps'));
  drawPath('M113 73 C118 80 120 92 115 102 C111 100 109 90 109 77 Z', getColor('Bíceps'));

  // Tríceps
  drawPath('M42 74 C38 82 38 90 42 98 Z', getColor('Tríceps'));
  drawPath('M118 74 C122 82 122 90 118 98 Z', getColor('Tríceps'));

  // Abdômen (Core)
  ctx.fillStyle = getColor('Abdômen');
  ctx.fillRect(66, 78, 13, 10);
  ctx.fillRect(81, 78, 13, 10);
  ctx.fillRect(67, 90, 12, 10);
  ctx.fillRect(81, 90, 12, 10);
  ctx.fillRect(68, 102, 11, 9);
  ctx.fillRect(81, 102, 11, 9);

  // Glúteos
  drawPath('M62 113 C62 124 76 130 78 130 C80 130 98 124 98 113 Z', getColor('Glúteos'));

  // Pernas (Quadriceps & Hamstrings)
  drawPath('M62 128 C58 140 56 162 64 172 C72 172 76 156 76 130 Z', getColor('Pernas'));
  drawPath('M98 128 C102 140 104 162 96 172 C88 172 84 156 84 130 Z', getColor('Pernas'));

  // Knees
  ctx.fillStyle = '#272f38';
  ctx.beginPath();
  ctx.arc(65, 174, 5, 0, Math.PI * 2);
  ctx.arc(95, 174, 5, 0, Math.PI * 2);
  ctx.fill();

  // Panturrilhas (Calves)
  drawPath('M61 178 C57 186 58 198 64 206 C68 206 70 196 69 178 Z', getColor('Panturrilhas'));
  drawPath('M99 178 C103 186 102 198 96 206 C92 206 90 196 91 178 Z', getColor('Panturrilhas'));

  // Feet
  ctx.fillStyle = '#272f38';
  ctx.beginPath();
  ctx.ellipse(61, 209, 7, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(99, 209, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Muscle Name Bottom Pill
  drawRoundedRect(ctx, targetX + 16, targetY + targetH - 32, targetW - 32, 22, 6);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(primaryMuscle.toUpperCase(), targetX + targetW / 2, targetY + targetH - 17);

  ctx.restore();
}

export function ExerciseShareModal({ exercise, onClose }: ExerciseShareModalProps) {
  const [format, setFormat] = useState<'story' | 'feed'>('story'); // story 9:16 (1080x1920), feed 4:5 (1080x1350)
  const [activeTab, setActiveTab] = useState<'passo' | 'erros' | 'dicas'>('passo');
  const [isRendering, setIsRendering] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentUser = db.getCurrentUser();

  // Normalized lists for display
  const mistakesList = useMemo(() => {
    if (exercise.commonMistakes && exercise.commonMistakes.length > 0) {
      return exercise.commonMistakes;
    }
    return [
      'Executar o movimento com pressa sem controle da fase excêntrica',
      'Curvar excessivamente a coluna ou compensar com impulso do tronco'
    ];
  }, [exercise]);

  const tipsList = useMemo(() => {
    if (exercise.executionTips && exercise.executionTips.length > 0) {
      return exercise.executionTips;
    }
    return [
      exercise.breathing ? `Respiração: ${exercise.breathing}` : 'Mantenha cadência controlada (2s excêntrica / 1s concêntrica)',
      'Foque na contração de pico muscular no ápice do movimento'
    ];
  }, [exercise]);

  // Generate canvas graphic
  useEffect(() => {
    let isCancelled = false;

    const renderCard = async () => {
      setIsRendering(true);
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore font loading errors
        }
      }

      const canvas = canvasRef.current;
      if (!canvas || isCancelled) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dimensions based on selected format
      // Story: 1080 x 1920 (9:16)
      // Feed: 1080 x 1350 (4:5)
      const width = 1080;
      const height = format === 'story' ? 1920 : 1350;
      canvas.width = width;
      canvas.height = height;

      // 1. Dark Athletic Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#06080c');
      bgGrad.addColorStop(0.35, '#0b0f16');
      bgGrad.addColorStop(0.7, '#101620');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle emerald & amber athletic radial glow
      const radialGlow = ctx.createRadialGradient(width * 0.85, 240, 20, width * 0.85, 240, 550);
      radialGlow.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
      radialGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      const radialGlowBottom = ctx.createRadialGradient(width * 0.15, height - 200, 20, width * 0.15, height - 200, 500);
      radialGlowBottom.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      radialGlowBottom.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGlowBottom;
      ctx.fillRect(0, 0, width, height);

      // Card Borders
      ctx.strokeStyle = '#1a222d';
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, width - 56, height - 56);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      // 2. Brand Header Bar
      drawRoundedRect(ctx, 64, 60, 48, 48, 12);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Logo Icon dumbbell shape
      ctx.fillStyle = '#06080c';
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 88, 93);

      // FitPro logo text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('FITPRO', 124, 94);

      ctx.fillStyle = '#10b981';
      ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('GUIA COMPLETO DE BIOMECÂNICA', 126, 114);

      // Muscle Pill on the right
      const muscleText = exercise.primaryMuscle.toUpperCase();
      ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
      const muscleMetrics = ctx.measureText(muscleText);
      const pillWidth = muscleMetrics.width + 32;
      drawRoundedRect(ctx, width - 64 - pillWidth, 66, pillWidth, 38, 19);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      ctx.fillText(muscleText, width - 64 - pillWidth / 2, 90);

      // Top divider
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, 134);
      ctx.lineTo(width - 64, 134);
      ctx.stroke();

      // 3. Exercise Photo & Anatomical Muscle Figure Section ("desenho do boneco")
      const photoBoxY = 150;
      const photoBoxHeight = format === 'story' ? 440 : 290;
      const totalBoxWidth = width - 128; // 952px
      const bonecoWidth = 244;
      const gap = 16;
      const photoBoxWidth = totalBoxWidth - bonecoWidth - gap; // 692px
      const photoBoxX = 64;
      const bonecoBoxX = photoBoxX + photoBoxWidth + gap; // 772px

      let imageDrawn = false;
      const safeRawUrl = getSafeImageUrl(exercise.imageUrl);
      const proxiedUrl = safeRawUrl.startsWith('http') 
        ? `/api/proxy-image?url=${encodeURIComponent(safeRawUrl)}`
        : safeRawUrl;

      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const imgLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject();
          img.src = proxiedUrl;
        });

        const loadedImg = await Promise.race([
          imgLoadPromise,
          new Promise<null>((_, reject) => setTimeout(() => reject('timeout'), 4000))
        ]);

        if (loadedImg && !isCancelled) {
          ctx.save();
          drawRoundedRect(ctx, photoBoxX, photoBoxY, photoBoxWidth, photoBoxHeight, 20);
          ctx.clip();

          // Cover crop
          const imgAspect = loadedImg.width / loadedImg.height;
          const boxAspect = photoBoxWidth / photoBoxHeight;
          let drawW = photoBoxWidth;
          let drawH = photoBoxHeight;
          let drawX = photoBoxX;
          let drawY = photoBoxY;

          if (imgAspect > boxAspect) {
            drawW = photoBoxHeight * imgAspect;
            drawX = photoBoxX - (drawW - photoBoxWidth) / 2;
          } else {
            drawH = photoBoxWidth / imgAspect;
            drawY = photoBoxY - (drawH - photoBoxHeight) / 2;
          }

          ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);

          // Subtle dark gradient on bottom of photo
          const photoGrad = ctx.createLinearGradient(0, photoBoxY + photoBoxHeight - 120, 0, photoBoxY + photoBoxHeight);
          photoGrad.addColorStop(0, 'transparent');
          photoGrad.addColorStop(1, 'rgba(6, 8, 12, 0.9)');
          ctx.fillStyle = photoGrad;
          ctx.fillRect(photoBoxX, photoBoxY, photoBoxWidth, photoBoxHeight);

          ctx.restore();

          // Border for photo
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, photoBoxX, photoBoxY, photoBoxWidth, photoBoxHeight, 20);
          ctx.stroke();

          imageDrawn = true;
        }
      } catch {
        // Fallback banner
      }

      if (!imageDrawn && !isCancelled) {
        drawRoundedRect(ctx, photoBoxX, photoBoxY, photoBoxWidth, photoBoxHeight, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏋️ ' + exercise.primaryMuscle.toUpperCase(), photoBoxX + photoBoxWidth / 2, photoBoxY + photoBoxHeight / 2 - 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 16px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(exercise.equipment, photoBoxX + photoBoxWidth / 2, photoBoxY + photoBoxHeight / 2 + 20);
      }

      // 3.B Anatomical Muscle Figure Card ("desenho do boneco com músculo alvo")
      drawMuscleFigureOnCanvas(
        ctx,
        bonecoBoxX,
        photoBoxY,
        bonecoWidth,
        photoBoxHeight,
        exercise.primaryMuscle,
        exercise.secondaryMuscles
      );

      // 4. Exercise Title & Meta Info
      let curY = photoBoxY + photoBoxHeight + 36;

      // Exercise Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = format === 'story' 
        ? '900 40px "Plus Jakarta Sans", system-ui, sans-serif'
        : '900 32px "Plus Jakarta Sans", system-ui, sans-serif';
      curY = wrapText(ctx, exercise.name, 64, curY, width - 128, format === 'story' ? 46 : 38, 2);

      // Badges Row: Equipment, Level, Secondary Muscles
      curY += 6;
      let badgeX = 64;
      const badges = [
        { label: `Equipamento: ${exercise.equipment}`, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
        { label: `Nível: ${exercise.level}`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' }
      ];

      if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
        badges.push({
          label: `Secundários: ${exercise.secondaryMuscles.slice(0, 2).join(', ')}`,
          color: '#a855f7',
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.3)'
        });
      }

      badges.forEach(b => {
        ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
        const m = ctx.measureText(b.label);
        const bW = m.width + 24;
        drawRoundedRect(ctx, badgeX, curY, bW, 30, 8);
        ctx.fillStyle = b.bg;
        ctx.fill();
        ctx.strokeStyle = b.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = b.color;
        ctx.fillText(b.label, badgeX + 12, curY + 20);
        badgeX += bW + 10;
      });

      // 5. Prescribed Protocol Metrics (Séries, Repetições, Descanso)
      curY += 46;
      const metricsHeight = format === 'story' ? 82 : 72;
      drawRoundedRect(ctx, 64, curY, width - 128, metricsHeight, 16);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const colW = (width - 128) / 3;
      // Col 1: Séries
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('SÉRIES RECOM.', 64 + colW * 0.5, curY + 28);
      ctx.fillStyle = '#10b981';
      ctx.font = '900 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`${exercise.recommendedSets} séries`, 64 + colW * 0.5, curY + 60);

      // Col 2: Reps
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('REPETIÇÕES', 64 + colW * 1.5, curY + 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`${exercise.recommendedReps}`, 64 + colW * 1.5, curY + 60);

      // Col 3: Rest
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('INTERVALO', 64 + colW * 2.5, curY + 28);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`${exercise.recommendedRestSec}s`, 64 + colW * 2.5, curY + 60);

      curY += metricsHeight + 22;

      // 6. SECTION A: PASSO A PASSO DA EXECUÇÃO
      ctx.textAlign = 'left';
      const stepBoxH = format === 'story' ? 220 : 160;
      drawRoundedRect(ctx, 64, curY, width - 128, stepBoxH, 16);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Step Header Pill
      drawRoundedRect(ctx, 84, curY + 16, 260, 28, 6);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('📋 PASSO A PASSO DA EXECUÇÃO', 96, curY + 35);

      let stepY = curY + 62;
      // Step 1: Initial Position
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('1. Posição Inicial:', 84, stepY);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
      stepY = wrapText(ctx, exercise.initialPosition, 215, stepY, width - 325, 22, format === 'story' ? 2 : 1);

      // Step 2: Movement
      stepY += 6;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('2. Movimento:', 84, stepY);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
      stepY = wrapText(ctx, exercise.movement, 215, stepY, width - 325, 22, format === 'story' ? 2 : 1);

      // Step 3: Breathing (if space permits)
      if (format === 'story' && exercise.breathing) {
        stepY += 6;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('3. Respiração:', 84, stepY);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
        wrapText(ctx, exercise.breathing, 215, stepY, width - 325, 22, 1);
      }

      curY += stepBoxH + 18;

      // 7. SECTION B: ERROS COMUNS A EVITAR (Requested prominently by User)
      const errorBoxH = format === 'story' ? 175 : 135;
      drawRoundedRect(ctx, 64, curY, width - 128, errorBoxH, 16);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Erros Header Pill
      drawRoundedRect(ctx, 84, curY + 16, 230, 28, 6);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('⚠️ ERROS COMUNS A EVITAR', 96, curY + 35);

      let errorY = curY + 60;
      mistakesList.slice(0, format === 'story' ? 2 : 1).forEach((mistake, idx) => {
        ctx.fillStyle = '#f87171';
        ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('✕', 86, errorY);

        ctx.fillStyle = '#fecaca';
        ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
        errorY = wrapText(ctx, mistake, 108, errorY, width - 200, 22, format === 'story' ? 2 : 2);
        errorY += 6;
      });

      curY += errorBoxH + 18;

      // 8. SECTION C: DICAS E BIOMECÂNICA (Requested by User)
      const tipBoxH = format === 'story' ? 165 : 125;
      drawRoundedRect(ctx, 64, curY, width - 128, tipBoxH, 16);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dica Header Pill
      drawRoundedRect(ctx, 84, curY + 16, 210, 28, 6);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('💡 DICA DE BIOMECÂNICA', 96, curY + 35);

      let tipY = curY + 60;
      tipsList.slice(0, format === 'story' ? 2 : 1).forEach((tip, idx) => {
        ctx.fillStyle = '#34d399';
        ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('✓', 86, tipY);

        ctx.fillStyle = '#d1fae5';
        ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
        tipY = wrapText(ctx, tip, 108, tipY, width - 200, 22, format === 'story' ? 2 : 2);
        tipY += 6;
      });

      // 9. Bottom Brand Stamp & Social Handle
      const footerY = height - 54;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, footerY - 18);
      ctx.lineTo(width - 64, footerY - 18);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Compartilhado por ${currentUser.name} • FitPro Treinos`, 64, footerY + 6);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#10b981';
      ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('FITPRO • SEU TREINO, SEU RITMO', width - 64, footerY + 6);

      // Generate Download URL
      try {
        const url = canvas.toDataURL('image/png');
        setDownloadUrl(url);
      } catch (err) {
        console.warn('Could not generate dataURL immediately:', err);
      }

      setIsRendering(false);
    };

    renderCard();

    return () => {
      isCancelled = true;
    };
  }, [exercise, format, currentUser, mistakesList, tipsList]);

  // Handle Download Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      const filename = `fitpro-${exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${format}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShareStatus('Foto salva na sua galeria com sucesso!');
      setTimeout(() => setShareStatus(null), 3500);
    } catch (err) {
      console.warn('Erro ao baixar imagem:', err);
      setShareStatus('Erro ao salvar foto.');
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  // Handle Web Share API (native share to Instagram Stories, WhatsApp, Photos, etc.)
  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          handleDownloadImage();
          return;
        }

        const fileName = `${exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-fitpro.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `${exercise.name} - FitPro Guia de Biomecânica`,
              text: `Confira como executar o exercício ${exercise.name} (${exercise.primaryMuscle}) com passo a passo, erros a evitar e dicas de ouro! 💪🔥`,
              files: [file]
            });
            setShareStatus('Compartilhado com sucesso!');
            setTimeout(() => setShareStatus(null), 3000);
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') return;
          }
        }

        // Fallback if files cannot be shared
        if (navigator.share) {
          await navigator.share({
            title: `${exercise.name} - FitPro`,
            text: `Exercício: ${exercise.name} (${exercise.primaryMuscle})\nEquipamento: ${exercise.equipment}\nSéries: ${exercise.recommendedSets}x ${exercise.recommendedReps}\n\nFicha gerada pelo FitPro.`
          });
        } else {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch {
      handleDownloadImage();
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        } else {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch {
      handleDownloadImage();
    }
  };

  // Copy Complete Caption with Passo a Passo, Erros Comuns e Dicas
  const handleCopyText = () => {
    const text = `🏋️‍♂️ ${exercise.name.toUpperCase()}
🎯 Músculo Principal: ${exercise.primaryMuscle}
${exercise.secondaryMuscles.length ? `🔹 Músculos Secundários: ${exercise.secondaryMuscles.join(', ')}\n` : ''}⚙️ Equipamento: ${exercise.equipment}
📊 Nível: ${exercise.level}
⚡ Protocolo: ${exercise.recommendedSets} séries de ${exercise.recommendedReps} (Descanso: ${exercise.recommendedRestSec}s)

📋 PASSO A PASSO DA EXECUÇÃO:
1. Posição Inicial: ${exercise.initialPosition}
2. Movimento: ${exercise.movement}
${exercise.breathing ? `💨 Respiração: ${exercise.breathing}\n` : ''}
⚠️ ERROS COMUNS A EVITAR:
${mistakesList.map(m => `✕ ${m}`).join('\n')}

💡 DICAS E BIOMECÂNICA:
${tipsList.map(t => `✓ ${t}`).join('\n')}

App FitPro • Seu Treino, Seu Ritmo`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Direct WhatsApp Share with complete breakdown
  const handleWhatsAppShare = () => {
    const text = `*${exercise.name}* (${exercise.primaryMuscle})
Equipamento: ${exercise.equipment}
Séries: ${exercise.recommendedSets}x ${exercise.recommendedReps}

*Passo a Passo:*
1. Posição: ${exercise.initialPosition}
2. Movimento: ${exercise.movement}

*Erros a Evitar:*
${mistakesList.slice(0, 2).map(m => `• ${m}`).join('\n')}

*Dica de Ouro:*
${tipsList[0] || 'Mantenha amplitude controlada.'}

FitPro Treinos`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0f141c] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-200 my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                Salvar & Compartilhar Exercício
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Foto Alta Resolução
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Card completo com Foto, Passo a Passo, Erros Comuns e Dicas de Biomecânica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-neutral-900/40 border-b border-neutral-800/80 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400">Formato da Imagem:</span>
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                onClick={() => setFormat('story')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  format === 'story'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Stories / Status</span>
                <span className="text-[10px] opacity-75 font-mono">9:16</span>
              </button>

              <button
                onClick={() => setFormat('feed')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  format === 'feed'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Feed / Post</span>
                <span className="text-[10px] opacity-75 font-mono">4:5</span>
              </button>
            </div>
          </div>

          {shareStatus && (
            <span className="text-xs font-semibold text-emerald-400 animate-in fade-in">
              {shareStatus}
            </span>
          )}
        </div>

        {/* Modal Body: Left Preview, Right Action Buttons & Detailed Sections */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Card Visual Preview (Canvas) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[350px] aspect-[9/16] max-h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/80 bg-neutral-950 flex items-center justify-center">
              {isRendering && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-neutral-300">Gerando card em alta resolução...</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 text-center">
              Inclui Foto + Desenho do Boneco (Músculo Alvo) + Passo a Passo + Erros a Evitar + Dica.
            </p>
          </div>

          {/* Right Action Panel */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Muscle highlight visual boneco in panel */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <MuscleHighlightSvg
                primaryMuscle={exercise.primaryMuscle}
                secondaryMuscles={exercise.secondaryMuscles}
                className="w-24 h-32 shrink-0 bg-[#0a0d13]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Músculo Alvo em Destaque
                </div>
                <h4 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                  {exercise.primaryMuscle}
                </h4>
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <p className="text-xs text-neutral-400 mt-1">
                    Secundários: <span className="text-neutral-300 font-semibold">{exercise.secondaryMuscles.join(', ')}</span>
                  </p>
                )}
                <span className="inline-block text-[11px] text-emerald-400/90 font-medium mt-1.5 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ✓ Incluído no card para redes sociais
                </span>
              </div>
            </div>

            {/* Quick Details Tabs */}
            <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 p-3 space-y-2.5">
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800/80">
                <button
                  onClick={() => setActiveTab('passo')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'passo'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Passo a Passo</span>
                </button>

                <button
                  onClick={() => setActiveTab('erros')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'erros'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Erros Comuns</span>
                </button>

                <button
                  onClick={() => setActiveTab('dicas')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'dicas'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Dicas</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="text-xs min-h-[90px] pt-1">
                {activeTab === 'passo' && (
                  <div className="space-y-2 animate-in fade-in">
                    <div>
                      <span className="font-bold text-blue-300">1. Posição Inicial:</span>
                      <p className="text-neutral-300 mt-0.5 leading-relaxed">{exercise.initialPosition}</p>
                    </div>
                    <div>
                      <span className="font-bold text-blue-300">2. Execução do Movimento:</span>
                      <p className="text-neutral-300 mt-0.5 leading-relaxed">{exercise.movement}</p>
                    </div>
                    {exercise.breathing && (
                      <div>
                        <span className="font-bold text-blue-300">💨 Respiração:</span>
                        <p className="text-neutral-300 mt-0.5 leading-relaxed">{exercise.breathing}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'erros' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <p className="text-neutral-400 text-[11px] mb-1">Evite estes erros para prevenir lesões e maximizar hipertrofia:</p>
                    {mistakesList.map((mistake, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-neutral-300 bg-red-950/20 p-2 rounded-xl border border-red-500/20">
                        <span className="text-red-400 font-bold shrink-0">✕</span>
                        <span className="leading-snug">{mistake}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'dicas' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <p className="text-neutral-400 text-[11px] mb-1">Dicas biomecânicas de alto rendimento:</p>
                    {tipsList.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-neutral-300 bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/20">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span className="leading-snug">{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action: Direct Share Sheet */}
            <button
              onClick={handleNativeShare}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>COMPARTILHAR NAS REDES SOCIAIS</span>
            </button>

            {/* Download Photo PNG */}
            <button
              onClick={handleDownloadImage}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar Imagem PNG na Galeria</span>
            </button>

            {/* Copy image to clipboard */}
            <button
              onClick={handleCopyImage}
              className="w-full py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs border border-neutral-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Imagem Copiada para Área de Transferência!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Copiar Imagem para Colar</span>
                </>
              )}
            </button>

            {/* WhatsApp Direct */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-2 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Enviar via WhatsApp</span>
            </button>

            {/* Copy formatted caption text */}
            <button
              onClick={handleCopyText}
              className="w-full py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs border border-neutral-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Legenda com Passo a Passo & Erros Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>Copiar Legenda em Texto Completa</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
