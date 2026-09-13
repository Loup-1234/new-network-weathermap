import React from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const CanvasControls: React.FC = () => {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
  const { x, y, zoom } = useViewport();
  const cursorPos = useMapStore((s) => s.cursorPos);
  const editMode = useMapStore((s) => s.editMode);
  const settings = useMapStore((s) => s.settings);

  const handleResetZoom = () => {
    setViewport({ x, y, zoom: 1 }, { duration: 300 });
  };

  const handleFit = () => {
    fitView({ padding: 0.15, duration: 400 });
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-6 left-6 z-40 flex items-center gap-1.5 bg-stone-950/90 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl">
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={() => zoomOut({ duration: 250 })}
        className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 active:bg-stone-700 transition-colors border border-transparent hover:border-stone-700"
        title="Zoom arrière"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Current Zoom Level / Reset to 100% */}
      <button
        type="button"
        onClick={handleResetZoom}
        className="h-8 px-2.5 flex items-center justify-center rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors min-w-[58px] text-center"
        title="Réinitialiser le zoom à 100%"
      >
        {zoomPercent}%
      </button>

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={() => zoomIn({ duration: 250 })}
        className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 active:bg-stone-700 transition-colors border border-transparent hover:border-stone-700"
        title="Zoom avant"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-stone-800 mx-0.5" />

      {/* Fit View Button */}
      <button
        type="button"
        onClick={handleFit}
        className="h-8 px-3 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 active:bg-stone-700 transition-colors border border-transparent hover:border-stone-700"
        title="Ajuster la carte à l'écran"
      >
        <Maximize2 className="w-4 h-4 text-amber-400" />
        <span>Fit</span>
      </button>

      {/* Reset Position */}
      <button
        type="button"
        onClick={() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 400 })}
        className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        title="Réinitialiser à l'origine"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-stone-800 mx-0.5" />

      {/* Coordinates on map (X, Y) rounded to integer */}
      <div
        className="h-8 px-3 flex items-center justify-center rounded-xl bg-stone-900 border border-stone-800 font-mono text-[11px] text-stone-300 font-semibold select-none min-w-[92px] text-center tabular-nums"
        title="Position du curseur X, Y"
      >
        {Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}
      </div>

      {/* Visual Grid Size Indicator (Active exclusively in Edit Mode) */}
      {editMode && (
        <>
          <div className="h-4 w-[1px] bg-stone-800 mx-0.5" />
          <div
            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-xl border text-[11px] font-mono font-bold select-none transition-all ${
              (settings.gridSnap || 0) > 0
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
            title={`Grille d'édition : ${(settings.gridSnap || 0) > 0 ? `${settings.gridSnap}px` : 'Désactivée'}`}
          >
            <Grid className="w-3.5 h-3.5 text-amber-400" />
            <span>{(settings.gridSnap || 0) > 0 ? `Grille ${settings.gridSnap}px` : 'Grille off'}</span>
          </div>
        </>
      )}
    </div>
  );
};
