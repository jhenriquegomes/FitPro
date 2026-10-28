import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Exercise, MuscleGroup, EquipmentType } from '../types';
import { db } from '../services/db';
import { searchOnlineExercises } from '../services/exerciseSearchService';
import { searchFreeExerciseDb } from '../services/freeExerciseDbService';
import { getBestWebPhotoForExercise } from '../services/exercisePhotoService';
import { getSafeImageUrl } from '../services/imageUtils';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ExercisePhotoModal } from './ExercisePhotoModal';
import { GoogleIcon } from './GoogleIcon';
import confetti from 'canvas-confetti';
import {
  Globe,
  Search,
  Sparkles,
  Download,
  Check,
  CheckSquare,
  Square,
  X,
  Dumbbell,
  Loader2,
  Info,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  Flame,
  AlertCircle,
  Camera,
  Github
} from 'lucide-react';

interface ExerciseOnlineSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
  initialQuery?: string;
  initialSearchMode?: 'google' | 'auto' | 'github';
}

const QUICK_SEARCH_SUGGESTIONS = [
  'Agachamento Búlgaro',
  'Barra Fixa',
  'Face Pull',
  'Stiff com Halteres',
  'Kettlebell Swing',
  'Calistenia',
  'Elevação Pélvica',
  'Desenvolvimento Arnold',
  'Tríceps Francês',
  'Mobilidade Quadril',
  'Abdominal na Roda'
];

