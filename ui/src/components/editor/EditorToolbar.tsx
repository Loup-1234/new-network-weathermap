import React, { useState } from 'react';
import {
  FolderOpen,
  Save,
  Eye,
  Edit3,
  MousePointer,
  Plus,
  ArrowRightLeft,
  Palette,
  Layout,
  Code2,
  Check,
  History,
  Type,
  Tag,
  Gauge,
  Settings,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

interface EditorToolbarProps {
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  onOpenLegacy?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onSave,
  isSaving = false,
  onOpenLegacy,
}) => {
  const {
    editMode,
    setEditMode,
    activeTool,
    setActiveTool,
    linkSourceNodeId,
    setLinkSourceNodeId,
    setSelectedElement,
    activeModal,
    setActiveModal,
    isDirty,
  } = useMapStore();

  const [saveSuccessFlash, setSaveSuccessFlash] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      await onSave();
      setSaveSuccessFlash(true);
      setTimeout(() => setSaveSuccessFlash(false), 2000);
    }
  };

  const handleToolChange = (tool: 'select' | 'add_node' | 'add_link' | 'add_label') => {
    setActiveTool(tool);
    setLinkSourceNodeId(null);
    if (tool !== 'select') {
      setSelectedElement(null);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-3 pointer-events-none select-none gap-2">
      {/* Left: File & Mode Controls in exact requested order: (Enregistrer, Carte, Source .conf, Ancien éditeur) */}
      <div className="flex items-center gap-1.5 bg-stone-950/90 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
        {/* 1st: Enregistrer (Save button - sans animation) */}
        <button
          onClick={editMode ? handleSave : undefined}
          disabled={isSaving || !editMode}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold shadow-sm ${
            !editMode
              ? 'opacity-50 cursor-not-allowed text-stone-500'
              : saveSuccessFlash
              ? 'bg-emerald-500 text-stone-950 shadow-emerald-500/30 font-bold'
              : isDirty
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-amber-950/40 ring-1 ring-amber-400/50'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title={
            !editMode
              ? 'Passez en mode édition pour enregistrer'
              : saveSuccessFlash
              ? 'Carte enregistrée !'
              : isDirty
              ? 'Modifications non enregistrées ! Cliquer pour sauvegarder.'
              : 'Enregistrer la carte sur le serveur'
          }
        >
          {saveSuccessFlash ? (
            <Check className="w-4 h-4 text-stone-950" />
          ) : (
            <Save
              className={`w-4 h-4 ${
                isDirty && editMode ? 'text-stone-950' : 'text-amber-400'
              }`}
            />
          )}
          <span>
            {isSaving
              ? 'Enregistrement...'
              : saveSuccessFlash
              ? 'Enregistré !'
              : 'Enregistrer'}
          </span>
        </button>

        {/* 2nd: Carte (File Manager) */}
        <button
          onClick={() => setActiveModal(activeModal === 'file_manager' ? null : 'file_manager')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeModal === 'file_manager'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title="Gestionnaire de cartes (ouvrir, créer, dupliquer)"
        >
          <FolderOpen
            className={`w-4 h-4 ${
              activeModal === 'file_manager' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden md:inline">Carte</span>
        </button>

        {/* 3rd: Source .conf (Raw Config Editor) */}
        <button
          onClick={() => setActiveModal(activeModal === 'raw_config' ? null : 'raw_config')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeModal === 'raw_config'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title="Afficher et éditer le fichier source Weathermap (.conf)"
        >
          <Code2
            className={`w-4 h-4 ${
              activeModal === 'raw_config' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden lg:inline">Source .conf</span>
        </button>

        {/* 4th: Ancien éditeur (Legacy Switch) */}
        {onOpenLegacy && (
          <button
            onClick={onOpenLegacy}
            className="h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-stone-300 hover:text-stone-100 hover:bg-stone-800/80 transition-all"
            title="Basculer vers l'ancien éditeur Weathermap (sauvegarde automatique préalable)"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline">Ancien éditeur</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-stone-800 mx-0.5" />

        {/* Mode Switcher (View vs Edit) */}
        <div className="h-8 flex items-center bg-stone-950 p-0.5 rounded-xl border border-stone-800/80">
          <button
            onClick={() => {
              setEditMode(false);
              setSelectedElement(null);
            }}
            className={`h-full flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              !editMode
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Mode consultation (lecture seule, waypoints masqués)"
          >
            <Eye className={`w-3.5 h-3.5 ${!editMode ? 'text-stone-950' : 'text-stone-400'}`} />
            <span>Vue</span>
          </button>

          <button
            onClick={() => setEditMode(true)}
            className={`h-full flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              editMode
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Mode édition (ajouter, déplacer et configurer)"
          >
            <Edit3 className={`w-3.5 h-3.5 ${editMode ? 'text-stone-950' : 'text-stone-400'}`} />
            <span>Édition</span>
          </button>
        </div>
      </div>

      {/* Center: Strictly separated Editing Tools (visible only in Edit mode) */}
      {editMode && (
        <div className="flex items-center gap-1 bg-stone-950/90 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
          {/* Tool 1: Sélection & Déplacement */}
          <button
            onClick={() => handleToolChange('select')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'select'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
            }`}
            title="Sélectionner & déplacer les nœuds (V)"
          >
            <MousePointer
              className={`w-4 h-4 ${
                activeTool === 'select' ? 'text-stone-950' : 'text-amber-400'
              }`}
            />
            <span className="hidden lg:inline">Sélection</span>
          </button>

          {/* Tool 2: Ajouter Nœud */}
          <button
            onClick={() => handleToolChange('add_node')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'add_node'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
            }`}
            title="Ajouter un équipement réseau (N) - Cliquez sur l'emplacement souhaité sur la carte"
          >
            <Plus
              className={`w-4 h-4 ${
                activeTool === 'add_node' ? 'text-stone-950' : 'text-amber-400'
              }`}
            />
            <span className="hidden lg:inline">Nœud</span>
          </button>

          {/* Tool 3: Ajouter Lien */}
          <button
            onClick={() => handleToolChange('add_link')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'add_link'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
            }`}
            title={
              linkSourceNodeId
                ? `Origine: ${linkSourceNodeId}. Cliquez sur la cible !`
                : 'Ajouter un lien (L) - Cliquez sur le nœud source puis cible'
            }
          >
            <ArrowRightLeft
              className={`w-4 h-4 ${
                activeTool === 'add_link' ? 'text-stone-950' : 'text-amber-400'
              }`}
            />
            <span className="hidden lg:inline">
              {linkSourceNodeId ? 'Cible...' : 'Lien'}
            </span>
          </button>

          {/* Tool 4: Ajouter Libellé libre */}
          <button
            onClick={() => handleToolChange('add_label')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'add_label'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
            }`}
            title="Ajouter un libellé personnalisé libre (T) - Cliquez sur l'emplacement souhaité sur la carte"
          >
            <Type
              className={`w-4 h-4 ${
                activeTool === 'add_label' ? 'text-stone-950' : 'text-amber-400'
              }`}
            />
            <span className="hidden lg:inline">Libellé</span>
          </button>
        </div>
      )}

      {/* Right: Functional Configuration Menus */}
      <div className="flex items-center gap-1 bg-stone-950/90 border border-amber-900/40 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
        {/* Map Properties */}
        <button
          onClick={() => setActiveModal(activeModal === 'map_props' ? null : 'map_props')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeModal === 'map_props'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title={editMode ? 'Dimensions, titre & arrière-plan de la carte' : 'Propriétés de la carte'}
        >
          <Layout
            className={`w-4 h-4 ${
              activeModal === 'map_props' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden sm:inline">Propriétés</span>
        </button>

        {/* Map Style */}
        <button
          onClick={() => setActiveModal(activeModal === 'map_style' ? null : 'map_style')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeModal === 'map_style'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title={editMode ? 'Flèches, épaisseur des liaisons et thème graphique' : 'Style d\'affichage'}
        >
          <Palette
            className={`w-4 h-4 ${
              activeModal === 'map_style' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden sm:inline">Style</span>
        </button>

        {/* Map Labels (Étiquettes) */}
        <button
          onClick={() => setActiveModal(activeModal === 'map_labels' ? null : 'map_labels')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeModal === 'map_labels'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title={editMode ? 'Gestion des étiquettes (nœuds, liens et libellés libres)' : 'Étiquettes'}
        >
          <Tag
            className={`w-4 h-4 ${
              activeModal === 'map_labels' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden sm:inline">Étiquettes</span>
        </button>

        {/* Scale / Color Legend */}
        <button
          onClick={() => setActiveModal(activeModal === 'colors' ? null : 'colors')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeModal === 'colors'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title={editMode ? 'Paliers et couleurs de charge du réseau' : 'Échelle des couleurs'}
        >
          <Gauge
            className={`w-4 h-4 ${
              activeModal === 'colors' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden sm:inline">Échelle</span>
        </button>

        <div className="h-4 w-[1px] bg-stone-800 mx-0.5" />

        {/* Settings */}
        <button
          onClick={() => setActiveModal(activeModal === 'settings' ? null : 'settings')}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-xl transition-all ${
            activeModal === 'settings'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
          }`}
          title="Préférences d'affichage, grille et sauvegarde automatique"
        >
          <Settings
            className={`w-4 h-4 ${
              activeModal === 'settings' ? 'text-stone-950' : 'text-amber-400'
            }`}
          />
          <span className="hidden md:inline text-xs font-semibold">Options</span>
        </button>
      </div>
    </header>
  );
};
