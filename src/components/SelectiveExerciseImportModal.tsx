import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Exercise, MuscleGroup, EquipmentType } from '../types';
import { db } from '../services/db';
import { FREE_EXERCISE_DB_LIST, searchFreeExerciseDb } from '../services/freeExerciseDbService';
import { translateExercise } from '../services/workoutTranslator';
import { getSafeImageUrl } from '../services/imageUtils';
import confetti from 'canvas-confetti';
import {
  Download,
  Search,
  Filter,
  Check,
  CheckSquare,
  Square,
  X,
  Dumbbell,
  FileDown,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface SelectiveExerciseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

const ITEMS_PER_PAGE = 12;

export function SelectiveExerciseImportModal({
  isOpen,
  onClose,
  onImportComplete
}: SelectiveExerciseImportModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const muscleGroups = useMemo(() => db.getMuscleGroups(), []);
  const equipmentList = useMemo(() => db.getEquipment(), []);

  // Filter available exercises from catalog with memoization
  const matchedExercises = useMemo(() => {
    return searchFreeExerciseDb({
      query: searchTerm,
      muscleGroup: selectedMuscle,
      equipment: selectedEquipment,
      limit: 876,
      autoTranslate: true
    });
  }, [searchTerm, selectedMuscle, selectedEquipment]);

  // Pagination for mobile performance
  const totalPages = Math.max(1, Math.ceil(matchedExercises.length / ITEMS_PER_PAGE));
  const paginatedExercises = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return matchedExercises.slice(start, start + ITEMS_PER_PAGE);
  }, [matchedExercises, currentPage]);

  const existingInLibraryNames = useMemo(() => {
    const names = new Set<string>();
    db.getExercises().forEach(e => {
      names.add(e.name.trim().toLowerCase());
    });
    return names;
  }, [importSuccessMessage]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      paginatedExercises.forEach(ex => {
        if (!existingInLibraryNames.has(ex.name.trim().toLowerCase())) {
          next.add(ex.id);
        }
      });
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleImportSelected = () => {
    if (selectedIds.size === 0) return;

    const exercisesToImport = FREE_EXERCISE_DB_LIST
      .filter(ex => selectedIds.has(ex.id))
      .map(ex => translateExercise(ex, 'pt-br'));

    const result = db.bulkImportExercises(exercisesToImport);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // Ignored if confetti fails
    }

    setImportSuccessMessage(`${result.added} novos exercícios importados com sucesso para o seu app!`);
    onImportComplete?.(result.added);
    setSelectedIds(new Set());

    setTimeout(() => {
      setImportSuccessMessage(null);
      onClose();
    }, 2000);
  };

  // Export selected as a downloadable .json file
  const handleDownloadJsonFile = () => {
    if (selectedIds.size === 0) return;

    const exercisesToExport = FREE_EXERCISE_DB_LIST
      .filter(ex => selectedIds.has(ex.id))
      .map(ex => translateExercise(ex, 'pt-br'));

    const blob = new Blob([JSON.stringify(exercisesToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitpro-exercicios-selecionados-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-[#12161f] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800/80 bg-[#161b26]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Baixar Exercícios Selecionados
              </h2>
              <p className="text-xs text-neutral-400">
                Escolha apenas os exercícios que você quer importar no seu sistema
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

        {/* Filter Controls Bar */}
        <div className="p-3 sm:p-4 border-b border-neutral-800/60 bg-[#12161f] space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nome ou músculo (ex: supino, bíceps)..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Muscle Filter */}
            <select
              value={selectedMuscle}
              onChange={e => {
                setSelectedMuscle(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Todos">Músculo: Todos</option>
              {muscleGroups.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Equipment Filter */}
            <select
              value={selectedEquipment}
              onChange={e => {
                setSelectedEquipment(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Todos">Equipamento: Todos</option>
              {equipmentList.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>

          {/* Selection Actions & Counter */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllPage}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selecionar da Página</span>
              </button>
              <span>·</span>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="hover:text-red-400 transition-colors"
                >
                  Limpar ({selectedIds.size})
                </button>
              )}
            </div>

            <div className="font-medium text-neutral-300">
              {matchedExercises.length} encontrados · <span className="text-emerald-400 font-bold">{selectedIds.size} selecionados</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {importSuccessMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
        )}

        {/* Exercise List (Lightweight virtualized-like batched list) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[50vh] scrollbar-thin scrollbar-thumb-neutral-800">
          {paginatedExercises.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs sm:text-sm">
              Nenhum exercício encontrado com esses filtros. Tente alterar o termo de busca.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paginatedExercises.map(ex => {
                const isSelected = selectedIds.has(ex.id);
                const isAlreadyInLib = existingInLibraryNames.has(ex.name.trim().toLowerCase());

                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleSelect(ex.id)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm'
                        : isAlreadyInLib
                        ? 'bg-neutral-900/40 border-neutral-800/60 opacity-80'
                        : 'bg-[#141922] border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {/* Checkbox indicator */}
                      <button
                        type="button"
                        className="text-emerald-400 shrink-0"
                        onClick={e => {
                          e.stopPropagation();
                          toggleSelect(ex.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600" />
                        )}
                      </button>

                      {/* Mini thumbnail */}
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                        <img
                          src={getSafeImageUrl(ex.imageUrl)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {ex.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                          <span className="text-emerald-400 font-medium">{ex.primaryMuscle}</span>
                          <span>·</span>
                          <span className="truncate">{ex.equipment}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isAlreadyInLib && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        Na Biblioteca
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-800/60 bg-[#141922] text-xs">
            <span className="text-neutral-400">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-4 border-t border-neutral-800/80 bg-[#161b26]">
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={handleDownloadJsonFile}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-40 transition-colors"
            title="Exportar selecionados como arquivo .json para seu dispositivo"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            <span>Baixar como Arquivo (.json)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleImportSelected}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-black disabled:opacity-40 transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Importar para o App ({selectedIds.size})</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
