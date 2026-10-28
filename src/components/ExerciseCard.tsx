import React from 'react';
import { Exercise, FavoriteCategory } from '../types';
import { Dumbbell, Plus, Info, Camera, Star } from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';
import { getSafeImageUrl } from '../services/imageUtils';

interface ExerciseCardProps {
  key?: React.Key;
  exercise: Exercise;
  onViewDetails: (exercise: Exercise) => void;
  onQuickAdd?: (exercise: Exercise) => void;
  onEditPhoto?: (exercise: Exercise) => void;
  onToggleFavorite?: (exercise: Exercise) => void;
  onChangeCategory?: (exercise: Exercise, category: FavoriteCategory) => void;
  categoryNames?: Record<FavoriteCategory, string>;
}

export function ExerciseCard({ 
  exercise, 
  onViewDetails, 
  onQuickAdd, 
  onEditPhoto,
  onToggleFavorite,
  onChangeCategory,
  categoryNames
}: ExerciseCardProps) {
  const isFav = !!exercise.isFavorite;

  return (
    <div 
      className={`group relative flex flex-col justify-between bg-[#141920] border rounded-xl overflow-hidden transition-all ${
        isFav 
          ? 'border-amber-500/50 shadow-md shadow-amber-500/5 hover:border-amber-400' 
          : 'border-neutral-800/90 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5'
      }`}
    >
      {/* Exercise Image Thumbnail */}
      <div 
        onClick={() => onViewDetails(exercise)}
        className="relative h-40 w-full overflow-hidden bg-neutral-900 cursor-pointer"
      >
        <img 
          src={getSafeImageUrl(exercise.imageUrl)} 
          alt={exercise.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141920] via-transparent to-black/30"></div>
        
        {/* Muscle Badge */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-black shadow-sm">
          {exercise.primaryMuscle}
        </span>

        {/* Favorite Star Button on image overlay */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(exercise);
            }}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer z-10 ${
              isFav
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 scale-105'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-700/80'
            }`}
            title={isFav ? 'Remover dos Meus Favoritos' : 'Adicionar aos Meus Favoritos'}
            aria-label={isFav ? `Remover ${exercise.name} dos favoritos` : `Favoritar ${exercise.name}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-black stroke-black' : 'stroke-current'}`} />
          </button>
        )}

        {/* Google / Web Source Badge if imported */}
        {exercise.source === 'google' && (
          <span 
            className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-950/90 text-blue-300 border border-blue-500/40 backdrop-blur-xs shadow-md"
            title="Importado via Google Search"
          >
            <GoogleIcon className="w-2.5 h-2.5" />
            <span>Google</span>
          </span>
        )}

        {/* Level */}
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-900/80 text-neutral-300 backdrop-blur-xs border border-neutral-700">
          {exercise.level}
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 
              onClick={() => onViewDetails(exercise)}
              className={`text-sm font-bold cursor-pointer transition-colors line-clamp-1 ${
                isFav ? 'text-amber-200 hover:text-amber-100' : 'text-white hover:text-emerald-400'
              }`}
            >
              {exercise.name}
            </h3>
            {isFav && (
              <span className="text-amber-400 text-xs shrink-0" title="Exercício Favoritado">★</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-400">
            <Dumbbell className="w-3.5 h-3.5 text-neutral-500" />
            <span className="truncate">{exercise.equipment}</span>
            <span className="text-neutral-600">•</span>
            <span>{exercise.recommendedSets}x{exercise.recommendedReps}</span>
          </div>

          {/* Favorite Category Tag & Quick Switcher */}
          {isFav && (
            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0">Cat:</span>
              <div className="flex items-center gap-1">
                {(['A', 'B', 'C', 'D'] as FavoriteCategory[]).map(cat => {
                  const isCurrentCat = (exercise.favoriteCategory || 'A') === cat;
                  const catLabel = categoryNames?.[cat] || `Favorito ${cat}`;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onChangeCategory) onChangeCategory(exercise, cat);
                      }}
                      className={`w-5 h-5 rounded-md text-[10px] font-mono font-black flex items-center justify-center transition-all cursor-pointer ${
                        isCurrentCat
                          ? 'bg-amber-400 text-black shadow-xs scale-105'
                          : 'bg-neutral-800 text-neutral-400 hover:text-amber-300 hover:bg-neutral-700'
                      }`}
                      title={`Mover para ${catLabel}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-amber-300/80 truncate font-semibold ml-auto max-w-[85px]">
                {categoryNames?.[exercise.favoriteCategory || 'A'] || `Favorito ${exercise.favoriteCategory || 'A'}`}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3.5 pt-2.5 border-t border-neutral-800/80">
          <button
            onClick={() => onViewDetails(exercise)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            Detalhes
          </button>

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(exercise);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isFav
                  ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 hover:bg-amber-400/30'
                  : 'bg-neutral-800/80 border-transparent hover:bg-neutral-700 text-neutral-400 hover:text-amber-300'
              }`}
              title={isFav ? 'Remover dos favoritos' : 'Favoritar exercício'}
              aria-label={`Favoritar ${exercise.name}`}
            >
              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-300 stroke-amber-300' : 'stroke-current'}`} />
            </button>
          )}

          {onEditPhoto && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditPhoto(exercise);
              }}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-blue-300 hover:text-blue-200 transition-colors cursor-pointer"
              title="Importar imagem / Alterar foto"
              aria-label={`Importar imagem de ${exercise.name}`}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
          
          {onQuickAdd && (
            <button
              onClick={() => onQuickAdd(exercise)}
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-colors cursor-pointer"
              title="Adicionar ao treino"
              aria-label={`Adicionar ${exercise.name} ao treino`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
