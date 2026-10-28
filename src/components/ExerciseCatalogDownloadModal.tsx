import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Exercise, MuscleGroup, EquipmentType } from '../types';
import { db } from '../services/db';
import { FREE_EXERCISE_DB_LIST, getAllFreeExerciseDb } from '../services/freeExerciseDbService';
import { translateExercise } from '../services/workoutTranslator';
import { getSafeImageUrl } from '../services/imageUtils';
import confetti from 'canvas-confetti';
import {
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Check,
  CheckSquare,
  Square,
  X,
  Dumbbell,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Filter,
  Search,
  Zap,
  Info,
  Calendar,
  Eye
} from 'lucide-react';

interface ExerciseCatalogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

type DownloadMode = 'completo' | 'musculo' | 'equipamento';
type ExportFormat = 'csv' | 'json' | 'txt';

export function ExerciseCatalogDownloadModal({
  isOpen,
  onClose,
  onImportComplete
}: ExerciseCatalogDownloadModalProps) {
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('completo');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set());
  const [selectedEquipments, setSelectedEquipments] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // All catalog exercises translated to PT-BR
  const catalogExercises = useMemo(() => {
    return getAllFreeExerciseDb('pt-br');
  }, []);

  // Compute counts per muscle group
  const muscleStats = useMemo(() => {
    const map = new Map<string, number>();
    catalogExercises.forEach(ex => {
      const m = ex.primaryMuscle || 'Outros';
      map.set(m, (map.get(m) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [catalogExercises]);

  // Compute counts per equipment type
  const equipmentStats = useMemo(() => {
    const map = new Map<string, number>();
    catalogExercises.forEach(ex => {
      const eq = ex.equipment || 'Outros';
      map.set(eq, (map.get(eq) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [catalogExercises]);

  // Filter exercises based on current downloadMode and active selections
  const filteredExercises = useMemo(() => {
    let result = catalogExercises;

    if (downloadMode === 'musculo') {
      if (selectedMuscles.size > 0) {
        result = result.filter(ex => selectedMuscles.has(ex.primaryMuscle));
      }
    } else if (downloadMode === 'equipamento') {
      if (selectedEquipments.size > 0) {
        result = result.filter(ex => selectedEquipments.has(ex.equipment));
      }
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.primaryMuscle.toLowerCase().includes(query) ||
        ex.equipment.toLowerCase().includes(query)
      );
    }

    return result;
  }, [catalogExercises, downloadMode, selectedMuscles, selectedEquipments, searchTerm]);

  // Muscle toggle
  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev => {
      const next = new Set(prev);
      if (next.has(muscle)) {
        next.delete(muscle);
      } else {
        next.add(muscle);
      }
      return next;
    });
  };

  const selectAllMuscles = () => {
    setSelectedMuscles(new Set(muscleStats.map(m => m.name)));
  };

  const clearMuscles = () => {
    setSelectedMuscles(new Set());
  };

  // Equipment toggle
  const toggleEquipment = (eq: string) => {
    setSelectedEquipments(prev => {
      const next = new Set(prev);
      if (next.has(eq)) {
        next.delete(eq);
      } else {
        next.add(eq);
      }
      return next;
    });
  };

  const selectAllEquipment = () => {
    setSelectedEquipments(new Set(equipmentStats.map(e => e.name)));
  };

  const clearEquipment = () => {
    setSelectedEquipments(new Set());
  };

  // Trigger File Download
  const handleDownloadFile = () => {
    if (filteredExercises.length === 0) return;
    setIsProcessing(true);

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `fitpro-catalogo-${downloadMode}-${dateStr}`;

      if (downloadMode === 'musculo' && selectedMuscles.size === 1) {
        const mName = String(Array.from(selectedMuscles)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        filename = `fitpro-exercicios-${mName}-${dateStr}`;
      } else if (downloadMode === 'equipamento' && selectedEquipments.size === 1) {
        const eqName = String(Array.from(selectedEquipments)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        filename = `fitpro-exercicios-${eqName}-${dateStr}`;
      } else if (downloadMode === 'completo') {
        filename = `fitpro-catalogo-completo-${filteredExercises.length}-exercicios-${dateStr}`;
      }

      let blob: Blob;

      if (exportFormat === 'json') {
        // Formato JSON
        const jsonContent = JSON.stringify(filteredExercises, null, 2);
        blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        filename += '.json';
      } else if (exportFormat === 'csv') {
        // Formato CSV / Excel com UTF-8 BOM para abrir sem erros de acentuação
        const headers = [
          'Nome do Exercício',
          'Músculo Principal',
          'Músculos Secundários',
          'Equipamento',
          'Nível',
          'Séries Recomendadas',
          'Repetições',
          'Intervalo Descanso (s)',
          'Posição Inicial',
          'Execução do Movimento',
          'Respiração',
          'Erros Comuns a Evitar',
          'Dicas de Biomecânica',
          'Foto (URL)'
        ];

        const escapeCsv = (str: any) => {
          if (str === undefined || str === null) return '""';
          const val = String(str).replace(/"/g, '""');
          return `"${val}"`;
        };

        const rows = filteredExercises.map(ex => [
          escapeCsv(ex.name),
          escapeCsv(ex.primaryMuscle),
          escapeCsv((ex.secondaryMuscles || []).join('; ')),
          escapeCsv(ex.equipment),
          escapeCsv(ex.level),
          escapeCsv(ex.recommendedSets),
          escapeCsv(ex.recommendedReps),
          escapeCsv(ex.recommendedRestSec),
          escapeCsv(ex.initialPosition),
          escapeCsv(ex.movement),
          escapeCsv(ex.breathing || ''),
          escapeCsv((ex.commonMistakes || []).join(' | ')),
          escapeCsv((ex.executionTips || []).join(' | ')),
          escapeCsv(ex.imageUrl || '')
        ].join(','));

        // Add UTF-8 BOM for Microsoft Excel / Sheets compatibility
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename += '.csv';
      } else {
        // Formato TXT / Markdown
        const lines: string[] = [
          `=============================================================`,
          `FITPRO TREINOS - CATÁLOGO DE EXERCÍCIOS`,
          `Modo: ${downloadMode.toUpperCase()} | Total: ${filteredExercises.length} exercícios`,
          `Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`,
          `=============================================================\n`
        ];

        filteredExercises.forEach((ex, idx) => {
          lines.push(`-------------------------------------------------------------`);
          lines.push(`${idx + 1}. ${ex.name.toUpperCase()}`);
          lines.push(`Músculo Principal: ${ex.primaryMuscle}`);
          if (ex.secondaryMuscles && ex.secondaryMuscles.length) {
            lines.push(`Músculos Secundários: ${ex.secondaryMuscles.join(', ')}`);
          }
          lines.push(`Equipamento: ${ex.equipment} | Nível: ${ex.level}`);
          lines.push(`Prescrição Sugerida: ${ex.recommendedSets} séries x ${ex.recommendedReps} reps (Descanso: ${ex.recommendedRestSec}s)`);
          lines.push(`\n[PASSO A PASSO DA EXECUÇÃO]`);
          lines.push(`1. Posição Inicial: ${ex.initialPosition}`);
          lines.push(`2. Movimento: ${ex.movement}`);
          if (ex.breathing) lines.push(`💨 Respiração: ${ex.breathing}`);

          if (ex.commonMistakes && ex.commonMistakes.length > 0) {
            lines.push(`\n[ERROS COMUNS A EVITAR]`);
            ex.commonMistakes.forEach(m => lines.push(`✕ ${m}`));
          }

          if (ex.executionTips && ex.executionTips.length > 0) {
            lines.push(`\n[DICAS DE BIOMECÂNICA]`);
            ex.executionTips.forEach(t => lines.push(`✓ ${t}`));
          }
          lines.push('\n');
        });

        lines.push(`\nGerado pelo FitPro Treinos • Seu Treino, Seu Ritmo`);
        blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        filename += '.txt';
      }

      // Download link creation
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // Ignored
      }

      setToastMessage(`Arquivo "${filename}" baixado com sucesso (${filteredExercises.length} exercícios)!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Download error:', err);
      setToastMessage('Erro ao gerar o download.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Import into local app library
  const handleImportToApp = () => {
    if (filteredExercises.length === 0) return;
    setIsProcessing(true);

    try {
      const result = db.bulkImportExercises(filteredExercises);

      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch {
        // Ignored
      }

      setToastMessage(`${result.added} novos exercícios importados com sucesso para a biblioteca do seu app!`);
      onImportComplete?.(result.added);
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Import error:', err);
      setToastMessage('Erro ao importar para o app.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-[#10141d] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 my-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800/80 bg-[#151a24]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Baixar Catálogo de Exercícios
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {catalogExercises.length} Disponíveis
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Baixe o catálogo completo ou filtre por tipos de músculos ou equipamentos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 sm:p-4 border-b border-neutral-800/60 bg-[#121620]">
          <div className="grid grid-cols-3 gap-2">
            
            {/* Mode 1: Completo */}
            <button
              onClick={() => {
                setDownloadMode('completo');
                setSearchTerm('');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                downloadMode === 'completo'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🌟</span>
                <div>
                  <div className="text-xs sm:text-sm font-bold">Catálogo Completo</div>
                  <div className="text-[10px] text-neutral-400 hidden sm:block">Todos os 876 exercícios</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                downloadMode === 'completo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {catalogExercises.length}
              </span>
            </button>

            {/* Mode 2: Por Músculo */}
            <button
              onClick={() => {
                setDownloadMode('musculo');
                setSearchTerm('');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                downloadMode === 'musculo'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">💪</span>
                <div>
                  <div className="text-xs sm:text-sm font-bold">Por Músculos</div>
                  <div className="text-[10px] text-neutral-400 hidden sm:block">Peito, Costas, Pernas...</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                downloadMode === 'musculo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {muscleStats.length} Grupos
              </span>
            </button>

            {/* Mode 3: Por Equipamento */}
            <button
              onClick={() => {
                setDownloadMode('equipamento');
                setSearchTerm('');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                downloadMode === 'equipamento'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <div>
                  <div className="text-xs sm:text-sm font-bold">Por Equipamento</div>
                  <div className="text-[10px] text-neutral-400 hidden sm:block">Halteres, Barra, Cabos...</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                downloadMode === 'equipamento' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {equipmentStats.length} Tipos
              </span>
            </button>

          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Interactive Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[50vh] scrollbar-thin scrollbar-thumb-neutral-800">
          
          {/* Search bar inside filter modal */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Refinar exercícios por nome ou termo (ex: supino, bíceps, agachamento)..."
              className="w-full pl-10 pr-3 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mode 1: Completo Info */}
          {downloadMode === 'completo' && (
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Catálogo Completo FitPro (876 Exercícios)</h3>
                  <p className="text-xs text-neutral-400">
                    Inclui fotos, biomecânica, passo a passo detalhado, erros comuns e dicas de ouro traduzidos em Português.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[11px]">Exercícios</span>
                  <span className="text-white font-bold text-sm">876 itens</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[11px]">Grupos Musculares</span>
                  <span className="text-emerald-400 font-bold text-sm">{muscleStats.length} músculos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[11px]">Equipamentos</span>
                  <span className="text-blue-400 font-bold text-sm">{equipmentStats.length} tipos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-neutral-400 block text-[11px]">Idioma</span>
                  <span className="text-amber-400 font-bold text-sm">Português (PT-BR)</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Por Músculo Grid */}
          {downloadMode === 'musculo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                  <span>Escolha os Músculos Desejados:</span>
                  <span className="text-emerald-400">({selectedMuscles.size === 0 ? 'Todos selecionados' : `${selectedMuscles.size} selecionados`})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllMuscles}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Selecionar Todos
                  </button>
                  <span>·</span>
                  <button
                    onClick={clearMuscles}
                    className="text-neutral-400 hover:text-white"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {muscleStats.map(m => {
                  const isSelected = selectedMuscles.has(m.name);
                  return (
                    <div
                      key={m.name}
                      onClick={() => toggleMuscle(m.name)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm'
                          : 'bg-neutral-900/50 border-neutral-800/80 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">{m.name}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 shrink-0">
                        {m.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 3: Por Equipamento Grid */}
          {downloadMode === 'equipamento' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                  <span>Escolha os Tipos de Equipamento:</span>
                  <span className="text-emerald-400">({selectedEquipments.size === 0 ? 'Todos selecionados' : `${selectedEquipments.size} selecionados`})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllEquipment}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Selecionar Todos
                  </button>
                  <span>·</span>
                  <button
                    onClick={clearEquipment}
                    className="text-neutral-400 hover:text-white"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {equipmentStats.map(eq => {
                  const isSelected = selectedEquipments.has(eq.name);
                  return (
                    <div
                      key={eq.name}
                      onClick={() => toggleEquipment(eq.name)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm'
                          : 'bg-neutral-900/50 border-neutral-800/80 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">{eq.name}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 shrink-0">
                        {eq.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Preview of Filtered Exercises */}
          <div className="pt-2 border-t border-neutral-800/70">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-400 font-medium">
                Prévia da Exportação ({filteredExercises.length} exercícios selecionados):
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {filteredExercises.length > 0 ? '✓ Pronto para baixar' : 'Nenhum exercício'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {filteredExercises.slice(0, 3).map(ex => (
                <div key={ex.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/70 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                    <img
                      src={getSafeImageUrl(ex.imageUrl)}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{ex.name}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{ex.primaryMuscle} • {ex.equipment}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Format Selector Bar */}
        <div className="p-3 sm:p-4 border-t border-neutral-800/80 bg-[#121620] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-neutral-400">Formato do Arquivo:</span>
            
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  exportFormat === 'csv'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel / CSV</span>
                <span className="text-[10px] opacity-80">(.csv)</span>
              </button>

              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  exportFormat === 'json'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>JSON Completo</span>
                <span className="text-[10px] opacity-80">(.json)</span>
              </button>

              <button
                onClick={() => setExportFormat('txt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  exportFormat === 'txt'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha Texto</span>
                <span className="text-[10px] opacity-80">(.txt)</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-400 text-right">
            Total a Baixar: <span className="text-white font-bold">{filteredExercises.length} exercícios</span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-neutral-800 bg-[#151a24]">
          <button
            type="button"
            disabled={filteredExercises.length === 0 || isProcessing}
            onClick={handleImportToApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Importar estes exercícios diretamente para a biblioteca do aplicativo"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Importar para o App ({filteredExercises.length})</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              disabled={filteredExercises.length === 0 || isProcessing}
              onClick={handleDownloadFile}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR ARQUIVO ({filteredExercises.length})</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
