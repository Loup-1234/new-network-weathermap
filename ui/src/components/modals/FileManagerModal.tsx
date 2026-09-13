import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Check,
  Plus,
  FileText,
  Clock,
  X,
  MapPin,
  Route,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

interface MapInfo {
  name: string;
  title: string;
  mtime: number;
  node_count?: number;
  link_count?: number;
}

interface FileManagerModalProps {
  onLoadMap?: (mapName: string) => void;
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({ onLoadMap }) => {
  const {
    activeModal,
    setActiveModal,
    currentMapFile,
    setCurrentMapFile,
  } = useMapStore();

  const [availableMaps, setAvailableMaps] = useState<MapInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [copyFromMap, setCopyFromMap] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMaps = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api.php?action=list_maps');
      const data = await res.json();
      if (data.maps) {
        setAvailableMaps(data.maps);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors du chargement des cartes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'file_manager') {
      fetchMaps();
    }
  }, [activeModal]);

  if (activeModal !== 'file_manager') return null;

  const handleSelectMap = async (mapName: string) => {
    setCurrentMapFile(mapName);
    onLoadMap?.(mapName);
    setActiveModal(null);
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;

    let filename = newMapName.trim();
    if (!filename.endsWith('.conf')) {
      filename += '.conf';
    }

    try {
      setLoading(true);
      const payload: any = { new_name: filename };
      if (copyFromMap) {
        payload.copy_from = copyFromMap;
      }

      const res = await fetch('/api.php?action=create_map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        return;
      }

      // Switch to the newly created map
      setCurrentMapFile(filename);
      onLoadMap?.(filename);
      setActiveModal(null);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la création de la carte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveModal(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-stone-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Gestionnaire de cartes
              </h2>
              <p className="text-[11px] text-stone-400">Ouvrir, créer ou dupliquer une carte réseau Weathermap</p>
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

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Create or Duplicate Map */}
          <form onSubmit={handleCreateNew} className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <span>Nouvelle carte ou duplication</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">Nom du fichier .conf</label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="nouvelle-carte.conf"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">Cloner une carte existante - optionnel</label>
                <select
                  value={copyFromMap}
                  onChange={(e) => setCopyFromMap(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Carte vierge --</option>
                  {availableMaps.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.title || m.name} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading || !newMapName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-950/40 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer la carte</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Existing Maps List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Cartes disponibles sur le serveur : {availableMaps.length}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableMaps.map((m) => {
                const isActive = currentMapFile === m.name;
                return (
                  <div
                    key={m.name}
                    onClick={() => handleSelectMap(m.name)}
                    className={`group p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-stone-950/80 border-stone-800 hover:border-amber-500/40 hover:bg-stone-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400 group-hover:text-amber-400'}`} />
                          <h4 className="font-bold text-stone-100 text-sm truncate max-w-[180px]">
                            {m.title || m.name}
                          </h4>
                        </div>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-stone-400 mt-1 truncate">
                        {m.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 text-[10px] text-stone-500">
                      <div className="flex items-center gap-3">
                        {m.node_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500/70" />
                            {m.node_count} nœuds
                          </span>
                        )}
                        {m.link_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Route className="w-3 h-3 text-amber-500/70" />
                            {m.link_count} liens
                          </span>
                        )}
                      </div>
                      {m.mtime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(m.mtime * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
