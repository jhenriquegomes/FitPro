import React, { useState, useMemo, useDeferredValue } from 'react';
import { db } from '../services/db';
import { Exercise, MuscleGroup, EquipmentType, ExerciseLevel, FavoriteCategory, Workout } from '../types';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { ExerciseOnlineSearchModal } from '../components/ExerciseOnlineSearchModal';
import { ExercisePhotoModal } from '../components/ExercisePhotoModal';
import { SelectiveExerciseImportModal } from '../components/SelectiveExerciseImportModal';
import { ExerciseCatalogDownloadModal } from '../components/ExerciseCatalogDownloadModal';
import { updateAllLibraryPhotosFromWeb } from '../services/exercisePhotoService';
import { syncAllMissingImagesInDatabase } from '../services/exerciseSearchService';
import { importFreeExerciseDbIntoLibrary, getFreeExerciseDbStats } from '../services/freeExerciseDbService';
import { translateAllExercisesInLibrary } from '../services/workoutTranslator';
import { GoogleIcon } from '../components/GoogleIcon';
import { 
  Search, 
  Filter, 
  Dumbbell, 
  Sparkles, 
  Flame, 
  X, 
  Check, 
  Layers, 
  Globe, 
  Download, 
  CheckCircle2, 
  Camera, 
  UploadCloud, 
  Image as ImageIcon,
  Loader2,
  Github,
  ExternalLink,
  BookOpen,
  Languages,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  Play,
  Edit2
} from 'lucide-react';

interface ExerciseLibraryViewProps {
  onSelectExercise?: (exercise: Exercise) => void;
  selectedExerciseId?: string | null;
  onClearSelectedExercise?: () => void;
  onStartWorkout?: (workout: Workout) => void;
}

