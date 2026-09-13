import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { AlertCircle, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import { MapCanvas } from './components/MapCanvas';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { MapPropertiesModal } from './components/modals/MapPropertiesModal';
import { MapStyleModal } from './components/modals/MapStyleModal';
import { LabelsModal } from './components/modals/LabelsModal';
import { EditorSettingsModal } from './components/modals/EditorSettingsModal';
import { FileManagerModal } from './components/modals/FileManagerModal';
import { RawConfigModal } from './components/modals/RawConfigModal';
import { ColorScaleModal } from './components/modals/ColorScaleModal';
import { useMapStore } from './store/useMapStore';
import type { WeathermapTopology } from './types/weathermap';

const queryClient = new QueryClient();

function WeathermapEditor() {
  const {
    currentMapFile,
    setCurrentMapFile,
    setTopology,
    activeModal,
    setActiveModal,
    setSelectedElement,
    setActiveTool,
    activeTool,
    isDirty,
    markSaved,
    settings,
  } = useMapStore();

  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  const fetchMap = useCallback(async (mapName: string) => {
    setLoadError(null);
    try {
      const res = await fetch(`/api.php?action=load_map&map=${encodeURIComponent(mapName)}&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success && data.error) throw new Error(data.error);

      // Robust extraction of topology object from API
      const topologyData: WeathermapTopology = data.topology || data;
      if (!topologyData || !topologyData.nodes) {
        throw new Error('Invalid topology data received');
      }

      setTopology(topologyData);
      setCurrentMapFile(mapName);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Could not load map from API (${errorMsg}), trying local fallback...`);
      try {
        const localRes = await fetch(`/map.json?_t=${Date.now()}`);
        if (!localRes.ok) throw new Error('Local map.json not found');
        const localData = await localRes.json();
        const topologyData: WeathermapTopology = localData.topology || localData;
        setTopology(topologyData);
        setLoadError(`Connecté à la carte locale (API : ${errorMsg})`);
      } catch (localErr) {
        console.error('Local fallback failed:', localErr);
        setLoadError(`Échec du chargement de la carte : ${errorMsg}`);
      }
    }
  }, [setTopology, setCurrentMapFile]);

  useEffect(() => {
    fetchMap(currentMapFile);
  }, [currentMapFile, fetchMap]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const { topology, currentMapFile: mapName } = useMapStore.getState();
      const res = await fetch('/api.php?action=save_map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          map: mapName,
          topology,
        }),
      });
      const data = await res.json();
      if (data.success) {
        markSaved();
        showToast(`Carte '${mapName}' enregistrée avec succès !`);
      } else {
        alert(`Échec de la sauvegarde : ${data.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  }, [markSaved, showToast]);

  // Open legacy editor embedded: always save latest modifications first!
  const handleOpenLegacy = useCallback(async () => {
    await handleSave();
    setLegacyOpen(true);
  }, [handleSave]);

  // Close legacy editor and return to modern interface: re-fetch latest map modifications
  const handleCloseLegacy = useCallback(async () => {
    setLegacyOpen(false);
    await fetchMap(currentMapFile);
    showToast("Carte synchronisée depuis l'ancien éditeur !");
  }, [fetchMap, currentMapFile, showToast]);

  // Listen for return postMessage from the embedded legacy editor iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CLOSE_LEGACY') {
        handleCloseLegacy();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleCloseLegacy]);

  // Autosave Effect: debounced after 3 seconds of inactivity, disabled by default
  useEffect(() => {
    if (!settings.autoSave || !isDirty || isSaving) return;

    const delay = (settings.autoSaveDelay || 3) * 1000;
    const timer = setTimeout(() => {
      handleSave();
    }, delay);

    return () => clearTimeout(timer);
  }, [settings.autoSave, settings.autoSaveDelay, isDirty, isSaving, handleSave]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (legacyOpen) {
          handleCloseLegacy();
          return;
        }
        if (activeModal) {
          setActiveModal(null);
        } else {
          setSelectedElement(null);
          setActiveTool('select');
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'n') {
        setActiveTool('add_node');
      } else if (e.key.toLowerCase() === 'l') {
        setActiveTool('add_link');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('add_label');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal, setSelectedElement, setActiveTool, activeTool, handleSave, legacyOpen, handleCloseLegacy]);

  const handleSaveRaw = async (content: string) => {
    const res = await fetch('/api.php?action=save_map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        map: currentMapFile,
        config: content,
      }),
    });
    const data = await res.json();
    if (data.success) {
      markSaved();
      await fetchMap(currentMapFile);
      showToast('Configuration brute appliquée et carte rechargée !');
    } else {
      throw new Error(data.error || 'Échec de la sauvegarde');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#0c0a09] font-sans">
      <EditorToolbar onSave={handleSave} isSaving={isSaving} onOpenLegacy={handleOpenLegacy} />
      <MapCanvas />

      {/* Modals matching all original editor dialogs */}
      <MapPropertiesModal />
      <MapStyleModal />
      <LabelsModal />
      <EditorSettingsModal />
      <FileManagerModal onLoadMap={(map) => fetchMap(map)} />
      <RawConfigModal onSaveRaw={handleSaveRaw} />
      <ColorScaleModal />

      {/* Embedded Legacy Editor Overlay */}
      {legacyOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 animate-in fade-in duration-200">
          <div className="h-14 bg-stone-900 border-b border-amber-900/40 px-4 flex items-center justify-between shadow-2xl select-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseLegacy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer hover:shadow-amber-500/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la nouvelle interface</span>
              </button>
              <div className="h-5 w-[1px] bg-stone-800" />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400">Ancien éditeur :</span>
                <span className="font-mono font-bold text-amber-400">{currentMapFile}</span>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Modifications synchronisées au retour</span>
            </div>
          </div>

          <div className="flex-1 w-full h-[calc(100vh-3.5rem)] bg-white">
            <iframe
              title="Ancien éditeur Weathermap"
              src={`/editor.php?mapname=${encodeURIComponent(currentMapFile)}&embedded=1&rand=${Date.now()}`}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 border border-amber-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-stone-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Error Toast */}
      {loadError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-stone-900/95 border border-amber-500/40 text-amber-300 text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{loadError}</span>
          <button
            onClick={() => setLoadError(null)}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>
        <WeathermapEditor />
      </ReactFlowProvider>
    </QueryClientProvider>
  );
}
