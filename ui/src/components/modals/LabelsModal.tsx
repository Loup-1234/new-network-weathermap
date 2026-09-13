import React, { useState, useEffect } from 'react';
import { Tag, Save, Check, Lock, Edit3, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const LabelsModal: React.FC = () => {
  const {
    topology,
    activeModal,
    setActiveModal,
    updateMapMetadata,
    updateNode,
    updateLink,
    addLabel,
    deleteNode,
    setSelectedElement,
    editMode,
    setEditMode,
  } = useMapStore();

  const [linklabels, setLinklabels] = useState<'percent' | 'bits'>('percent');
  const [nodefont, setNodefont] = useState<number>(3);
  const [linkfont, setLinkfont] = useState<number>(2);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (topology?.metadata) {
      setLinklabels(topology.metadata.linklabels === 'bits' ? 'bits' : 'percent');
      setNodefont(Number(topology.metadata.nodefont) || 3);
      setLinkfont(Number(topology.metadata.linkfont) || 2);
    }
  }, [topology?.metadata]);

  if (activeModal !== 'map_labels') return null;

  const handleApply = (newMeta: Partial<NonNullable<typeof topology>['metadata']>) => {
    updateMapMetadata(newMeta);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMapMetadata({
      linklabels,
      nodefont,
      linkfont,
    });
    setSavedFlash(true);
    setTimeout(() => {
      setActiveModal(null);
    }, 600);
  };

  // Filter custom free labels vs hardware bound nodes
  const customLabels = (topology?.nodes || []).filter((n) => n.icon === 'none');
  const hardwareNodes = (topology?.nodes || []).filter((n) => n.icon !== 'none');
  const links = topology?.links || [];

  const handleAddCustomLabel = () => {
    addLabel();
    setActiveModal(null);
  };

  const handleSelectLabel = (id: string) => {
    setSelectedElement({ type: 'node', id });
    setActiveModal(null);
  };

  const handleShowAll = () => {
    hardwareNodes.forEach((n) => updateNode(n.id, { hide_label: false }));
    links.forEach((l) => updateLink(l.id, { hide_labels: false }));
  };

  const handleHideAll = () => {
    hardwareNodes.forEach((n) => updateNode(n.id, { hide_label: true }));
    links.forEach((l) => updateLink(l.id, { hide_labels: true }));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveModal(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-stone-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Gestion des étiquettes & libellés
              </h2>
              <p className="text-[11px] text-stone-400">
                Étiquettes liées (nœuds & liens) et libellés personnalisés libres
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
          {/* Section 1: Libellés Personnalisés Libres */}
          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-200 text-xs">
                  Libellés personnalisés libres ({customLabels.length})
                </span>
              </div>
              {editMode && (
                <button
                  type="button"
                  onClick={handleAddCustomLabel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau libellé</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-stone-400">
              Les libellés personnalisés sont libres sur la carte, déplaçables partout sans être contraints par une icône de matériel.
            </p>

            {customLabels.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {customLabels.map((cl) => (
                  <div
                    key={cl.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-900/90 border border-stone-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="font-semibold text-stone-200 truncate">
                        {cl.label || cl.id}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ({Math.round(cl.x)}, {Math.round(cl.y)})
                      </span>
                    </div>
                    {editMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectLabel(cl.id)}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 text-[10px] font-semibold"
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNode(cl.id)}
                          className="p-1 text-stone-500 hover:text-rose-400"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-stone-500 text-[11px] border border-dashed border-stone-800 rounded-lg">
                Aucun libellé personnalisé sur cette carte.
              </div>
            )}
          </div>

          {/* Section 2: Étiquettes Liées Existantes (Nœuds & Liens) */}
          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-200 text-xs">
                Étiquettes existantes liées aux nœuds & liens
              </span>
              {editMode && (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={handleShowAll}
                    className="px-2 py-1 rounded bg-stone-900 border border-stone-800 text-emerald-400 hover:bg-stone-800 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Tout afficher</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHideAll}
                    className="px-2 py-1 rounded bg-stone-900 border border-stone-800 text-rose-400 hover:bg-stone-800 flex items-center gap-1"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Tout masquer</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-stone-400">
              Ces étiquettes sont directement rattachées à leurs équipements ou liaisons. Vous pouvez les masquer ou les déplacer individuellement en cliquant sur chaque élément.
            </p>

            {/* Link Labels Format */}
            <div>
              <label className="block text-stone-300 font-semibold mb-1.5">
                Format des étiquettes de bande passante
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'percent', label: 'Pourcentage', desc: 'Ex: 45.2%' },
                  { id: 'bits', label: 'Débit', desc: 'Ex: 120 Mbps' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!editMode}
                    onClick={() => {
                      setLinklabels(opt.id as any);
                      handleApply({ linklabels: opt.id as any });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      linklabels === opt.id
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold ring-1 ring-amber-400/40'
                        : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Sizes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Police par défaut des nœuds
                </label>
                <select
                  disabled={!editMode}
                  value={nodefont}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNodefont(val);
                    handleApply({ nodefont: val });
                  }}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-medium focus:border-amber-500 focus:outline-none"
                >
                  <option value={1}>1 - Très petite 9px</option>
                  <option value={2}>2 - Petite 10px</option>
                  <option value={3}>3 - Standard 11px</option>
                  <option value={4}>4 - Grande 12px</option>
                  <option value={5}>5 - Très grande 13px</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Police par défaut des liens
                </label>
                <select
                  disabled={!editMode}
                  value={linkfont}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLinkfont(val);
                    handleApply({ linkfont: val });
                  }}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-medium focus:border-amber-500 focus:outline-none"
                >
                  <option value={1}>1 - Très petite 9px</option>
                  <option value={2}>2 - Standard 10px</option>
                  <option value={3}>3 - Moyenne 11px</option>
                  <option value={4}>4 - Grande 12px</option>
                  <option value={5}>5 - Très grande 13px</option>
                </select>
              </div>
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
                <span>{savedFlash ? 'Enregistré !' : 'Enregistrer les étiquettes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
