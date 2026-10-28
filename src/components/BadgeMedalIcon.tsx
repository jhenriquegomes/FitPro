import React from 'react';
import { BadgeTier } from '../types';
import { 
  Flame, 
  Dumbbell, 
  Trophy, 
  Award, 
  Crown, 
  Zap, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Lock
} from 'lucide-react';

interface BadgeMedalIconProps {
  tier: BadgeTier;
  iconName: string;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTierBadge?: boolean;
}

const TIER_STYLES: Record<BadgeTier, {
  border: string;
  bg: string;
  gradient: string;
  text: string;
  glow: string;
  label: string;
  ribbonBg: string;
}> = {
  bronze: {
    border: 'border-amber-700/80',
    bg: 'bg-amber-950/40',
    gradient: 'from-amber-700 via-amber-800 to-amber-950',
    text: 'text-amber-500',
    glow: 'shadow-amber-800/30',
    label: 'Bronze',
    ribbonBg: 'bg-amber-700'
  },
  silver: {
    border: 'border-slate-400/80',
    bg: 'bg-slate-800/60',
    gradient: 'from-slate-300 via-slate-400 to-slate-700',
    text: 'text-slate-200',
    glow: 'shadow-slate-400/30',
    label: 'Prata',
    ribbonBg: 'bg-slate-500'
  },
  gold: {
    border: 'border-amber-400/90',
    bg: 'bg-amber-950/60',
    gradient: 'from-amber-300 via-amber-400 to-amber-600',
    text: 'text-amber-300',
    glow: 'shadow-amber-400/40',
    label: 'Ouro',
    ribbonBg: 'bg-amber-500'
  },
  platinum: {
    border: 'border-emerald-400/90',
    bg: 'bg-emerald-950/50',
    gradient: 'from-emerald-300 via-teal-400 to-emerald-600',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-400/40',
    label: 'Platina',
    ribbonBg: 'bg-emerald-500'
  }
};

export function BadgeMedalIcon({
  tier,
  iconName,
  unlocked = true,
  size = 'md',
  showTierBadge = false
}: BadgeMedalIconProps) {
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze;

  // Render matching lucide icon
  const renderIcon = (iconClass: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className={iconClass} />;
      case 'Dumbbell': return <Dumbbell className={iconClass} />;
      case 'Trophy': return <Trophy className={iconClass} />;
      case 'Award': return <Award className={iconClass} />;
      case 'Crown': return <Crown className={iconClass} />;
      case 'Zap': return <Zap className={iconClass} />;
      case 'Target': return <Target className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'CheckCircle2': return <CheckCircle2 className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  const dimensions = {
    sm: { container: 'w-10 h-10', icon: 'w-5 h-5', border: 'border-2' },
    md: { container: 'w-14 h-14', icon: 'w-7 h-7', border: 'border-2' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10', border: 'border-[3px]' },
    xl: { container: 'w-28 h-28', icon: 'w-14 h-14', border: 'border-4' }
  }[size];

  if (!unlocked) {
    return (
      <div className={`relative ${dimensions.container} rounded-full bg-neutral-900/90 border-2 border-neutral-800 flex items-center justify-center text-neutral-600`}>
        <Lock className={dimensions.icon} />
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Medal Body */}
      <div
        className={`relative ${dimensions.container} rounded-full ${dimensions.border} ${style.border} ${style.bg} bg-linear-to-br ${style.gradient} flex items-center justify-center shadow-lg ${style.glow} transition-transform group-hover:scale-105`}
      >
        {/* Inner concentric ring */}
        <div className="absolute inset-1 rounded-full border border-white/20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          {renderIcon(`${dimensions.icon} ${style.text} filter drop-shadow-md`)}
        </div>

        {/* Shiny corner highlight */}
        <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full blur-[1px] -rotate-45 pointer-events-none" />
      </div>

      {/* Optional Tier Pill */}
      {showTierBadge && (
        <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-black ${style.ribbonBg} shadow-xs`}>
          {style.label}
        </span>
      )}
    </div>
  );
}
