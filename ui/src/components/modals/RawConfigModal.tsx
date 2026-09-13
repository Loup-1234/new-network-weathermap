import React, { useState, useEffect } from 'react';
import {
  Code2,
  Save,
  Check,
  RefreshCw,
  Copy,
  AlertCircle,
  X,
  FileCode,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

interface RawConfigModalProps {
  onSaveRaw?: (content: string) => Promise<void>;
}

export const RawConfigModal: React.FC<RawConfigModalProps> = ({ onSaveRaw }) => {
  const {
    activeModal,
    setActiveModal,
    currentMapFile,
    loadTopology,
  } = useMapStore();

  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetMap = currentMapFile || 'simple.conf';

  const loadRawConfig = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch(`/api.php?action=get_raw_config&map=${encodeURIComponent(targetMap)}&_t=${Date.now()}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || `Erreur de chargement (HTTP ${res.status})`);
      } else {
        setRawContent(data.content ?? data.config ?? '');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Erreur de chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'raw_config') {
      loadRawConfig();
    }
  }, [activeModal, targetMap]);

  if (activeModal !== 'raw_config') return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      if (onSaveRaw) {
        await onSaveRaw(rawContent);
      } else {
        const res = await fetch('/api.php?action=save_raw_config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            map: targetMap,
            content: rawContent,
            config: rawContent,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `Erreur lors de la sauvegarde (HTTP ${res.status})`);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadTopology(targetMap);
    } catch (e: any) {
      setErrorMessage(e.message || 'Erreur lors de la sauvegarde du fichier');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = rawContent.substring(0, start) + '\t' + rawContent.substring(end);
      setRawContent(newContent);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveModal(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-4xl bg-stone-900 border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Éditeur de configuration brute
              </h2>
              <span className="text-[11px] font-mono text-amber-400/80">{targetMap}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Reload from server */}
            <button
              type="button"
              onClick={loadRawConfig}
              disabled={loading || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Recharger le fichier depuis le serveur"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Recharger</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              title="Copier dans le presse-papier"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-1"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Code Editor Body */}
        <div className="flex-1 p-4 bg-stone-950 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-amber-400" />
              Syntaxe standard Weathermap (.conf) — Astuce : [Tab] pour indenter, [Ctrl+S] pour enregistrer
            </span>
            <span className="font-mono text-[11px] text-stone-400">
              {rawContent.split('\n').length} lignes • {rawContent.length} caractères
            </span>
          </div>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            spellCheck={false}
            className="w-full flex-1 bg-stone-900 border border-amber-900/30 rounded-xl p-4 font-mono text-xs text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 resize-none overflow-auto leading-relaxed shadow-inner"
            placeholder="# Chargement de la configuration..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80">
          <span className="text-xs text-stone-400">
            Les modifications appliquées ici rechargent directement le canvas de la carte.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-950/40 disabled:opacity-50 ${
                saveSuccess
                  ? 'bg-emerald-500 text-stone-950 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950'
              }`}
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>
                {saving ? 'Enregistrement...' : saveSuccess ? 'Fichier enregistré !' : 'Enregistrer le fichier'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