export function ExerciseLibraryView({
  selectedExerciseId,
  onClearSelectedExercise,
  onStartWorkout
}: ExerciseLibraryViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnlineSearchModal, setShowOnlineSearchModal] = useState(false);
  const [showSelectiveImportModal, setShowSelectiveImportModal] = useState(false);
  const [showCatalogDownloadModal, setShowCatalogDownloadModal] = useState(false);
  const [onlineSearchInitialQuery, setOnlineSearchInitialQuery] = useState('');
  const [onlineSearchInitialMode, setOnlineSearchInitialMode] = useState<'google' | 'auto'>('google');
  const [importedToastMessage, setImportedToastMessage] = useState<string | null>(null);
  const [photoModalExercise, setPhotoModalExercise] = useState<Exercise | null>(null);

  const allExercises = useMemo(() => db.getExercises(), [refreshKey]);
  const muscleGroups = useMemo(() => db.getMuscleGroups(), []);
  const equipmentList = useMemo(() => db.getEquipment(), []);

  const favoriteExercises = useMemo(() => {
    return allExercises.filter(ex => !!ex.isFavorite);
  }, [allExercises]);

  const favoriteCategoryNames = useMemo(() => {
    return db.getFavoriteCategoryNames();
  }, [refreshKey]);

  const favCategoryCounts = useMemo(() => {
    const counts: Record<FavoriteCategory, number> = { A: 0, B: 0, C: 0, D: 0 };
    favoriteExercises.forEach(ex => {
      const cat = (ex.favoriteCategory || 'A') as FavoriteCategory;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [favoriteExercises]);

  // Favorite categories state
  const [selectedFavCategory, setSelectedFavCategory] = useState<'TODOS' | FavoriteCategory>('TODOS');
  const [editingCategory, setEditingCategory] = useState<FavoriteCategory | null>(null);
  const [catRenameInput, setCatRenameInput] = useState('');

  const handleSaveCategoryName = (cat: FavoriteCategory) => {
    if (catRenameInput.trim()) {
      db.updateFavoriteCategoryName(cat, catRenameInput.trim());
      setRefreshKey(k => k + 1);
      setImportedToastMessage(`Categoria ${cat} renomeada para "${catRenameInput.trim()}"!`);
      setTimeout(() => setImportedToastMessage(null), 3000);
    }
    setEditingCategory(null);
  };

  const handleChangeExerciseCategory = (exerciseId: string, category: FavoriteCategory) => {
    db.setExerciseFavoriteCategory(exerciseId, category);
    setRefreshKey(k => k + 1);
    const catName = favoriteCategoryNames[category] || `Favorito ${category}`;
    setImportedToastMessage(`Exercício movido para categoria ${category} (${catName})!`);
    setTimeout(() => setImportedToastMessage(null), 2500);
  };

  const handleStartFavoriteAsFreeWorkout = (cat?: FavoriteCategory) => {
    const targetCat = cat || (selectedFavCategory === 'TODOS' ? undefined : selectedFavCategory);
    const workout = db.createWorkoutFromFavorites(targetCat);
    if (!workout.exercises || workout.exercises.length === 0) {
      const catLabel = targetCat ? (favoriteCategoryNames[targetCat] || `Favorito ${targetCat}`) : 'Favoritos';
      setImportedToastMessage(`Nenhum exercício encontrado na categoria ${catLabel}. Adicione exercícios clicando nas categorias [A, B, C, D] nos cards!`);
      setTimeout(() => setImportedToastMessage(null), 4500);
      return;
    }
    if (onStartWorkout) {
      onStartWorkout(workout);
    } else {
      setImportedToastMessage(`Treino preparado com ${workout.exercises.length} exercícios!`);
      setTimeout(() => setImportedToastMessage(null), 3000);
    }
  };

  const [isSyncingImages, setIsSyncingImages] = useState(false);

  const handleSyncAllWebPhotos = async () => {
    setIsSyncingImages(true);
    try {
      const syncResult = await syncAllMissingImagesInDatabase();
      const photoResult = updateAllLibraryPhotosFromWeb();
      const totalUpdated = Math.max(syncResult.updated, photoResult.updatedCount);
      setRefreshKey(k => k + 1);
      setImportedToastMessage(
        totalUpdated > 0
          ? `${totalUpdated} fotos de exercícios foram encontradas e sincronizadas automaticamente!`
          : `Todas as fotos da biblioteca estão verificadas e atualizadas!`
      );
    } catch {
      const result = updateAllLibraryPhotosFromWeb();
      setRefreshKey(k => k + 1);
      setImportedToastMessage(`${result.updatedCount} fotos de exercícios foram atualizadas com sucesso!`);
    } finally {
      setIsSyncingImages(false);
      setTimeout(() => {
        setImportedToastMessage(null);
      }, 6000);
    }
  };

  // Search & Filter state with deferred value to prevent smartphone keystroke freeze
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');
  const [selectedLevel, setSelectedLevel] = useState<string>('Todos');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'todos' | 'custom'>('todos');

  // Virtualized/Batched pagination state for smooth mobile performance
  const [pageSize, setPageSize] = useState<number>(18);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [visibleCount, setVisibleCount] = useState<number>(18);
  const [isImportingFreeDb, setIsImportingFreeDb] = useState(false);

  // Active detail modal
  const [activeModalExercise, setActiveModalExercise] = useState<Exercise | null>(() => {
    if (selectedExerciseId) {
      return db.getExerciseById(selectedExerciseId) || null;
    }
    return null;
  });

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isNowFav = db.toggleExerciseFavorite(id);
    setRefreshKey(k => k + 1);
    const targetEx = allExercises.find(ex => ex.id === id);
    const nameStr = targetEx ? ` "${targetEx.name}"` : '';
    setImportedToastMessage(
      isNowFav
        ? `⭐ Exercício${nameStr} adicionado aos Meus Favoritos!`
        : `Exercício${nameStr} removido dos favoritos.`
    );
    setTimeout(() => setImportedToastMessage(null), 3500);
  };

  const handleTranslateAllExercisesToPt = () => {
    const { translatedCount } = translateAllExercisesInLibrary('pt-br');
    setRefreshKey(k => k + 1);
    setImportedToastMessage(`🇧🇷 ${translatedCount} exercícios traduzidos para Português (PT-BR) com sucesso!`);
    setTimeout(() => setImportedToastMessage(null), 6000);
  };

  const githubExercisesCount = useMemo(() => {
    return allExercises.filter(ex => ex.id?.startsWith('fedb-') || (ex.sourceUrl && ex.sourceUrl.includes('free-exercise-db'))).length;
  }, [allExercises]);

  const customExercisesCount = useMemo(() => {
    return allExercises.filter(ex => !ex.id?.startsWith('fedb-') && !(ex.sourceUrl && ex.sourceUrl.includes('free-exercise-db'))).length;
  }, [allExercises]);
  const isFreeDbActive = githubExercisesCount > 0;

  // Optimize & clean unneeded exercises from phone
  const handleOptimizeLibrary = () => {
    const { removedCount, remainingCount } = db.cleanupUnusedExercises();
    setRefreshKey(k => k + 1);
    setCurrentPage(1);
    setVisibleCount(18);
    setImportedToastMessage(
      removedCount > 0
        ? `⚡ Memória otimizada! ${removedCount} exercícios não utilizados foram removidos. Restam ${remainingCount} essenciais e de seus treinos.`
        : `Sua biblioteca já está leve e otimizada (${remainingCount} exercícios ativos)!`
    );
    setTimeout(() => setImportedToastMessage(null), 6000);
  };

  const handleImportFreeDb = async () => {
    setIsImportingFreeDb(true);
    try {
      const res = await importFreeExerciseDbIntoLibrary({ autoTranslate: true });
      setRefreshKey(k => k + 1);
      setImportedToastMessage(
        res.added > 0
          ? `🇧🇷 ${res.added} novos exercícios importados e traduzidos para PT-BR! Total na biblioteca: ${res.total}`
          : `🇧🇷 Repertório sincronizado com sucesso! Total: ${res.total} exercícios disponíveis.`
      );
    } catch (e) {
      console.error('Error importing Free Exercise DB:', e);
      setImportedToastMessage('Erro ao importar repertório completo.');
    } finally {
      setIsImportingFreeDb(false);
      setTimeout(() => {
        setImportedToastMessage(null);
      }, 7000);
    }
  };

  // High performance filtered exercises with deferred search string
  const filteredExercises = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    return allExercises.filter(ex => {
      const isGithub = ex.id?.startsWith('fedb-') || (ex.sourceUrl && ex.sourceUrl.includes('free-exercise-db'));

      if (query) {
        const nameMatch = ex.name.toLowerCase().includes(query);
        const muscleMatch = ex.primaryMuscle.toLowerCase().includes(query);
        const equipMatch = ex.equipment.toLowerCase().includes(query);
        const secMatch = (ex.secondaryMuscles || []).some(m => m.toLowerCase().includes(query));
        if (!nameMatch && !muscleMatch && !equipMatch && !secMatch) {
          return false;
        }
      }

      if (selectedMuscle !== 'Todos' && ex.primaryMuscle !== selectedMuscle) return false;
      if (selectedEquipment !== 'Todos' && ex.equipment !== selectedEquipment) return false;
      if (selectedLevel !== 'Todos' && ex.level !== selectedLevel) return false;
      
      if (favoritesOnly) {
        if (!ex.isFavorite) return false;
        if (selectedFavCategory !== 'TODOS') {
          const exCat = ex.favoriteCategory || 'A';
          if (exCat !== selectedFavCategory) return false;
        }
      }

      if (selectedSourceFilter === 'custom' && isGithub) return false;

      return true;
    });
  }, [allExercises, deferredSearchTerm, selectedMuscle, selectedEquipment, selectedLevel, favoritesOnly, selectedFavCategory, selectedSourceFilter]);

  // Virtualized/Batched pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / pageSize));
  
  // Guard against out of bounds currentPage when filters change
  const activePage = Math.min(currentPage, totalPages);

  const paginatedExercises = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredExercises.slice(start, start + pageSize);
  }, [filteredExercises, activePage, pageSize]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedMuscle('Todos');
    setSelectedEquipment('Todos');
    setSelectedLevel('Todos');
    setFavoritesOnly(false);
    setSelectedSourceFilter('todos');
    setCurrentPage(1);
    setVisibleCount(18);
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedMuscle !== 'Todos' || 
    selectedEquipment !== 'Todos' || 
    selectedLevel !== 'Todos' || 
    favoritesOnly || 
    selectedSourceFilter !== 'todos';

  return (
    <div id="exercise-library-view" className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enciclopédia FitPro</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Biblioteca de Exercícios</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Aprenda a biomecânica correta e importe apenas os exercícios que você precisa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Exercise Catalog Downloader Button (Por Músculos, Equipamentos ou Completo) */}
          <button
            id="btn-download-catalog-exercises"
            onClick={() => setShowCatalogDownloadModal(true)}
            className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            title="Baixar catálogo de exercícios por grupos musculares, tipo de equipamento ou completo"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Baixar Catálogo (Músculos / Equipamentos / Completo)</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-black text-[10px] font-black uppercase">Novo</span>
          </button>

          {/* Dedicated Google Search & Import Button */}
          <button
            id="btn-search-google-exercises"
            onClick={() => {
              setOnlineSearchInitialQuery(searchTerm);
              setOnlineSearchInitialMode('google');
              setShowOnlineSearchModal(true);
            }}
            className="flex items-center gap-2 py-2.5 px-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-blue-500/40 hover:border-blue-400 text-white text-xs sm:text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            title="Pesquisar exercícios em tempo real no Google e importar"
          >
            <GoogleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Buscar no Google</span>
            <span className="sm:hidden">Google</span>
          </button>

          {/* Quick Memory Optimizer Button (If user has high exercise count on phone) */}
          {allExercises.length > 55 && (
            <button
              id="btn-optimize-library"
              onClick={handleOptimizeLibrary}
              className="flex items-center gap-1.5 py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Otimizar memória removendo exercícios não utilizados do telefone"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Otimizar Memória</span>
            </button>
          )}

          {/* Translate English Exercises Button */}
          <button
            id="btn-translate-exercises-pt"
            onClick={handleTranslateAllExercisesToPt}
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-all cursor-pointer"
            title="Traduzir nomes dos exercícios em inglês para Português (PT-BR)"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Traduzir PT-BR</span>
          </button>
        </div>
      </div>

      {/* Toast Notification when exercises are imported */}
      {importedToastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-300 shadow-lg shadow-emerald-950/50">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{importedToastMessage}</span>
          </div>
          <button
            onClick={() => setImportedToastMessage(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selective Download & Repository Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#161a24] via-[#12161f] to-[#0d1117] border border-neutral-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white">Catálogo de 876 Exercícios Disponíveis</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                {allExercises.length} Ativos no seu App
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-300" />
                Anti-Travamento Mobile Ativo
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Para manter seu celular rápido e sem travamentos, você pode escolher e baixar <strong>somente os exercícios que deseja</strong> ou exportar a lista selecionada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => setShowCatalogDownloadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer active:scale-95"
            title="Baixar por grupos musculares, tipo de equipamento ou catálogo completo"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Catálogo (Músculos / Equipamentos)</span>
          </button>

          <button
            onClick={() => setShowSelectiveImportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            title="Escolha individual por lista manual de exercícios"
          >
            <span>Seleção Manual</span>
          </button>

          {allExercises.length > 55 && (
            <button
              onClick={handleOptimizeLibrary}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
              title="Limpar exercícios excedentes e liberar espaço"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Otimizar</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-3">
        {/* Source Filter Tabs */}
        <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-neutral-800/80">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider pr-1">Catálogo:</span>
          <button
            onClick={() => {
              setSelectedSourceFilter('todos');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedSourceFilter === 'todos'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-purple-400" />
            <span>GitHub Free Exercise DB ({allExercises.length})</span>
          </button>
          {customExercisesCount > 0 && (
            <button
              onClick={() => {
                setSelectedSourceFilter('custom');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedSourceFilter === 'custom'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-neutral-400 hover:text-emerald-300'
              }`}
            >
              Criados por Mim ({customExercisesCount})
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar exercício por nome, músculo ou equipamento..."
              className="w-full py-2.5 pl-10 pr-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-white focus:outline-hidden focus:border-emerald-500 placeholder:text-neutral-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-3 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick filter triggers */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedEquipment}
              onChange={e => {
                setSelectedEquipment(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 sm:flex-none py-2.5 px-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="Todos">Equipamento: Todos</option>
              {equipmentList.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={e => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 sm:flex-none py-2.5 px-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="Todos">Nível: Todos</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>

            <button
              onClick={() => {
                setFavoritesOnly(!favoritesOnly);
                setCurrentPage(1);
              }}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                favoritesOnly 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Filtrar favoritos"
            >
              ★ Favoritos
            </button>
          </div>
        </div>

        {/* Muscle Groups Horizontal Scroll Bar with "⭐ Meus Favoritos" Category */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {/* ⭐ Meus Favoritos Category Tab */}
          <button
            id="tab-category-my-favorites"
            onClick={() => {
              setFavoritesOnly(!favoritesOnly);
              setSelectedMuscle('Todos');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              favoritesOnly
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30 scale-105 font-black'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-500/40 hover:border-amber-400'
            }`}
            title="Acessar rapidamente meus exercícios favoritos"
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-black stroke-black' : 'fill-amber-400 stroke-amber-400'}`} />
            <span>Meus Favoritos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              favoritesOnly ? 'bg-black/25 text-black' : 'bg-amber-400/20 text-amber-300'
            }`}>
              {favoriteExercises.length}
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedMuscle('Todos');
              setFavoritesOnly(false);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedMuscle === 'Todos' && !favoritesOnly
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todos os Músculos
          </button>

          {muscleGroups.map(muscle => (
            <button
              key={muscle}
              onClick={() => {
                setSelectedMuscle(muscle);
                setFavoritesOnly(false);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedMuscle === muscle && !favoritesOnly
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
            <span>{filteredExercises.length} exercícios encontrados com os filtros</span>
            <button
              onClick={clearAllFilters}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Dedicated Favorites Management & Play Bar when in Meus Favoritos mode */}
      {favoritesOnly && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#181c26] to-[#10141d] border border-amber-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                  Categorias de Favoritos (A, B, C, D)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold border border-amber-500/30">
                  {favoriteExercises.length} exercícios
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Organize seus favoritos em blocos A, B, C ou D, renomeie como preferir e inicie diretamente como Treino Livre no cronômetro.
              </p>
            </div>

            {/* Direct Play Free Workout Button */}
            <button
              id="btn-play-favorites-free-workout"
              onClick={() => handleStartFavoriteAsFreeWorkout()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              title="Iniciar os exercícios desta categoria como Treino Livre (aguardando play)"
            >
              <Play className="w-4 h-4 fill-black stroke-black" />
              <span>Iniciar como Treino Livre</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/25 text-black uppercase font-mono font-bold">
                {selectedFavCategory === 'TODOS' ? 'Todos' : favoriteCategoryNames[selectedFavCategory]}
              </span>
            </button>
          </div>

          {/* Category Tabs with Rename Options */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {/* Tab: Todos */}
            <button
              onClick={() => {
                setSelectedFavCategory('TODOS');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFavCategory === 'TODOS'
                  ? 'bg-amber-400 text-black shadow-md font-black'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
              }`}
            >
              Todos os Favoritos ({favoriteExercises.length})
            </button>

            {/* Tabs: A, B, C, D */}
            {(['A', 'B', 'C', 'D'] as FavoriteCategory[]).map(cat => {
              const isSelected = selectedFavCategory === cat;
              const catName = favoriteCategoryNames[cat] || `Favorito ${cat}`;
              const count = favCategoryCounts[cat] || 0;
              const isEditing = editingCategory === cat;

              if (isEditing) {
                return (
                  <div key={cat} className="flex items-center gap-1.5 bg-neutral-900 border border-amber-400 px-2.5 py-1.5 rounded-xl shrink-0 shadow-lg">
                    <span className="text-xs font-black text-amber-400 font-mono">{cat}:</span>
                    <input
                      type="text"
                      value={catRenameInput}
                      onChange={e => setCatRenameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveCategoryName(cat);
                        if (e.key === 'Escape') setEditingCategory(null);
                      }}
                      autoFocus
                      className="bg-black text-white text-xs px-2.5 py-1 rounded-lg border border-neutral-700 outline-none w-36 font-semibold"
                      placeholder={`Nome categoria ${cat}`}
                    />
                    <button
                      onClick={() => handleSaveCategoryName(cat)}
                      className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition-colors cursor-pointer"
                      title="Salvar nome"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={cat}
                  className={`flex items-center rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md font-black'
                      : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedFavCategory(cat);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 flex items-center gap-1.5 cursor-pointer"
                    title={`Filtrar por ${catName}`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      isSelected ? 'bg-black text-amber-300 font-black' : 'bg-neutral-800 text-amber-400 font-bold'
                    }`}>
                      {cat}
                    </span>
                    <span>{catName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-black/25 text-black font-extrabold' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                      setCatRenameInput(catName);
                    }}
                    className={`p-1.5 pr-2.5 transition-colors cursor-pointer ${
                      isSelected ? 'text-black/70 hover:text-black' : 'text-neutral-500 hover:text-amber-400'
                    }`}
                    title={`Renomear ${catName}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Access Shelf for Favorites when in general browse mode */}
      {favoriteExercises.length > 0 && !favoritesOnly && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/25 via-[#141922] to-neutral-900 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Meus Favoritos ({favoriteExercises.length})
              </span>
              <span className="text-[11px] text-neutral-400 hidden sm:inline">• Acesso rápido aos mais utilizados</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartFavoriteAsFreeWorkout()}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30"
                title="Iniciar todos os favoritos como treino livre"
              >
                <Play className="w-3 h-3 fill-emerald-400" />
                <span>Treino Livre</span>
              </button>
              <button
                onClick={() => {
                  setFavoritesOnly(true);
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver Todos ({favoriteExercises.length}) →
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {favoriteExercises.slice(0, 10).map(fav => (
              <button
                key={fav.id}
                onClick={() => setActiveModalExercise(fav)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 hover:border-amber-400 text-left transition-all shrink-0 cursor-pointer group shadow-xs"
              >
                <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-300 truncate max-w-[150px]">
                  {fav.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 font-mono">
                  {fav.primaryMuscle}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pagination & Count Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>
            Exibindo <strong className="text-white">{paginatedExercises.length}</strong> de <strong className="text-emerald-400">{filteredExercises.length}</strong> exercícios
          </span>
          <span>·</span>
          <span>Página {activePage} de {totalPages}</span>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">Exibir por página:</span>
          {[18, 36, 72].map(size => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                pageSize === size
                  ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40'
                  : 'text-neutral-400 hover:text-white bg-neutral-900/60'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Exercise Cards */}
      {filteredExercises.length === 0 ? (
        <div className="py-16 text-center border border-neutral-800 rounded-3xl bg-[#12161c] space-y-4 p-6">
          {favoritesOnly ? (
            <>
              <Star className="w-12 h-12 text-amber-400 mx-auto fill-amber-400/20 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {selectedFavCategory !== 'TODOS'
                    ? `Nenhum exercício na categoria ${favoriteCategoryNames[selectedFavCategory]}`
                    : 'Nenhum exercício favorito ainda'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {selectedFavCategory !== 'TODOS'
                    ? `Você pode categorizar qualquer um dos seus favoritos clicando nas pílulas [A, B, C, D] nos cards!`
                    : 'Toque na estrela (★) em qualquer exercício da biblioteca para favoritá-lo e organizá-lo em suas categorias A, B, C, D!'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {selectedFavCategory !== 'TODOS' && (
                  <button
                    onClick={() => {
                      setSelectedFavCategory('TODOS');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 transition-all cursor-pointer shadow-md"
                  >
                    Ver Todos os Favoritos ({favoriteExercises.length})
                  </button>
                )}
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 transition-all cursor-pointer shadow-md"
                >
                  Explorar Todos os Exercícios
                </button>
              </div>
            </>
          ) : (
            <>
              <Dumbbell className="w-12 h-12 text-neutral-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Nenhum exercício encontrado</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Não encontramos este exercício na biblioteca. Você pode buscá-lo no catálogo de 876 itens ou na internet!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={() => setShowSelectiveImportModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Procurar no Repositório de 876 Exercícios</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedExercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={ex => setActiveModalExercise(ex)}
                onEditPhoto={ex => setPhotoModalExercise(ex)}
                onToggleFavorite={ex => handleToggleFavorite(ex.id)}
                onChangeCategory={(ex, cat) => handleChangeExerciseCategory(ex.id, cat)}
                categoryNames={favoriteCategoryNames}
              />
            ))}
          </div>

          {/* Pagination Navigation Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[#12161c] border border-neutral-800">
              <div className="text-xs text-neutral-400">
                Página <strong className="text-white">{activePage}</strong> de <strong className="text-white">{totalPages}</strong> (Total: {filteredExercises.length} exercícios)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-neutral-200 border border-neutral-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                {/* Direct Page Buttons */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && activePage > 3) {
                      pageNum = activePage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          activePage === pageNum
                            ? 'bg-emerald-500 text-black shadow-md font-black'
                            : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={activePage >= totalPages}
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-neutral-200 border border-neutral-800 transition-colors"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Detail Modal */}
      {activeModalExercise && (
        <ExerciseDetailModal
          exercise={activeModalExercise}
          onClose={() => {
            setActiveModalExercise(null);
            if (onClearSelectedExercise) onClearSelectedExercise();
          }}
          onToggleFavorite={id => {
            db.toggleExerciseFavorite(id);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* Exercise Catalog Downloader Modal (Por Músculos, Equipamentos ou Completo) */}
      <ExerciseCatalogDownloadModal
        isOpen={showCatalogDownloadModal}
        onClose={() => setShowCatalogDownloadModal(false)}
        onImportComplete={count => {
          setRefreshKey(k => k + 1);
          setImportedToastMessage(`${count} exercício(s) importado(s) com sucesso para a biblioteca do app!`);
          setTimeout(() => setImportedToastMessage(null), 6000);
        }}
      />

      {/* Selective Exercise Downloader Modal (Requested by User) */}
      <SelectiveExerciseImportModal
        isOpen={showSelectiveImportModal}
        onClose={() => setShowSelectiveImportModal(false)}
        onImportComplete={count => {
          setRefreshKey(k => k + 1);
          setImportedToastMessage(`${count} exercício(s) selecionado(s) importado(s) com sucesso para o seu app!`);
          setTimeout(() => setImportedToastMessage(null), 6000);
        }}
      />

      {/* Internet Exercise Search & Import Modal */}
      <ExerciseOnlineSearchModal
        isOpen={showOnlineSearchModal}
        initialQuery={onlineSearchInitialQuery}
        initialSearchMode={onlineSearchInitialMode}
        onClose={() => setShowOnlineSearchModal(false)}
        onImportSuccess={count => {
          setRefreshKey(k => k + 1);
          setImportedToastMessage(`${count} novo(s) exercício(s) importado(s) com sucesso para a sua biblioteca!`);
          setTimeout(() => {
            setImportedToastMessage(null);
          }, 6000);
        }}
      />

      {/* Exercise Photo Alteration Modal */}
      <ExercisePhotoModal
        isOpen={!!photoModalExercise}
        exercise={photoModalExercise}
        onClose={() => setPhotoModalExercise(null)}
        onPhotoUpdated={updated => {
          setRefreshKey(k => k + 1);
          setPhotoModalExercise(null);
          setImportedToastMessage(`Foto do exercício "${updated.name}" alterada com sucesso!`);
          setTimeout(() => {
            setImportedToastMessage(null);
          }, 5000);
        }}
        onAllPhotosUpdated={count => {
          setRefreshKey(k => k + 1);
          setImportedToastMessage(`${count} fotos de exercícios foram atualizadas com sucesso!`);
          setTimeout(() => {
            setImportedToastMessage(null);
          }, 6000);
        }}
      />
    </div>
  );
}
