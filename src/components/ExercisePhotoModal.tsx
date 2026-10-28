import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../types';
import { 
  getWebPhotoCandidatesForExercise, 
  getBestWebPhotoForExercise,
  updateExercisePhoto, 
  updateAllLibraryPhotosFromWeb,
  WebPhotoCandidate 
} from '../services/exercisePhotoService';
import { processImageFile, getSafeImageUrl } from '../services/imageUtils';
import { GoogleIcon } from './GoogleIcon';
import { 
  X, 
  Image as ImageIcon, 
  Search, 
  Check, 
  Sparkles, 
  Globe, 
  ExternalLink, 
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  Upload,
  FolderUp,
  AlertCircle,
  FileCheck,
  Link as LinkIcon
} from 'lucide-react';

interface ExercisePhotoModalProps {
  isOpen: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onPhotoUpdated: (updatedExercise: Exercise) => void;
  onAllPhotosUpdated?: (count: number) => void;
}

export function ExercisePhotoModal({
  isOpen,
  exercise,
  onClose,
  onPhotoUpdated,
  onAllPhotosUpdated
}: ExercisePhotoModalProps) {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(exercise?.imageUrl || '');
  const [candidates, setCandidates] = useState<WebPhotoCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(exercise?.name || '');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'custom'>('upload');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<{
    originalSizeKb: number;
    optimizedSizeKb: number;
    dimensions: { width: number; height: number };
    fileName: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize candidates when modal opens or exercise changes
  useEffect(() => {
    if (!exercise) return;
    setSelectedPhotoUrl(exercise.imageUrl);
    setSearchQuery(exercise.name);
    const initialCandidates = getWebPhotoCandidatesForExercise(exercise.name, exercise.primaryMuscle, 8);
    setCandidates(initialCandidates);
    setSaveSuccess(false);
    setBatchMessage(null);
    setUploadError(null);
    setUploadMeta(null);
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await processImageFile(file);
      setSelectedPhotoUrl(result.dataUrl);
      setUploadMeta({
        originalSizeKb: result.originalSizeKb,
        optimizedSizeKb: result.optimizedSizeKb,
        dimensions: result.dimensions,
        fileName: file.name
      });
      setSaveSuccess(false);
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao importar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleSearchPhotos = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = getWebPhotoCandidatesForExercise(searchQuery.trim(), exercise.primaryMuscle, 12);
    setCandidates(results);
  };

  const handleSavePhoto = () => {
    if (!selectedPhotoUrl) return;
    setIsSaving(true);
    
    const updated = updateExercisePhoto(exercise.id, selectedPhotoUrl);
    if (updated) {
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onPhotoUpdated(updated);
        onClose();
      }, 600);
    } else {
      setIsSaving(false);
    }
  };

  const handleBatchUpdateAll = () => {
    setIsBatchUpdating(true);
    try {
      const { updatedCount } = updateAllLibraryPhotosFromWeb();
      setBatchMessage(`${updatedCount} fotos de exercícios foram atualizadas com imagens da web!`);
      if (onAllPhotosUpdated) {
        onAllPhotosUpdated(updatedCount);
      }
      // Refresh current selection if it changed
      const refreshed = getBestWebPhotoForExercise(exercise.name, exercise.primaryMuscle);
      setSelectedPhotoUrl(refreshed);
    } catch {
      setBatchMessage('Erro ao atualizar fotos em lote.');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim().startsWith('http')) {
      setSelectedPhotoUrl(customUrl.trim());
      setSaveSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div 
        id="exercise-photo-modal"
        className="relative w-full max-w-2xl bg-[#12161c] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-[#151b22]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Importar & Alterar Imagem</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                  Foto do Exercício
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {exercise.name} • <span className="text-emerald-400">{exercise.primaryMuscle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Notification banner if batch updated */}
          {batchMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{batchMessage}</span>
            </div>
          )}

          {/* Current Selection & Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 items-center">
            <div className="relative h-32 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-700">
              <img 
                src={getSafeImageUrl(selectedPhotoUrl)} 
                alt="Prévia selecionada" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                Pré-visualização
              </span>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">Foto Ativa do Exercício</span>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Esta foto será exibida no card da biblioteca, na execução biomecânica e nas rotinas do <strong>{exercise.name}</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isSaving || saveSuccess}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Foto Salva!</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar e Aplicar Imagem</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent('exercicio ' + exercise.name + ' musculacao')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Abrir pesquisa de imagens no Google Imagens"
                >
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span>Google Imagens</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border border-neutral-800 bg-[#0e1217] p-1.5 gap-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Imagem (Arquivo)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Sugeridas da Web</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Link Direto (URL)</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD & DRAG-AND-DROP */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-neutral-700 hover:border-blue-500/70 bg-neutral-900/60 hover:bg-neutral-900'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className="hidden"
                />

                <div className={`p-4 rounded-2xl mb-3 ${isDragging ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  <FolderUp className="w-8 h-8" />
                </div>

                <h4 className="text-sm font-bold text-white mb-1">
                  {isDragging ? 'Solte a foto aqui agora...' : 'Clique para selecionar ou arraste sua imagem aqui'}
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Importe qualquer foto do seu computador ou celular (PNG, JPG, WEBP, GIF). A foto é otimizada automaticamente com alta nitidez.
                </p>

                {isUploading && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Otimizando e preparando imagem...</span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadMeta && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs flex items-center justify-between text-neutral-300">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">{uploadMeta.fileName}</span>
                      <span className="text-neutral-400 text-[11px]">
                        {uploadMeta.dimensions.width}×{uploadMeta.dimensions.height}px • Otimizado de {uploadMeta.originalSizeKb} KB para {uploadMeta.optimizedSizeKb} KB
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                    Pronta para salvar
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WEB GALLERY & SEARCH */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* Search bar to find more photos for this movement */}
              <form onSubmit={handleSearchPhotos} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar foto na web (ex: Barra fixa, Búlgaro, Supino)..."
                    className="w-full py-2 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar Fotos</span>
                </button>
              </form>

              {/* Candidates Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Fotos sugeridas da internet para este exercício ({candidates.length})
                  </span>
                  <span className="text-neutral-500 text-[11px]">Clique em uma foto para selecionar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {candidates.map(cand => {
                    const isSelected = selectedPhotoUrl === cand.url;
                    return (
                      <div
                        key={cand.id}
                        onClick={() => {
                          setSelectedPhotoUrl(cand.url);
                          setSaveSuccess(false);
                        }}
                        className={`group relative h-28 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected 
                            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]' 
                            : 'border-neutral-800 hover:border-neutral-600 hover:scale-[1.01]'
                        }`}
                      >
                        <img 
                          src={getSafeImageUrl(cand.thumbUrl || cand.url)} 
                          alt={cand.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                        
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-emerald-500 text-black shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-semibold text-neutral-200 truncate">
                          {cand.source}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM URL OPTION */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-neutral-200">
                    Cole o link direto de uma foto da web
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Insira o link direto de qualquer imagem da internet (terminada em .jpg, .png, .webp ou URLs públicas).
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto-do-exercicio.jpg"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Carregar Imagem
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Global Batch Update Option */}
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar Todas as Fotos da Biblioteca
              </span>
              <p className="text-[11px] text-neutral-400">
                Sincroniza todos os exercícios com as fotos de alta definição correspondentes do acervo da web.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBatchUpdateAll}
              disabled={isBatchUpdating}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 font-bold text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isBatchUpdating ? 'Atualizando...' : 'Atualizar Todas'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#151b22] border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={isSaving || saveSuccess}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Foto Selecionada</span>
          </button>
        </div>
      </div>
    </div>
  );
}

