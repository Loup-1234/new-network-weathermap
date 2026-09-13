import React, { useState } from 'react';
import { Gauge, Plus, Trash2, Save, Lock, Edit3, X, Check } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import type { ScaleEntry, ScaleData } from '../../types/weathermap';

const PRESET_PALETTES: Record<string, { label: string; entries: ScaleEntry[] }> = {
  classic: {
    label: 'Classique',
    entries: [
      { bottom: 0, top: 1, color1: '#ffffff' },
      { bottom: 1, top: 10, color1: '#9ca3af' },
      { bottom: 10, top: 25, color1: '#a855f7' },
      { bottom: 25, top: 40, color1: '#3b82f6' },
      { bottom: 40, top: 55, color1: '#10b981' },
      { bottom: 55, top: 70, color1: '#eab308' },
      { bottom: 70, top: 85, color1: '#f97316' },
      { bottom: 85, top: 100, color1: '#ef4444' },
    ],
  },
  amber_gold: {
    label: 'Ambre Doré',
    entries: [
      { bottom: 0, top: 1, color1: '#ffffff' },
      { bottom: 1, top: 10, color1: '#fef08a' },
      { bottom: 10, top: 25, color1: '#fde047' },
      { bottom: 25, top: 40, color1: '#facc15' },
      { bottom: 40, top: 55, color1: '#eab308' },
      { bottom: 55, top: 70, color1: '#ca8a04' },
      { bottom: 85, top: 100, color1: '#713f12' },
      { bottom: 70, top: 85, color1: '#a16207' },
    ],
  },
  traffic_light: {
    label: 'Feu Tricolore',
    entries: [
      { bottom: 0, top: 25, color1: '#22c55e' },
      { bottom: 25, top: 50, color1: '#84cc16' },
      { bottom: 50, top: 75, color1: '#eab308' },
      { bottom: 75, top: 90, color1: '#f97316' },
      { bottom: 90, top: 100, color1: '#ef4444' },
    ],
  },
  cyber_neon: {
    label: 'Cyber Néon',
    entries: [
      { bottom: 0, top: 20, color1: '#14b8a6' },
      { bottom: 20, top: 40, color1: '#06b6d4' },
      { bottom: 40, top: 60, color1: '#3b82f6' },
      { bottom: 60, top: 80, color1: '#a855f7' },
      { bottom: 80, top: 100, color1: '#f43f5e' },
    ],
  },
};

export const ColorScaleModal: React.FC = () => {
  const { topology, activeModal, setActiveModal, updateScales, editMode, setEditMode } = useMapStore();

  const scales = topology?.scales || {};
  const activeScaleKey = Object.keys(scales)[0] || 'DEFAULT';
  const currentScale = scales[activeScaleKey] || {
    name: 'DEFAULT',
    entries: PRESET_PALETTES.classic.entries,
  };

  const [entries, setEntries] = useState<ScaleEntry[]>(currentScale.entries || PRESET_PALETTES.classic.entries);
  const [selectedPreset, setSelectedPreset] = useState<string>('classic');

  if (activeModal !== 'colors') return null;

  const handleApplyPreset = (presetKey: string) => {
    if (!editMode) return;
    const preset = PRESET_PALETTES[presetKey];
    if (preset) {
      setEntries([...preset.entries]);
      setSelectedPreset(presetKey);
    }
  };

  const handleEntryChange = (idx: number, field: keyof ScaleEntry, val: unknown) => {
    const next = [...entries];
    next[idx] = { ...next[idx], [field]: val };
    setEntries(next);
    setSelectedPreset('');
  };

  const handleAddEntry = () => {
    const last = entries[entries.length - 1];
    const newBottom = last ? last.top : 0;
    const newTop = Math.min(100, newBottom + 10);
    setEntries([...entries, { bottom: newBottom, top: newTop, color1: '#f59e0b' }]);
    setSelectedPreset('');
  };

  const handleRemoveEntry = (idx: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== idx));
    setSelectedPreset('');
  };

  const handleSave = () => {
    const updatedScaleData: Record<string, ScaleData> = {
      ...scales,
      [activeScaleKey]: {
        name: activeScaleKey,
        entries,
      },
    };
    updateScales(updatedScaleData);
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
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Échelles de trafic & couleurs
              </h2>
              <p className="text-[11px] text-stone-400">Palette de coloration de la bande passante selon la charge</p>
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
              <span>Modifier la palette</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Presets */}
          {editMode && (
            <div className="space-y-1.5">
              <label className="block text-stone-400 font-semibold">Palettes prédéfinies</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(PRESET_PALETTES).map(([key, preset]) => {
                  const isSelected = selectedPreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-stone-950/80 border-stone-800 hover:border-amber-500/50 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px]">{preset.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className="flex h-2 rounded overflow-hidden mt-1.5 gap-0.5">
                        {preset.entries.map((p, i) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: p.color1 || '#999' }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scale Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-stone-300 font-semibold">Paliers de pourcentage et teintes</label>
              {editMode && (
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un palier</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/80 border border-stone-800"
                >
                  <input
                    type="color"
                    disabled={!editMode}
                    value={entry.color1 || '#000000'}
                    onChange={(e) => handleEntryChange(idx, 'color1', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <div className="flex items-center gap-1.5 flex-1 font-mono text-stone-200">
                    <span className="text-stone-400">De</span>
                    <input
                      type="number"
                      disabled={!editMode}
                      value={entry.bottom}
                      onChange={(e) => handleEntryChange(idx, 'bottom', Number(e.target.value))}
                      className="w-14 bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-center text-stone-100 disabled:opacity-75 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/30"
                    />
                    <span className="text-stone-400">% à</span>
                    <input
                      type="number"
                      disabled={!editMode}
                      value={entry.top}
                      onChange={(e) => handleEntryChange(idx, 'top', Number(e.target.value))}
                      className="w-14 bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-center text-stone-100 disabled:opacity-75 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/30"
                    />
                    <span className="text-stone-400">%</span>
                  </div>
                  {editMode && entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(idx)}
                      className="p-1 rounded text-stone-500 hover:text-rose-400 hover:bg-stone-800"
                      title="Supprimer ce palier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          {editMode && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold transition-all shadow-lg shadow-amber-950/40"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer l'échelle</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
