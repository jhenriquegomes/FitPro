import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  X, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  Monitor, 
  Sparkles, 
  WifiOff, 
  Zap,
  Check
} from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'floating';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'pc'>(() => {
    if (isIOS) return 'ios';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    return 'android';
  });
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // Body scroll lock & ESC key listener for modal
  useEffect(() => {
    if (showGuideModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowGuideModal(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showGuideModal]);

  const handleOpenGuide = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowGuideModal(true);
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (success) {
          setInstalledSuccess(true);
          setTimeout(() => {
            setShowGuideModal(false);
            setInstalledSuccess(false);
          }, 2500);
        }
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const modalContent = showGuideModal && typeof document !== 'undefined' ? createPortal(
    <div 
      id="pwa-guide-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => setShowGuideModal(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      <div 
        id="pwa-guide-modal"
        className="w-full max-w-lg rounded-3xl bg-[#11161d] border border-neutral-800 shadow-2xl text-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pwa-modal-title" className="text-base sm:text-lg font-black text-white">Como Baixar o FitPro (PWA)</h3>
              <p className="text-xs text-neutral-400">
                Aplicativo leve, seguro e direto na sua tela inicial
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuideModal(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Direct Install CTA banner if supported */}
          {isInstallable && (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-sm text-white block">Instalação Direta Disponível!</strong>
                  <span className="text-xs text-neutral-300">Seu navegador suporta instalação com 1 toque.</span>
                </div>
              </div>
              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-md shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
              >
                {isInstalling ? 'Instalando...' : installedSuccess ? 'Instalado!' : 'Instalar Agora'}
              </button>
            </div>
          )}

          {/* Device Selector Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-extrabold">
            <button
              onClick={() => setDeviceTab('android')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceTab === 'android' ? 'bg-emerald-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setDeviceTab('ios')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceTab === 'ios' ? 'bg-emerald-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone / iPad</span>
            </button>
            <button
              onClick={() => setDeviceTab('pc')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceTab === 'pc' ? 'bg-emerald-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Computador</span>
            </button>
          </div>

          {/* TAB CONTENT: ANDROID */}
          {deviceTab === 'android' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">Abra no Chrome ou navegador padrão</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Toque no menu de <strong>três pontinhos (⋮)</strong> no canto superior direito da tela do navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">Selecione "Instalar aplicativo"</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Procure a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                  3
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">Confirme em "Instalar"</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    O FitPro será adicionado aos seus aplicativos na tela inicial, pronto para abrir como app nativo!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: IOS (SAFARI) */}
          {deviceTab === 'ios' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">1. Toque em Compartilhar no Safari</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Abra este link no <strong>Safari</strong> e toque no botão de <strong>Compartilhar</strong> (o quadrado com a seta para cima ⬆️ na barra inferior).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">2. Adicionar à Tela de Início</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Role as opções que surgirem e toque em <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">3. Toque em "Adicionar"</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    No canto superior direito, toque em <strong>Adicionar</strong>. O ícone do FitPro estará na sua tela inicial!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PC / DESKTOP */}
          {deviceTab === 'pc' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">Ícone na barra de endereços (Chrome / Edge)</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Olhe no canto direito da barra de endereços (ao lado do ícone de estrela de favoritos) e clique no ícone de <strong>instalação de aplicativo</strong> (computador com seta para baixo).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white text-xs sm:text-sm">Ou use o menu do navegador</span>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Clique nos <strong>3 pontinhos (⋮)</strong> no canto superior do navegador &gt; <strong>"Salvar e compartilhar"</strong> &gt; <strong>"Instalar FitPro..."</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vantagens do App PWA */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-2 text-xs">
            <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Por que instalar como aplicativo PWA?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300 pt-1">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tela cheia sem barras de navegador</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Funciona 100% offline no treino</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Carregamento instantâneo</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sem ocupar espaço de armazenamento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-black/40 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            FitPro PWA • Progressive Web App
          </span>
          <button
            onClick={() => setShowGuideModal(false)}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {variant === 'header' && (
        <button
          id="pwa-install-header-btn"
          onClick={handleOpenGuide}
          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer ${className}`}
          title="Abrir guia de como baixar o FitPro (PWA)"
          aria-label="Como baixar o FitPro como App PWA"
        >
          <div className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="w-3 h-3 animate-pulse" />
          </div>
          <span className="hidden sm:inline">Baixar App (PWA)</span>
          <span className="sm:hidden">Baixar App</span>
        </button>
      )}

      {variant === 'card' && (
        <div
          id="pwa-install-card"
          className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                Instale o FitPro no seu Celular ou PC
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PWA OFFLINE
                </span>
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Acesso instantâneo pela tela de início, sem barras de navegador e com funcionamento offline completo.
              </p>
            </div>
          </div>
          <button
            id="pwa-install-card-action-btn"
            onClick={handleOpenGuide}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Como Baixar / Instalar</span>
          </button>
        </div>
      )}

      {modalContent}
    </>
  );
};
