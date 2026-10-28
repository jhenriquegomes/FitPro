import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="offline-status-toast"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 text-neutral-950 px-4 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-950 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-900"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo Offline — Seus treinos continuam salvos localmente.</span>
    </div>
  );
};
