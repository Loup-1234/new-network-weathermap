import React from 'react';
import { Settings, Eye, Grid, Lock, Edit3, X, Save } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const EditorSettingsModal: React.FC = () => {
  const { settings, setSettings, activeModal, setActiveModal, editMode, setEditMode } = useMapStore();

  if (activeModal !== 'settings') return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveModal(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-stone-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Préférences & options
              </h2>
              <p className="text-[11px] text-stone-400">Sauvegarde automatique, grille et éléments d'affichage</p>
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
              <span>Options de visualisation</span>
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

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Autosave Toggle */}
          <div>
            <div className="flex items-center gap-2 text-stone-300 font-semibold mb-2">
              <Save className="w-4 h-4 text-amber-400" />
              <span>Sauvegarde automatique</span>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-950/80 border border-stone-800 cursor-pointer hover:border-amber-500/40 transition-colors">
              <div>
                <div className="font-bold text-stone-200">Activer la sauvegarde automatique</div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  Sauvegarde automatiquement la topologie après modification - délai de 3s d'inactivité
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => setSettings({ autoSave: e.target.checked })}
                className="w-4 h-4 rounded border-stone-700 text-amber-500 focus:ring-amber-400 bg-stone-950"
              />
            </label>
          </div>

          {/* Snap to grid */}
          {editMode && (
            <div>
              <div className="flex items-center gap-2 text-stone-300 font-semibold mb-2">
                <Grid className="w-4 h-4 text-amber-400" />
                <span>Magnétisme sur grille</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[0, 5, 10, 20, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSettings({ gridSnap: val })}
                    className={`py-2 px-2.5 rounded-xl border text-center font-medium transition-all ${
                      settings.gridSnap === val
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/40 shadow-md'
                        : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    {val === 0 ? 'Off' : `${val}px`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visual Overlays & Toggles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-300 font-semibold mb-1">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Éléments d'affichage</span>
            </div>

            {editMode && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-950/80 border border-stone-800 cursor-pointer hover:border-amber-500/40 transition-colors">
                <div>
                  <div className="font-bold text-stone-200">Afficher les pastilles de waypoints</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">Points de courbure interactifs sur les liens</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showVias}
                  onChange={(e) => setSettings({ showVias: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-700 text-amber-500 focus:ring-amber-400 bg-stone-950"
                />
              </label>
            )}

            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-950/80 border border-stone-800 cursor-pointer hover:border-amber-500/40 transition-colors">
              <div>
                <div className="font-bold text-stone-200">Repères de verrouillage relatifs</div>
                <div className="text-[11px] text-stone-400 mt-0.5">Indicateurs de positionnement dépendant des nœuds</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showRelative}
                onChange={(e) => setSettings({ showRelative: e.target.checked })}
                className="w-4 h-4 rounded border-stone-700 text-amber-500 focus:ring-amber-400 bg-stone-950"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
