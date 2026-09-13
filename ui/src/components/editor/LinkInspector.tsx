import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Trash2,
  Save,
  X,
  Plus,
  Check,
  CornerDownRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import type { LinkData } from '../../types/weathermap';

export const LinkInspector: React.FC = () => {
  const {
    topology,
    selectedElement,
    setSelectedElement,
    updateLink,
    deleteLink,
    setLinkRouting,
    addLinkVia,
    updateLinkVia,
    removeLinkVia,
    straightenLink,
    editMode,
  } = useMapStore();

  const link = topology?.links?.find(
    (l) => selectedElement?.type === 'link' && l.id === selectedElement.id
  );

  const [formData, setFormData] = useState<Partial<LinkData>>({});
  const [sameAsIn, setSameAsIn] = useState(true);
  const [updatedFlash, setUpdatedFlash] = useState(false);

  useEffect(() => {
    if (link) {
      setFormData({ ...link });
      setSameAsIn(link.bandwidth_in_cfg === link.bandwidth_out_cfg);
    }
  }, [link]);

  if (!editMode || !link) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLink(link.id, formData);
    setUpdatedFlash(true);
    setTimeout(() => setUpdatedFlash(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Supprimer le lien ${link.source} ↔ ${link.target} ?`)) {
      deleteLink(link.id);
      setSelectedElement(null);
    }
  };

  const vias = link.via || [];
  const currentRouting = link.routing || 'bezier';

  return (
    <aside className="absolute top-18 right-4 z-40 w-92 bg-stone-900/95 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-xs select-none max-h-[calc(100vh-5.5rem)] overflow-y-auto animate-in fade-in slide-in-from-right-3 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-stone-100 text-sm">Propriétés du lien</h2>
            <span className="font-mono text-xs text-amber-400 block truncate max-w-[200px]">
              {link.source} ↔ {link.target}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedElement(null)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
        {/* Section 1: Extrémités & Source de Données */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
            Extrémités & cibles
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-stone-900/90 p-2 rounded-lg border border-stone-800">
              <span className="text-stone-500 block text-[10px]">Origine</span>
              <span className="font-bold text-amber-300 truncate block font-mono">{link.source}</span>
            </div>
            <div className="bg-stone-900/90 p-2 rounded-lg border border-stone-800">
              <span className="text-stone-500 block text-[10px]">Destination</span>
              <span className="font-bold text-amber-300 truncate block font-mono">{link.target}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1">
              Source de données RRD / SNMP
            </label>
            <input
              type="text"
              value={formData.target_ds || ''}
              onChange={(e) => setFormData({ ...formData, target_ds: e.target.value })}
              placeholder="rrd/traffic.rrd:ds0:ds1"
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-[11px] focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Étiquettes du lien (Masquer & Déplacer individuellement) */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              Étiquettes & position
            </span>
            <button
              type="button"
              onClick={() => {
                const newHide = !formData.hide_labels;
                setFormData({ ...formData, hide_labels: newHide });
                updateLink(link.id, { hide_labels: newHide });
              }}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                formData.hide_labels
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {formData.hide_labels ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{formData.hide_labels ? 'Étiquettes masquées' : 'Étiquettes visibles'}</span>
            </button>
          </div>

          {!formData.hide_labels && (
            <div className="space-y-2 pt-0.5">
              <div>
                <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                  <span>Position étiquette Sortie (Out)</span>
                  <span className="font-mono text-amber-400">{formData.commentpos_out ?? 25}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={Math.min(40, Math.max(5, formData.commentpos_out ?? 25))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, commentpos_out: val });
                    updateLink(link.id, { commentpos_out: val });
                  }}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-stone-500 font-mono mt-0.5">
                  <span>Origine (5%)</span>
                  <span>Centre max (40%)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                  <span>Position étiquette Entrée (In)</span>
                  <span className="font-mono text-amber-400">{formData.commentpos_in ?? 75}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={95}
                  value={Math.min(95, Math.max(60, formData.commentpos_in ?? 75))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, commentpos_in: val });
                    updateLink(link.id, { commentpos_in: val });
                  }}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-stone-500 font-mono mt-0.5">
                  <span>Centre min (60%)</span>
                  <span>Destination (95%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Tracé, Géométrie & Waypoints */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
              Tracé & waypoints
            </span>
            {vias.length > 0 && (
              <button
                type="button"
                onClick={() => straightenLink(link.id)}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-[10px] border border-stone-700 transition-colors flex items-center gap-1"
                title="Supprimer tous les waypoints"
              >
                <CornerDownRight className="w-3 h-3" />
                Droit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setLinkRouting(link.id, 'bezier')}
              className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                currentRouting === 'bezier'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Incurvé
            </button>
            <button
              type="button"
              onClick={() => setLinkRouting(link.id, 'smoothstep')}
              className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                currentRouting === 'smoothstep'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Fluide
            </button>
            <button
              type="button"
              onClick={() => setLinkRouting(link.id, 'step')}
              className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                currentRouting === 'step'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              90° Orthogonal
            </button>
            <button
              type="button"
              onClick={() => setLinkRouting(link.id, 'polyline')}
              className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                currentRouting === 'polyline'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Waypoints
            </button>
          </div>

          {/* Add Waypoint Button */}
          <button
            type="button"
            onClick={() => addLinkVia(link.id)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un waypoint
          </button>

          {/* Waypoints coordinate list */}
          {vias.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
              {vias.map(([vx, vy], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-stone-900/90 border border-stone-800 text-[11px]"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1 flex-1 font-mono">
                    <span className="text-stone-500 text-[10px]">X</span>
                    <input
                      type="number"
                      value={vx}
                      onChange={(e) => updateLinkVia(link.id, idx, Number(e.target.value), vy)}
                      className="w-14 bg-stone-950 rounded-lg px-2 py-0.5 text-stone-200 text-right border border-stone-800 focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-stone-500 text-[10px] ml-1">Y</span>
                    <input
                      type="number"
                      value={vy}
                      onChange={(e) => updateLinkVia(link.id, idx, vx, Number(e.target.value))}
                      className="w-14 bg-stone-950 rounded-lg px-2 py-0.5 text-stone-200 text-right border border-stone-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLinkVia(link.id, idx)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800"
                    title="Supprimer ce point"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Link width */}
            <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Largeur des flèches
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={formData.width || 7}
                        onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                        className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg pl-2.5 pr-12 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none [&::-webkit-inner-spin-button]:mr-5"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-[11px] pointer-events-none">
                        px
                    </span>
                </div>
            </div>
        </div>

        {/* Section 4: Bande passante & commentaires de Port */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            Bande passante & commentaires
          </span>
          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1">
              Capacité entrante
            </label>
            <input
              type="text"
              value={formData.bandwidth_in_cfg || '100M'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bandwidth_in_cfg: e.target.value,
                  bandwidth_out_cfg: sameAsIn ? e.target.value : formData.bandwidth_out_cfg,
                })
              }
              placeholder="100M ou 10G"
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-stone-300 font-medium cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={sameAsIn}
              onChange={(e) => setSameAsIn(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-stone-700 text-amber-500 focus:ring-amber-400 bg-stone-950"
            />
            <span>Même bande passante en sortie</span>
          </label>

          {!sameAsIn && (
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                Capacité sortante
              </label>
              <input
                type="text"
                value={formData.bandwidth_out_cfg || '100M'}
                onChange={(e) => setFormData({ ...formData, bandwidth_out_cfg: e.target.value })}
                placeholder="100M ou 10G"
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          {/* Side Comments */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Commentaire in</label>
              <input
                type="text"
                value={formData.comments?.in || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comments: { in: e.target.value, out: formData.comments?.out || '' },
                  })
                }
                placeholder="Port Gi0/1"
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2 py-1 text-stone-200 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Commentaire out</label>
              <input
                type="text"
                value={formData.comments?.out || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comments: { in: formData.comments?.in || '', out: e.target.value },
                  })
                }
                placeholder="Port Gi0/2"
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2 py-1 text-stone-200 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Liens Web & Graphiques */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            Liens & infobulles
          </span>
          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1">
              URL de redirection
            </label>
            <input
              type="text"
              value={typeof formData.infourl === 'string' ? formData.infourl : formData.infourl?.in || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  infourl: { in: e.target.value, out: e.target.value },
                })
              }
              placeholder="https://cacti.domain/graphs.php?id=..."
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-[11px] focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1">
              Graphique au survol
            </label>
            <input
              type="text"
              value={formData.hover?.in || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hover: { in: e.target.value, out: e.target.value },
                })
              }
              placeholder="https://cacti.domain/graph_image.php?..."
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-[11px] focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
            updatedFlash
              ? 'bg-emerald-500 text-stone-950 shadow-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-950/40'
          }`}
        >
          {updatedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{updatedFlash ? 'Lien mis à jour !' : 'Enregistrer le lien'}</span>
        </button>

        {/* Secondary Actions */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer le lien
          </button>
        </div>
      </form>
    </aside>
  );
};
