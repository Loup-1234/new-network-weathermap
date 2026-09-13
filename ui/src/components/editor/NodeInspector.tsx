import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Trash2,
  Copy,
  Save,
  Check,
  Type,
  Eye,
  EyeOff,
  Palette,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import type { NodeData } from '../../types/weathermap';

export const NodeInspector: React.FC = () => {
  const {
    topology,
    selectedElement,
    setSelectedElement,
    updateNode,
    deleteNode,
    cloneNode,
    editMode,
  } = useMapStore();

  const [availableIcons, setAvailableIcons] = useState<Array<{ name: string; url: string }>>([]);
  const svgIcons = availableIcons.filter((ic) => ic.name.toLowerCase().endsWith(".svg"));
  const pngIcons = availableIcons.filter((ic) => !ic.name.toLowerCase().endsWith(".svg"));
  const [updatedFlash, setUpdatedFlash] = useState(false);

  const node = selectedElement?.type === 'node'
    ? topology?.nodes.find((n) => n.id === selectedElement.id)
    : null;

  const [formData, setFormData] = useState<Partial<NodeData>>({});

  useEffect(() => {
    fetch('/api.php?action=list_images')
      .then((r) => r.json())
      .then((d) => {
        if (d.icons) setAvailableIcons(d.icons);
      })
      .catch((e) => console.warn('Could not load icons', e));
  }, []);

  useEffect(() => {
    if (node) {
      setFormData(node);
    }
  }, [node]);

  if (!editMode || !node) return null;

  const isCustomLabel = node.icon === 'none';

  const normalizeIconName = (val?: string) => {
    if (!val || val === 'none') return '';
    return val.replace(/^\/?images\//, '');
  };

  const handleIconChange = (newVal: string) => {
    const finalIcon = newVal ? `images/${newVal}` : '';
    setFormData((prev) => ({ ...prev, icon: finalIcon }));
    updateNode(node.id, { icon: finalIcon });
  };

  const handleLabelChange = (newLabel: string) => {
    setFormData((prev) => ({ ...prev, label: newLabel, raw_label: newLabel }));
    updateNode(node.id, { label: newLabel, raw_label: newLabel });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<NodeData> = {
      ...formData,
      overliburl: (formData.hover as string) || (formData.overliburl as string),
    };
    updateNode(node.id, payload);
    setUpdatedFlash(true);
    setTimeout(() => setUpdatedFlash(false), 2000);
  };

  const otherNodes = (topology?.nodes || []).filter((n) => n.id !== node.id);

  // 1. Dedicated Inspector for Free Custom Labels
  if (isCustomLabel) {
    return (
      <aside className="absolute top-18 right-4 z-40 w-92 bg-stone-900/95 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-xs select-none max-h-[calc(100vh-5.5rem)] overflow-y-auto animate-in fade-in slide-in-from-right-3 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-100 text-sm">Libellé personnalisé</h2>
              <span className="font-mono text-[11px] text-amber-400 block truncate max-w-[200px]">
                Libre sur la carte
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

        <form onSubmit={handleSave} className="mt-3.5 space-y-3">
          {/* Text Content */}
          <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
              Texte du libellé
            </span>
            <div>
              <textarea
                rows={2}
                value={formData.label || ''}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Entrez votre texte..."
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-100 text-xs font-medium focus:border-amber-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Style & Colors - Dynamically matches label border and tint */}
          <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Palette className="w-3 h-3 text-amber-400" />
              Style & couleur du libellé
            </span>

            {/* Font Size */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Taille du libellé</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 1, label: 'XS', title: 'Très petit (10px)' },
                  { id: 2, label: 'S', title: 'Petit (11px)' },
                  { id: 3, label: 'M', title: 'Standard (12px)' },
                  { id: 4, label: 'L', title: 'Grand (14px)' },
                  { id: 5, label: 'XL', title: 'Très grand (16px)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.title}
                    onClick={() => {
                      setFormData({ ...formData, fontsize: s.id });
                      updateNode(node.id, { fontsize: s.id });
                    }}
                    className={`py-1.5 rounded-lg font-bold text-center border transition-all ${
                      (formData.fontsize || 2) === s.id
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color & Style Palette */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1.5">
                Couleur & style du libellé
              </label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#f59e0b', label: 'Ambre' },
                  { color: '#38bdf8', label: 'Cyan' },
                  { color: '#10b981', label: 'Émeraude' },
                  { color: '#ef4444', label: 'Rouge' },
                  { color: '#a855f7', label: 'Violet' },
                  { color: '#fafaf9', label: 'Blanc' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, fontcolor: c.color, color: c.color });
                      updateNode(node.id, { fontcolor: c.color, color: c.color });
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      (formData.fontcolor || formData.color || '#f59e0b') === c.color
                        ? 'scale-125 border-white shadow-lg ring-1 ring-amber-400'
                        : 'border-stone-800 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
                <input
                  type="text"
                  value={formData.fontcolor || formData.color || '#f59e0b'}
                  onChange={(e) => {
                    setFormData({ ...formData, fontcolor: e.target.value, color: e.target.value });
                    updateNode(node.id, { fontcolor: e.target.value, color: e.target.value });
                  }}
                  className="w-20 bg-stone-900 border border-stone-700/80 rounded-lg px-2 py-1 text-stone-200 font-mono text-[10px] text-center"
                />
              </div>
            </div>

            {/* Background Style */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Fond du badge</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'badge', label: 'Badge teinté' },
                  { id: 'transparent', label: 'Transparent' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, bgcolor: bg.id });
                      updateNode(node.id, { bgcolor: bg.id });
                    }}
                    className={`py-1.5 rounded-lg font-medium text-center border transition-all ${
                      (formData.bgcolor || 'badge') === bg.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Position Coordinates */}
          <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
              Position sur la carte
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Position X</label>
                <input
                  type="number"
                  value={Math.round(formData.x ?? 0)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, x: val });
                    updateNode(node.id, { x: val });
                  }}
                  className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Position Y</label>
                <input
                  type="number"
                  value={Math.round(formData.y ?? 0)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, y: val });
                    updateNode(node.id, { y: val });
                  }}
                  className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Convert to Node */}
          <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Convertir en nœud réseau
            </span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleIconChange(e.target.value);
                }
              }}
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
            >
              <option value="">-- Attribuer une icône matérielle --</option>
              {svgIcons.length > 0 && (
                <optgroup label="Icônes vectorielles (SVG - Recommandé)">
                  {svgIcons.map((ic) => (
                    <option key={ic.name} value={ic.name}>
                      {ic.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {pngIcons.length > 0 && (
                <optgroup label="Icônes matricielles (PNG / Raster)">
                  {pngIcons.map((ic) => (
                    <option key={ic.name} value={ic.name}>
                      {ic.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
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
            <span>{updatedFlash ? 'Libellé enregistré !' : 'Enregistrer le libellé'}</span>
          </button>

          {/* Delete Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Supprimer ce libellé personnalisé ?`)) {
                  deleteNode(node.id);
                  setSelectedElement(null);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer ce libellé
            </button>
          </div>
        </form>
      </aside>
    );
  }

  // 2. Inspector for Standard Network Nodes
  return (
    <aside className="absolute top-18 right-4 z-40 w-92 bg-stone-900/95 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-xs select-none max-h-[calc(100vh-5.5rem)] overflow-y-auto animate-in fade-in slide-in-from-right-3 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-stone-100 text-sm">Propriétés du nœud</h2>
            <span className="font-mono text-xs text-amber-400 block truncate max-w-[200px]">
              {node.id}
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

      <form onSubmit={handleSave} className="mt-3.5 space-y-3">
        {/* Section 1: Informations Générales */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
            Identification
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">ID interne</label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Libellé affiché</label>
              <input
                type="text"
                value={formData.label || ''}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Étiquette du nœud (Masquer & Déplacer individuellement) */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              Étiquette du nœud
            </span>
            <button
              type="button"
              onClick={() => {
                const newHide = !formData.hide_label;
                setFormData({ ...formData, hide_label: newHide });
                updateNode(node.id, { hide_label: newHide });
              }}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                formData.hide_label
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {formData.hide_label ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{formData.hide_label ? 'Libellé masqué' : 'Libellé visible'}</span>
            </button>
          </div>

          {!formData.hide_label && (
            <>
              {/* Quick Placement Presets */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, labeloffsetx: 0, labeloffsety: 0 });
                    updateNode(node.id, { labeloffsetx: 0, labeloffsety: 0 });
                  }}
                  className="py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-400 text-center"
                >
                  Dessous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, labeloffsetx: 0, labeloffsety: -48 });
                    updateNode(node.id, { labeloffsetx: 0, labeloffsety: -48 });
                  }}
                  className="py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-400 text-center"
                >
                  Dessus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, labeloffsetx: -55, labeloffsety: -20 });
                    updateNode(node.id, { labeloffsetx: -55, labeloffsety: -20 });
                  }}
                  className="py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-400 text-center"
                >
                  Gauche
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, labeloffsetx: 55, labeloffsety: -20 });
                    updateNode(node.id, { labeloffsetx: 55, labeloffsety: -20 });
                  }}
                  className="py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-400 text-center"
                >
                  Droite
                </button>
              </div>

              {/* Offset Fine Tuning */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                    <span>Décalage X</span>
                    <span className="font-mono text-amber-400">{formData.labeloffsetx || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={formData.labeloffsetx || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, labeloffsetx: val });
                      updateNode(node.id, { labeloffsetx: val });
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                    <span>Décalage Y</span>
                    <span className="font-mono text-amber-400">{formData.labeloffsety || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={formData.labeloffsety || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, labeloffsety: val });
                      updateNode(node.id, { labeloffsety: val });
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section 3: Position & Ancrage */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
            Position & ancrage
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Position X</label>
              <input
                type="number"
                value={Math.round(formData.x ?? 0)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({ ...formData, x: val });
                  updateNode(node.id, { x: val });
                }}
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">Position Y</label>
              <input
                type="number"
                value={Math.round(formData.y ?? 0)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({ ...formData, y: val });
                  updateNode(node.id, { y: val });
                }}
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center gap-1">
              Attacher au nœud parent
            </label>
            <select
              value={formData.lock_to || ''}
              onChange={(e) => {
                const val = e.target.value || undefined;
                setFormData({ ...formData, lock_to: val });
                updateNode(node.id, { lock_to: val });
              }}
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:border-amber-400 focus:outline-none"
            >
              <option value="">-- Aucun - Coordonnées absolues --</option>
              {otherNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label || n.id} - {n.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 4: Icône matériel */}
        <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            Icône matériel
          </span>
          <select
            value={normalizeIconName(formData.icon)}
            onChange={(e) => handleIconChange(e.target.value)}
            className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
          >
            <option value="">-- Automatique selon le nom (SVG par défaut) --</option>
            {svgIcons.length > 0 && (
              <optgroup label="Icônes vectorielles (SVG - Recommandé)">
                {svgIcons.map((ic) => (
                  <option key={ic.name} value={ic.name}>
                    {ic.name}
                  </option>
                ))}
              </optgroup>
            )}
            {pngIcons.length > 0 && (
              <optgroup label="Icônes matricielles (PNG / Raster)">
                {pngIcons.map((ic) => (
                  <option key={ic.name} value={ic.name}>
                    {ic.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {normalizeIconName(formData.icon) && (
            <div className="flex items-center gap-2.5 p-2 bg-stone-900 rounded-lg border border-stone-800">
              <img
                src={`/images/${normalizeIconName(formData.icon)}`}
                alt="Aperçu"
                className="w-8 h-8 object-contain drop-shadow"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="truncate">
                <span className="text-[11px] font-mono text-stone-200 block truncate">
                  {normalizeIconName(formData.icon)}
                </span>
                <span className="text-[9px] text-amber-400 font-semibold block">
                  Appliqué en direct
                </span>
              </div>
            </div>
          )}
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
              value={(formData.infourl as string) || ''}
              onChange={(e) => setFormData({ ...formData, infourl: e.target.value })}
              placeholder="https://supervision.local/node?id=..."
              className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-[11px] focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1">
              Graphique au survol
            </label>
            <input
              type="text"
              value={(formData.hover as string) || (formData.overliburl as string) || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hover: e.target.value,
                  overliburl: e.target.value,
                })
              }
              placeholder="https://supervision.local/graph.php?..."
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
          <span>{updatedFlash ? 'Nœud mis à jour !' : 'Enregistrer le nœud'}</span>
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => cloneNode(node.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Dupliquer
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Supprimer le nœud '${node.id}' et ses liens associés ?`)) {
                deleteNode(node.id);
                setSelectedElement(null);
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </button>
        </div>
      </form>
    </aside>
  );
};
