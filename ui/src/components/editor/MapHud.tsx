import React from 'react';
import { useMapStore } from '../../store/useMapStore';

export const MapHud: React.FC = () => {
  const { topology } = useMapStore();
  if (!topology?.metadata) return null;

  const { title, width, height, datestamp } = topology.metadata;

  return (
    <div className="absolute bottom-4 right-6 z-20 pointer-events-none select-none flex items-center gap-2 bg-stone-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-900/40 shadow-xl text-[11px] font-mono text-stone-300">
      <span className="font-bold text-amber-300">{title || 'Network Map'}</span>
      <span className="text-stone-600">•</span>
      <span className="text-stone-300 font-medium">{width || 800} × {height || 600} px</span>
      {datestamp && (
        <>
          <span className="text-stone-600">•</span>
          <span className="text-stone-400 truncate max-w-[220px]">{datestamp}</span>
        </>
      )}
    </div>
  );
};
