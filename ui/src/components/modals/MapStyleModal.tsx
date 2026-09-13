import React, { useState, useEffect } from 'react';
import { Palette, Save, Check, Lock, Edit3, X} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const MapStyleModal: React.FC = () => {
  const {
    topology,
    activeModal,
    setActiveModal,
    updateMapMetadata,
    settings,
    setSettings,
    editMode,
    setEditMode,
  } = useMapStore();

  const [arrowstyle, setArrowstyle] = useState<'classic' | 'compact'>('classic');
  const [defaultWidth, setDefaultWidth] = useState<number>(7);
  const [defaultBw, setDefaultBw] = useState<string>('100M');
  const [canvasTheme, setCanvasTheme] = useState<'obsidian' | 'navy' | 'slate' | 'blueprint'>('obsidian');
  const [showTrafficLegend, setShowTrafficLegend] = useState<boolean>(true);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (topology?.metadata) {
      setArrowstyle(topology.metadata.arrowstyle || 'classic');
      setDefaultWidth(topology.metadata.default_link_width || 7);
      setDefaultBw(topology.metadata.default_link_bwin || '100M');
    }
    if (settings) {
      setCanvasTheme(settings.canvasTheme || 'obsidian');
      setShowTrafficLegend(settings.showTrafficLegend !== false);
    }
  }, [topology?.metadata, settings]);

  if (activeModal !== 'map_style') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMapMetadata({
      arrowstyle,
      default_link_width: defaultWidth,
      default_link_bwin: defaultBw,
      default_link_bwout: defaultBw,
    });
    setSettings({
      canvasTheme,
      showTrafficLegend,
    });
    setSavedFlash(true);
    setTimeout(() => {
      setActiveModal(null);
    }, 600);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveModal(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-stone-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Style visuel & rendu
              </h2>
              <p className="text-[11px] text-stone-400">
                Flèches, épaisseur des liaisons, thème d'ambiance et options graphiques
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View mode banner */}
        {!editMode && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Mode consultation - lecture seule</span>
            </div>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Passer en édition</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Arrowheads Style */}
          <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              Pointes de flèches Weathermap
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'classic',
                  label: 'Flèches classiques',
                  svg: (
                    <svg className="w-full h-8 mt-1.5" viewBox="0 0 120 28">
                      <line x1="10" y1="14" x2="68" y2="14" stroke="#34d399" strokeWidth="6" strokeLinecap="round" />
                      <polygon points="105,14 66,3 66,25" fill="#34d399" stroke="#34d399" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  id: 'compact',
                  label: 'Flèches compactes',
                  svg: (
                    <svg className="w-full h-8 mt-1.5" viewBox="0 0 120 28">
                      <line x1="10" y1="14" x2="88" y2="14" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
                      <polygon points="105,14 86,9 86,19" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!editMode}
                  onClick={() => setArrowstyle(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    arrowstyle === opt.id
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold ring-1 ring-amber-400/40 shadow-lg shadow-amber-950/40'
                      : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <div className="font-bold text-xs text-stone-100">{opt.label}</div>
                  {opt.svg}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Link Width & Capacity Defaults */}
          <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              Paramètres des liaisons
            </span>

            {/* Default Link Width */}
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Largeur par défaut des flèches
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={50}
                  disabled={!editMode}
                  value={defaultWidth}
                  onChange={(e) => setDefaultWidth(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 disabled:opacity-75 font-mono pr-8 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-[11px] pointer-events-none">
                  px
                </span>
              </div>
            </div>

            {/* Default Bandwidth */}
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Bande passante par défaut des nouveaux liens
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {['10M', '100M', '1G', '10G', '100G'].map((bw) => (
                  <button
                    key={bw}
                    type="button"
                    disabled={!editMode}
                    onClick={() => setDefaultBw(bw)}
                    className={`py-1.5 rounded-lg font-bold font-mono text-center border transition-all ${
                      defaultBw === bw
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {bw
                  }
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Canvas Theme & Visual Ambience */}
          <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              Thème d'ambiance du canvas
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'obsidian',
                  name: 'Obsidian',
                  color: '#0c0a09',
                  border: '#292524',
                  desc: 'Noir minéral profond & ambre',
                },
                {
                  id: 'slate',
                  name: 'Ardoise',
                  color: '#0f172a',
                  border: '#334155',
                  desc: 'Gris ardoise contemporain',
                },
                {
                  id: 'navy',
                  name: 'Navy Blue',
                  color: '#0a1128',
                  border: '#1c2541',
                  desc: 'Bleu nuit réseau profond',
                },
                {
                  id: 'blueprint',
                  name: 'Blueprint',
                  color: '#051923',
                  border: '#003554',
                  desc: 'Bleu technique d\'ingénierie',
                },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setCanvasTheme(theme.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    canvasTheme === theme.id
                      ? 'border-amber-400 bg-stone-900 ring-1 ring-amber-400/40 text-stone-100'
                      : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-lg border shrink-0 shadow-inner"
                    style={{ backgroundColor: theme.color, borderColor: theme.border }}
                  />
                  <div className="truncate">
                    <div className="font-bold text-xs truncate">{theme.name}</div>
                    <div className="text-[10px] text-stone-500 truncate">{theme.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Traffic Legend Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-stone-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrafficLegend}
                  onChange={(e) => setShowTrafficLegend(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-stone-700 text-amber-500 focus:ring-amber-400 bg-stone-950"
                />
                <span>Afficher la légende de charge réseau (Traffic Load)</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          {editMode && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                  savedFlash
                    ? 'bg-emerald-500 text-stone-950 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-950/40'
                }`}
              >
                {savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{savedFlash ? 'Enregistré !' : 'Enregistrer le style'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
