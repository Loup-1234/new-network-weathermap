import React, { useState, useEffect, useCallback } from "react";
import { Layout, Save, Edit3, Lock, X, RotateCcw } from "lucide-react";
import { useMapStore } from "../../store/useMapStore";
import type { MapMetadata } from "../../types/weathermap";

interface ImageItem {
  name: string;
  url: string;
  width?: number;
  height?: number;
}

export const MapPropertiesModal: React.FC = () => {
  const { topology, activeModal, setActiveModal, updateMapMetadata, editMode, setEditMode } = useMapStore();
  const [formData, setFormData] = useState<MapMetadata>(topology?.metadata || {
    title: "",
    width: 800,
    height: 600,
    datestamp: "",
    default_link_width: 7,
    default_link_bwin: "100M",
    default_link_bwout: "100M",
  });

  const [bgList, setBgList] = useState<ImageItem[]>([]);
  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({
    width: topology?.metadata?.width || 800,
    height: topology?.metadata?.height || 600,
  });
  const [scalePercent, setScalePercent] = useState<number>(100);

  // Helper to resolve natural dimensions of an image
  const resolveDimensions = useCallback((bgPath: string, list: ImageItem[]): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const cleanName = bgPath.replace(/^images\//, "");
      const matched = list.find((b) => b.name === cleanName || `images/${b.name}` === bgPath);
      if (matched && matched.width && matched.height && matched.width > 0 && matched.height > 0) {
        return resolve({ width: matched.width, height: matched.height });
      }

      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        } else {
          resolve({ width: 800, height: 600 });
        }
      };
      img.onerror = () => {
        resolve({ width: 800, height: 600 });
      };
      img.src = bgPath.startsWith("http") || bgPath.startsWith("/") ? bgPath : `/${bgPath}`;
    });
  }, []);

  // Fetch images list when modal opens
  useEffect(() => {
    if (activeModal === "map_props") {
      fetch("/api.php?action=list_images")
        .then((res) => res.json())
        .then(async (data) => {
          const list: ImageItem[] = data.backgrounds || [];
          setBgList(list);

          // If a background image is already configured, resolve its dimensions
          const currentBg = topology?.metadata?.background;
          if (currentBg) {
            const dims = await resolveDimensions(currentBg, list);
            setBaseDimensions(dims);
            if (dims.width > 0) {
              const currentW = topology?.metadata?.width || dims.width;
              const computedPercent = Math.round((currentW / dims.width) * 100);
              setScalePercent(computedPercent || 100);
            }
          }
        })
        .catch((err) => console.warn("Could not fetch backgrounds", err));
    }
  }, [activeModal, topology?.metadata?.background, topology?.metadata?.width, resolveDimensions]);

  // Sync form data when topology changes
  useEffect(() => {
    if (topology?.metadata) {
      setFormData({
        ...topology.metadata,
        default_link_width: topology.metadata.default_link_width || 7,
        default_link_bwin: topology.metadata.default_link_bwin || "100M",
        default_link_bwout: topology.metadata.default_link_bwout || "100M",
      });
      const initialW = topology.metadata.width || 800;
      const initialH = topology.metadata.height || 600;
      setBaseDimensions((prev) => (prev.width ? prev : { width: initialW, height: initialH }));
    }
  }, [topology?.metadata]);

  if (activeModal !== "map_props") return null;

  // Handler when selecting a background image: automatically set width & height to the image dimensions
  const handleBackgroundChange = async (bgValue: string) => {
    if (!bgValue) {
      setFormData((prev) => ({ ...prev, background: undefined }));
      return;
    }

    const dims = await resolveDimensions(bgValue, bgList);
    setBaseDimensions(dims);
    setScalePercent(100);
    setFormData((prev) => ({
      ...prev,
      background: bgValue,
      width: dims.width,
      height: dims.height,
    }));
  };

  // Handler when scaling percentage changes (preserves proportions from base dimensions)
  const handleScalePercentChange = (pct: number) => {
    const validPct = Math.max(10, Math.min(1000, pct || 10));
    setScalePercent(validPct);
    const baseW = baseDimensions.width || 800;
    const baseH = baseDimensions.height || 600;
    const newW = Math.round((baseW * validPct) / 100);
    const newH = Math.round((baseH * validPct) / 100);
    setFormData((prev) => ({ ...prev, width: newW, height: newH }));
  };

  // Handler when resetting dimensions back to base dimensions and 100% scale
  const handleResetDimensions = () => {
    const baseW = baseDimensions.width || 800;
    const baseH = baseDimensions.height || 600;
    setScalePercent(100);
    setFormData((prev) => ({
      ...prev,
      width: baseW,
      height: baseH,
    }));
  };

  // Handler for manual width change (independent to allow deforming)
  const handleWidthChange = (val: number) => {
    const newW = Math.max(10, val || 10);
    setFormData((prev) => ({ ...prev, width: newW }));
  };

  // Handler for manual length/height change (independent to allow deforming)
  const handleHeightChange = (val: number) => {
    const newH = Math.max(10, val || 10);
    setFormData((prev) => ({ ...prev, height: newH }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMapMetadata(formData);
    setActiveModal(null);
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
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Propriétés de la carte
              </h2>
              <p className="text-[11px] text-stone-400">Dimensions, arrière-plan et paramètres par défaut</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Map Title */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">Titre de la carte</label>
            <input
              type="text"
              disabled={!editMode}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-stone-950/80 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 disabled:opacity-75 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="Ex: Réseau Backbone - Campus Principal"
            />
          </div>

          {/* Background selection */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">Image d'arrière-plan</label>
            <div className="flex gap-2">
              <select
                disabled={!editMode}
                value={formData.background || ""}
                onChange={(e) => handleBackgroundChange(e.target.value)}
                className="flex-1 bg-stone-950/80 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 disabled:opacity-75 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Aucun --</option>
                {bgList.map((bg) => (
                  <option key={bg.name} value={`images/${bg.name}`}>
                    {bg.name}
                  </option>
                ))}
              </select>
              {formData.background && (
                <button
                  type="button"
                  disabled={!editMode}
                  onClick={() => setFormData({ ...formData, background: undefined })}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium transition-colors"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Dimensions & Reorganized Layout */}
          <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                Dimensions
              </span>
              <button
                type="button"
                disabled={!editMode}
                onClick={handleResetDimensions}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-300 hover:text-amber-300 text-xs font-semibold border border-stone-700 transition-colors shadow-sm disabled:opacity-50"
                title="Tout réinitialiser (taille 100% et dimensions d'origine)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* 3 Columns: Largeur, Longueur, Taille */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Largeur</label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={!editMode}
                    value={formData.width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 disabled:opacity-75 font-mono pr-8 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-[11px] pointer-events-none">px</span>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Longueur</label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={!editMode}
                    value={formData.height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 disabled:opacity-75 font-mono pr-8 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-[11px] pointer-events-none">px</span>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Taille</label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={!editMode}
                    min={10}
                    max={500}
                    value={scalePercent}
                    onChange={(e) => handleScalePercentChange(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 disabled:opacity-75 font-mono pr-7 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 font-mono text-xs font-bold pointer-events-none">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Defaults for new Links */}
          <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Valeurs par défaut des nouveaux liens</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-400 font-medium mb-1">Largeur</label>
                <input
                  type="number"
                  disabled={!editMode}
                  value={formData.default_link_width || 7}
                  onChange={(e) => setFormData({ ...formData, default_link_width: Number(e.target.value) })}
                  className="w-full bg-stone-950/80 border border-stone-800 rounded-xl px-2.5 py-1.5 text-stone-100 disabled:opacity-75 font-mono focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-stone-400 font-medium mb-1">Bande passante in</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.default_link_bwin || "100M"}
                  onChange={(e) => setFormData({ ...formData, default_link_bwin: e.target.value })}
                  className="w-full bg-stone-950/80 border border-stone-800 rounded-xl px-2.5 py-1.5 text-stone-100 disabled:opacity-75 font-mono focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-stone-400 font-medium mb-1">Bande passante out</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.default_link_bwout || "100M"}
                  onChange={(e) => setFormData({ ...formData, default_link_bwout: e.target.value })}
                  className="w-full bg-stone-950/80 border border-stone-800 rounded-xl px-2.5 py-1.5 text-stone-100 disabled:opacity-75 font-mono focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {editMode && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold transition-all shadow-lg shadow-amber-950/40"
              >
                <Save className="w-4 h-4" />
                <span>Appliquer les modifications</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
