import React from 'react';
import { useTranslation, setAppLanguage } from '../services/i18n';
import { AppLanguage } from '../types';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'header' | 'profile' | 'compact';
  className?: string;
  onLanguageChanged?: (lang: AppLanguage) => void;
}

export function LanguageSelector({
  variant = 'header',
  className = '',
  onLanguageChanged
}: LanguageSelectorProps) {
  const { language, setLanguage, t, isPortuguese } = useTranslation();

  const handleSelectLanguage = (newLang: AppLanguage) => {
    if (newLang === language) return;
    setLanguage(newLang);
    setAppLanguage(newLang);
    onLanguageChanged?.(newLang);
  };

  if (variant === 'header') {
    return (
      <div className={`flex items-center p-0.5 sm:p-1 rounded-xl bg-neutral-900/90 border border-neutral-800 ${className}`}>
        {/* Mobile single-tap toggle */}
        <button
          type="button"
          onClick={() => handleSelectLanguage(isPortuguese ? 'en' : 'pt-br')}
          className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 transition-all active:scale-95"
          title={isPortuguese ? 'Mudar para Inglês' : 'Switch to Portuguese'}
          aria-label="Alternar idioma"
        >
          <span className="text-sm">{isPortuguese ? '🇧🇷' : '🇺🇸'}</span>
          <span className="text-[10px] font-extrabold uppercase">{isPortuguese ? 'PT' : 'EN'}</span>
        </button>

        {/* Desktop dual buttons */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSelectLanguage('pt-br')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
              isPortuguese
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Mudar para Português (Brasil)"
            aria-label="Português do Brasil"
          >
            <span className="text-sm">🇧🇷</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider">PT-BR</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
              !isPortuguese
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Switch to English (US)"
            aria-label="English"
          >
            <span className="text-sm">🇺🇸</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider">EN</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">{t.languageSetting}</span>
          </div>
          <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {isPortuguese ? '🇧🇷 PT-BR Ativo' : '🇺🇸 EN Active'}
          </span>
        </div>
        <p className="text-neutral-400 text-xs">{t.languageSettingDesc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* PT-BR Option Card */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('pt-br')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
              isPortuguese
                ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40'
                : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇧🇷</span>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Português (Brasil)</div>
                <div className="text-[11px] text-neutral-400">Interface, treinos e IA em PT-BR</div>
              </div>
            </div>
            {isPortuguese && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* EN Option Card */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
              !isPortuguese
                ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40'
                : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">English (United States)</div>
                <div className="text-[11px] text-neutral-400">Interface, workouts and AI in English</div>
              </div>
            </div>
            {!isPortuguese && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <button
      type="button"
      onClick={() => handleSelectLanguage(isPortuguese ? 'en' : 'pt-br')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold transition-all ${className}`}
      title={isPortuguese ? 'Switch to English' : 'Mudar para Português'}
    >
      <span className="text-sm">{isPortuguese ? '🇧🇷' : '🇺🇸'}</span>
      <span>{isPortuguese ? 'PT-BR' : 'EN'}</span>
    </button>
  );
}
