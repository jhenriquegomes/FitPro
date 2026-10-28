import { db } from '../services/db';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  Flame, 
  BarChart3, 
  Trophy 
} from 'lucide-react';

interface ProUpgradeModalProps {
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

export function ProUpgradeModal({ onClose, onUpgradeSuccess }: ProUpgradeModalProps) {
  const currentUser = db.getCurrentUser();

  const handleTogglePro = () => {
    db.updateUser(currentUser.id, { isPro: !currentUser.isPro });
    if (onUpgradeSuccess) onUpgradeSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="pro-upgrade-modal"
        className="relative w-full max-w-lg my-6 bg-[#10141a] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white text-center animate-in fade-in zoom-in-95"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-16 h-16 rounded-2xl bg-radial from-amber-500/20 to-amber-950/40 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <Crown className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
            FitPro Premium
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Desbloqueie o FitPro PRO
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Eleve seus treinos ao nível profissional com recursos avançados de métricas, recordes e inteligência artificial
          </p>
        </div>

        {/* Comparison card */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left space-y-2.5 text-xs">
          {[
            { text: 'Treinos e rotinas semanais ilimitadas', icon: Zap },
            { text: 'Histórico detalhado completo com exportação de dados', icon: Flame },
            { text: 'Gráficos avançados de evolução e volume muscular', icon: BarChart3 },
            { text: 'Rastreador inteligente de Recordes Pessoais (PRs)', icon: Trophy },
            { text: 'Gerador Automático de Rotinas Personalizadas', icon: Sparkles },
            { text: 'Experiência 100% limpa e sem anúncios', icon: Check }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-neutral-200">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing placeholder */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
          <div className="text-left">
            <div className="text-xs text-neutral-400 font-medium">Status da Conta:</div>
            <div className="text-sm font-bold text-white">
              {currentUser.isPro ? 'Plano FitPro PRO Ativo 🌟' : 'Plano Gratuito'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-mono font-bold">R$ 0,00 (Demonstração)</div>
            <div className="text-[10px] text-neutral-500">Sem cobrança ativa</div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleTogglePro}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/20 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <Crown className="w-5 h-5" />
          {currentUser.isPro ? 'DESATIVAR MODO PRO (TESTE)' : 'ATIVAR FITPRO PRO GRATUITAMENTE'}
        </button>
      </div>
    </div>
  );
}