export function ExerciseOnlineSearchModal({
  isOpen,
  onClose,
  onImportSuccess,
  initialQuery = '',
  initialSearchMode = 'google'
}: ExerciseOnlineSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');
  const [searchMode, setSearchMode] = useState<'google' | 'auto' | 'github'>(initialSearchMode);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [photoModalExercise, setPhotoModalExercise] = useState<Exercise | null>(null);
  const [importStatus, setImportStatus] = useState<{ added: number; updated: number; singleName?: string } | null>(null);
  const [searchSource, setSearchSource] = useState<'google' | 'gemini' | 'online-catalog' | 'fallback' | 'github'>('google');
  const [webSearchQueries, setWebSearchQueries] = useState<string[]>([]);
  const [justImportedIds, setJustImportedIds] = useState<Set<string>>(new Set());
  const [autoUpdatedCount, setAutoUpdatedCount] = useState<number>(0);

  const muscleGroups = db.getMuscleGroups();
  const equipmentList = db.getEquipment();

  // Sync initial props when opening
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchTerm(initialQuery);
      }
      if (initialSearchMode) {
        setSearchMode(initialSearchMode);
      }
    }
  }, [isOpen, initialQuery, initialSearchMode]);

  // Perform search
  const executeSearch = async (
    query = searchTerm, 
    muscle = selectedMuscle, 
    equip = selectedEquipment,
    mode = searchMode
  ) => {
    setIsLoading(true);
    setImportStatus(null);
    setWebSearchQueries([]);
    try {
      if (mode === 'github') {
        const githubResults = searchFreeExerciseDb({
          query,
          muscleGroup: muscle,
          equipment: equip,
          limit: 12
        });
        setSearchResults(githubResults);
        setSearchSource('github');

        const newIds = new Set<string>();
        githubResults.forEach(ex => {
          if (!db.isExerciseInLibrary(ex.name)) {
            newIds.add(ex.id);
          }
        });
        setSelectedExerciseIds(newIds);
        setIsLoading(false);
        return;
      }

      const res = await searchOnlineExercises({
        query,
        muscleGroup: muscle,
        equipment: equip,
        limit: 9,
        searchMode: mode
      });

      // Enrich exercises with verified high-resolution web photos if needed
      const enrichedExercises = res.exercises.map(ex => {
        const verifiedWebPhoto = getBestWebPhotoForExercise(ex.name, ex.primaryMuscle);
        return {
          ...ex,
          imageUrl: ex.imageUrl && !ex.imageUrl.includes('placeholder') ? ex.imageUrl : verifiedWebPhoto
        };
      });

      setSearchResults(enrichedExercises);
      setSearchSource(res.source);
      if (res.searchQueries && res.searchQueries.length > 0) {
        setWebSearchQueries(res.searchQueries);
      }

      // If existing database exercises were automatically updated with images, record and trigger refresh
      if (res.autoUpdatedInDbCount && res.autoUpdatedInDbCount > 0) {
        setAutoUpdatedCount(res.autoUpdatedInDbCount);
        onImportSuccess?.(res.autoUpdatedInDbCount);
      }

      // Auto-select exercises that are not yet in library
      const newIds = new Set<string>();
      res.exercises.forEach(ex => {
        if (!db.isExerciseInLibrary(ex.name)) {
          newIds.add(ex.id);
        }
      });
      setSelectedExerciseIds(newIds);
    } catch (err) {
      console.error('Failed to search exercises online:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run search when modal opens or query changes on open
  useEffect(() => {
    if (isOpen) {
      executeSearch(initialQuery || searchTerm, selectedMuscle, selectedEquipment, initialSearchMode || searchMode);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedExerciseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllNew = () => {
    const newIds = new Set<string>();
    searchResults.forEach(ex => {
      if (!db.isExerciseInLibrary(ex.name)) {
        newIds.add(ex.id);
      }
    });
    setSelectedExerciseIds(newIds);
  };

  const handleDeselectAll = () => {
    setSelectedExerciseIds(new Set());
  };

  // Import a single exercise directly
  const handleImportSingle = (exercise: Exercise, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = db.importExercises([exercise]);
    setImportStatus({ ...result, singleName: exercise.name });
    setJustImportedIds(prev => new Set(prev).add(exercise.id));

    // Confetti
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // ignore
    }

    if (onImportSuccess) {
      onImportSuccess(1);
    }

    // Remove from selection if it was selected
    setSelectedExerciseIds(prev => {
      const next = new Set(prev);
      next.delete(exercise.id);
      return next;
    });
  };

  // Import batch of selected exercises
  const handleImportSelected = () => {
    const toImport = searchResults.filter(ex => selectedExerciseIds.has(ex.id));
    if (toImport.length === 0) return;

    const result = db.importExercises(toImport);
    setImportStatus(result);

    const newlyImported = new Set(justImportedIds);
    toImport.forEach(ex => newlyImported.add(ex.id));
    setJustImportedIds(newlyImported);

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    if (onImportSuccess) {
      onImportSuccess(result.added + result.updated);
    }

    // Refresh selections
    setSelectedExerciseIds(new Set());
  };

  const openGoogleSearchForExercise = (exerciseName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `https://www.google.com/search?q=${encodeURIComponent('exercício ' + exerciseName + ' como fazer execução correta')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-[#10141a] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800/80 bg-gradient-to-r from-emerald-950/30 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {searchMode === 'google' ? (
                <GoogleIcon className="w-6 h-6" />
              ) : (
                <Globe className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {searchMode === 'google' ? 'Buscar no Google & Importar Exercício' : 'Buscar Exercícios na Internet'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {searchMode === 'google' ? 'Google Grounding' : 'Web & IA'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pesquise qualquer movimento ou variação no Google e importe direto para sua biblioteca FitPro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Search Mode Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141922] border border-neutral-800/80 w-fit flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSearchMode('google');
                executeSearch(searchTerm, selectedMuscle, selectedEquipment, 'google');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                searchMode === 'google'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Pesquisa Google (Tempo Real)</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">Ao Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchMode('github');
                executeSearch(searchTerm, selectedMuscle, selectedEquipment, 'github');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                searchMode === 'github'
                  ? 'bg-purple-950/60 text-purple-300 shadow-sm border border-purple-500/50'
                  : 'text-neutral-400 hover:text-purple-300'
              }`}
            >
              <Github className="w-4 h-4 text-purple-400" />
              <span>GitHub Free DB (876)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchMode('auto');
                executeSearch(searchTerm, selectedMuscle, selectedEquipment, 'auto');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                searchMode === 'auto'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Catálogo FitPro & IA</span>
            </button>
          </div>

          {/* Search Inputs and Controls */}
          <div className="p-4 rounded-2xl bg-[#141922] border border-neutral-800 space-y-3">
            <form
              onSubmit={e => {
                e.preventDefault();
                executeSearch();
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                {searchMode === 'google' ? (
                  <div className="absolute left-3.5 top-3.5">
                    <GoogleIcon className="w-4 h-4" />
                  </div>
                ) : (
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                )}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={
                    searchMode === 'google' 
                      ? 'Pesquisar exercício no Google (ex: Búlgaro com halteres, Face pull no cross)...' 
                      : 'Ex: Agachamento búlgaro, Face pull, Stiff halteres, Calistenia...'
                  }
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMuscle}
                  onChange={e => {
                    setSelectedMuscle(e.target.value);
                    executeSearch(searchTerm, e.target.value, selectedEquipment);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Todos">Músculo: Todos</option>
                  {muscleGroups.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedEquipment}
                  onChange={e => {
                    setSelectedEquipment(e.target.value);
                    executeSearch(searchTerm, selectedMuscle, e.target.value);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Todos">Aparelho: Todos</option>
                  {equipmentList.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md disabled:opacity-50 ${
                    searchMode === 'google'
                      ? 'bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-400 hover:opacity-90 text-black font-black'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Pesquisando...</span>
                    </>
                  ) : (
                    <>
                      {searchMode === 'google' ? <GoogleIcon className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                      <span>{searchMode === 'google' ? 'Buscar no Google' : 'Buscar na Web'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Keyword Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs">
              <span className="text-neutral-500 font-medium shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Sugestões Populares:
              </span>
              {QUICK_SEARCH_SUGGESTIONS.map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchTerm(term);
                    executeSearch(term, selectedMuscle, selectedEquipment);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
                    searchTerm === term
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Success Banner when import happened */}
          {importStatus && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  {importStatus.singleName ? (
                    <>
                      <strong>"{importStatus.singleName}"</strong> foi importado e adicionado à sua biblioteca com sucesso!
                    </>
                  ) : (
                    <>
                      <strong>{importStatus.added} exercício(s)</strong> adicionado(s) e{' '}
                      <strong>{importStatus.updated}</strong> atualizado(s) na sua biblioteca com sucesso!
                    </>
                  )}
                </span>
              </div>
              <button
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 shrink-0"
              >
                Concluir e Ver Biblioteca
              </button>
            </div>
          )}

          {/* Banner when existing database exercises had images auto-updated */}
          {autoUpdatedCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between gap-3 text-teal-300 text-xs sm:text-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  <strong>{autoUpdatedCount} exercício(s)</strong> do seu banco de dados que estavam sem imagem tiveram suas referências visuais encontradas pela API e atualizadas automaticamente!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoUpdatedCount(0)}
                className="text-teal-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Results Header and Batch Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="font-bold text-white">Resultados:</span>
              <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-emerald-400 font-semibold">
                {searchResults.length} exercícios
              </span>
              <span className="flex items-center gap-1.5 text-neutral-400 text-[11px] bg-neutral-900 px-2 py-0.5 rounded-lg border border-neutral-800">
                {searchSource === 'google' ? (
                  <>
                    <GoogleIcon className="w-3 h-3" />
                    <span>Conectado ao Google Search</span>
                  </>
                ) : searchSource === 'github' ? (
                  <>
                    <Github className="w-3 h-3 text-purple-400" />
                    <span>GitHub DB (🇧🇷 Traduzido Automaticamente)</span>
                  </>
                ) : searchSource === 'gemini' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>IA Biomecânica FitPro</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 text-teal-400" />
                    <span>Enciclopédia FitPro</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllNew}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Selecionar Todos
              </button>
              <span className="text-neutral-700">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                Desmarcar
              </button>
            </div>
          </div>

          {/* Google Search Queries Grounding Banner */}
          {webSearchQueries.length > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-blue-950/20 border border-blue-800/40 text-blue-300 text-[11px] flex items-center gap-2">
              <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Pesquisas no Google realizadas:</strong> {webSearchQueries.join(' • ')}
              </span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
              {searchMode === 'google' ? (
                <div className="relative">
                  <Loader2 className="w-9 h-9 text-blue-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GoogleIcon className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              )}
              <div className="text-center space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-neutral-200">
                  {searchMode === 'google' 
                    ? 'Pesquisando em tempo real no Google e estruturando biomecânica...' 
                    : 'Buscando exercícios na internet com inteligência biomecânica...'}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Analisando grupos musculares, postura correta e recomendações de treino
                </p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-16 text-center border border-neutral-800 rounded-3xl bg-[#141922] space-y-3">
              <Dumbbell className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhum resultado encontrado</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Tente buscar por termos mais amplos no Google como "pernas", "costas", "halteres" ou clique em uma das sugestões acima.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('google');
                  executeSearch(searchTerm || 'exercícios musculação', 'Todos', 'Todos', 'google');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold hover:bg-blue-500/30 transition-colors"
              >
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>Tentar Pesquisa Abrangente no Google</span>
              </button>
            </div>
          ) : (
            /* Exercise Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {searchResults.map(exercise => {
                const isAlreadyInLib = db.isExerciseInLibrary(exercise.name) || justImportedIds.has(exercise.id);
                const isSelected = selectedExerciseIds.has(exercise.id);

                return (
                  <div
                    key={exercise.id}
                    onClick={() => handleToggleSelect(exercise.id)}
                    className={`group relative flex flex-col justify-between rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-[#141920] border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    {/* Top image thumbnail */}
                    <div className="relative h-32 w-full overflow-hidden bg-neutral-900">
                      <img
                        src={getSafeImageUrl(exercise.imageUrl)}
                        alt={exercise.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141920] via-transparent to-black/40" />

                      {/* Selection Checkbox */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-black/60 border border-neutral-600 text-transparent hover:border-emerald-400'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>

                      {/* Status Tag: Already in library or New */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        {isAlreadyInLib ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-900/90 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            No Sistema
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black shadow-sm">
                            ★ Novo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5 truncate">
                            <span>{exercise.primaryMuscle}</span>
                            <span className="text-neutral-600">•</span>
                            <span className="text-neutral-400 lowercase">{exercise.equipment}</span>
                          </div>

                          {exercise.source === 'google' && (
                            <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 text-[9px]">
                              <GoogleIcon className="w-2.5 h-2.5" />
                              Google
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {exercise.name}
                        </h4>

                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {exercise.initialPosition}
                        </p>
                      </div>

                      {/* Action buttons on card: Details, Google search & Import */}
                      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                        <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                          <span>
                            {exercise.recommendedSets}x{exercise.recommendedReps}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Google Search Link Button */}
                            <button
                              type="button"
                              onClick={e => openGoogleSearchForExercise(exercise.name, e)}
                              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-[10px] font-medium transition-colors"
                              title="Ver artigos e vídeos no Google"
                            >
                              <GoogleIcon className="w-3 h-3" />
                              <span>Google</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>

                            {/* Details Button */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setPreviewExercise(exercise);
                              }}
                              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold transition-colors"
                            >
                              <Info className="w-3 h-3 text-emerald-400" />
                              Detalhes
                            </button>

                            {/* Change Photo from Web Button */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setPhotoModalExercise(exercise);
                              }}
                              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 text-blue-300 hover:text-blue-200 text-[10px] font-medium transition-colors"
                              title="Alterar foto de acordo com a web"
                            >
                              <Camera className="w-3 h-3 text-blue-400" />
                              <span>Foto</span>
                            </button>
                          </div>
                        </div>

                        {/* Individual Direct Import Button */}
                        <button
                          type="button"
                          onClick={e => handleImportSingle(exercise, e)}
                          className={`w-full py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                            isAlreadyInLib
                              ? 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
                              : 'bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-black shadow-sm'
                          }`}
                        >
                          {isAlreadyInLib ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Reimportar / Atualizar</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Importar para o Sistema</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800/80 bg-[#12161e] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-400 text-center sm:text-left flex items-center gap-2">
            <span className="font-bold text-white">{selectedExerciseIds.size}</span> exercício(s) selecionado(s) para importação em lote
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedExerciseIds.size === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Importar Selecionados ({selectedExerciseIds.size})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Detail Sub-Modal */}
      {previewExercise && (
        <ExerciseDetailModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}

      {/* Exercise Photo Alteration Modal */}
      {photoModalExercise && (
        <ExercisePhotoModal
          isOpen={!!photoModalExercise}
          exercise={photoModalExercise}
          onClose={() => setPhotoModalExercise(null)}
          onPhotoUpdated={updated => {
            setSearchResults(prev =>
              prev.map(ex => (ex.id === updated.id || ex.name === updated.name ? { ...ex, imageUrl: updated.imageUrl } : ex))
            );
            setPhotoModalExercise(null);
          }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
