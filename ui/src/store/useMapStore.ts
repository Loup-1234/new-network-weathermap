import { create } from 'zustand';
import type {
  WeathermapTopology,
  NodeData,
  LinkData,
  MapMetadata,
  ScaleData,
  EditorSettings,
  EditorTool,
  SelectedElement,
  ModalType,
} from '../types/weathermap';

interface MapState {
  topology: WeathermapTopology | null;
  history: WeathermapTopology[];
  historyIndex: number;
  selectedElement: SelectedElement | null;
  activeTool: EditorTool;
  linkSourceNodeId: string | null;
  cursorPos: { x: number; y: number };
  editMode: boolean;
  isDirty: boolean;
  activeModal: ModalType;
  settings: EditorSettings;
  availableMaps: Array<{ name: string; title: string; writable: boolean }>;
  currentMapFile: string;
  autoRefresh: boolean;
  refreshInterval: number;

  // Setters & Tool selection
  setTopology: (topology: WeathermapTopology) => void;
  loadTopology: (mapName: string) => Promise<void>;
  setSelectedElement: (element: SelectedElement | null) => void;
  setActiveTool: (tool: EditorTool) => void;
  setLinkSourceNodeId: (id: string | null) => void;
  setCursorPos: (pos: { x: number; y: number }) => void;
  setEditMode: (editMode: boolean) => void;
  toggleEditMode: () => void;
  setActiveModal: (modal: ModalType) => void;
  setSettings: (settings: Partial<EditorSettings>) => void;
  setAvailableMaps: (maps: Array<{ name: string; title: string; writable: boolean }>) => void;
  setCurrentMapFile: (filename: string) => void;
  setAutoRefresh: (autoRefresh: boolean) => void;
  setRefreshInterval: (refreshInterval: number) => void;

  // Graph mutations
  addNode: (x: number, y: number, label?: string) => void;
  addLabel: (x?: number, y?: number, labelText?: string) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  cloneNode: (id: string) => void;

  addLink: (source: string, target: string) => void;
  updateLink: (id: string, updates: Partial<LinkData>) => void;
  deleteLink: (id: string) => void;
  straightenLink: (id: string) => void;
  tidyLink: (id: string) => void;
  tidyAllLinks: () => void;
  addLinkVia: (id: string, x?: number, y?: number) => void;
  updateLinkVia: (id: string, index: number, x: number, y: number) => void;
  removeLinkVia: (id: string, index: number) => void;
  setLinkRouting: (id: string, routing: 'bezier' | 'smoothstep' | 'step' | 'polyline') => void;

  updateMetadata: (updates: Partial<MapMetadata>) => void;
  updateMapMetadata: (updates: Partial<MapMetadata>) => void;
  updateScales: (scales: Record<string, ScaleData>) => void;
  markSaved: () => void;
  undo: () => void;
  redo: () => void;
}

const snapCoordinate = (val: number, snap: number) => {
  if (!snap || snap <= 1) return val;
  return Math.round(val / snap) * snap;
};

// Helper: match percentage to color in scales
const getColorForPercentage = (pct: number, scales?: Record<string, ScaleData>): string => {
  if (!scales || !scales['DEFAULT']?.entries) {
    if (pct === 0) return '#94a3b8';
    if (pct < 25) return '#38bdf8';
    if (pct < 50) return '#34d399';
    if (pct < 75) return '#facc15';
    if (pct < 90) return '#fb923c';
    return '#f43f5e';
  }
  const entries = scales['DEFAULT'].entries;
  for (const entry of entries) {
    if (pct >= entry.bottom && pct <= entry.top) {
      return entry.color1 || '#38bdf8';
    }
  }
  return '#38bdf8';
};

export const useMapStore = create<MapState>((set, get) => ({
  topology: null,
  history: [],
  historyIndex: -1,
  selectedElement: null,
  activeTool: 'select',
  linkSourceNodeId: null,
  cursorPos: { x: 0, y: 0 },
  editMode: true,
  isDirty: false,
  activeModal: null,
  settings: {
    showVias: true,
    showRelative: true,
    gridSnap: 10,
    autoSave: false,
    autoSaveDelay: 3,
  },
  availableMaps: [],
  currentMapFile: 'simple.conf',
  autoRefresh: true,
  refreshInterval: 5000,

  setTopology: (topology) => {
    set((state) => ({
      topology,
      history: [...state.history.slice(0, state.historyIndex + 1), topology],
      historyIndex: state.historyIndex + 1,
      isDirty: false,
    }));
  },

  loadTopology: async (mapName: string) => {
    try {
      const res = await fetch(`/api.php?action=load_map&map=${encodeURIComponent(mapName)}&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const topologyData = data.topology || data;
      if (topologyData && topologyData.nodes) {
        set({ topology: topologyData, currentMapFile: mapName, isDirty: false });
      }
    } catch (e) {
      console.error('Failed to load map topology', e);
    }
  },

  setSelectedElement: (element) => set({ selectedElement: element }),
  setActiveTool: (tool) => set({ activeTool: tool, linkSourceNodeId: null }),
  setLinkSourceNodeId: (id) => set({ linkSourceNodeId: id }),
  setCursorPos: (pos) => set({ cursorPos: pos }),
  setEditMode: (editMode) => set({ editMode, selectedElement: null, activeTool: 'select' }),
  toggleEditMode: () =>
    set((state) => ({ editMode: !state.editMode, selectedElement: null, activeTool: 'select' })),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  setAvailableMaps: (maps) => set({ availableMaps: maps }),
  setCurrentMapFile: (filename) => set({ currentMapFile: filename }),
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
  setRefreshInterval: (refreshInterval) => set({ refreshInterval }),

  addNode: (x, y, label) => {
    const { topology, settings } = get();
    if (!topology) return;
    const snapX = snapCoordinate(x, settings.gridSnap);
    const snapY = snapCoordinate(y, settings.gridSnap);

    const count = topology.nodes.length + 1;
    const id = `node_${count}`;
    const newNode: NodeData = {
      id,
      label: label || `Nœud ${count}`,
      x: snapX,
      y: snapY,
      icon: 'images/WorkgroupSwitch.svg',
    };

    const newTopology = {
      ...topology,
      nodes: [...topology.nodes, newNode],
    };

    set({
      topology: newTopology,
      isDirty: true,
      selectedElement: { type: 'node', id },
      activeTool: 'select',
    });
  },

  addLabel: (x = 400, y = 300, labelText) => {
    const { topology, settings } = get();
    if (!topology) return;
    const snapX = snapCoordinate(x, settings.gridSnap);
    const snapY = snapCoordinate(y, settings.gridSnap);

    const count = topology.nodes.length + 1;
    const id = `label_${count}`;
    const newLabelNode: NodeData = {
      id,
      label: labelText || `Libellé ${count}`,
      raw_label: labelText || `Libellé ${count}`,
      x: snapX,
      y: snapY,
      icon: 'none',
      fontsize: 2, // compact by default (text-xs / 11px)
      fontcolor: '#f59e0b',
      bgcolor: 'badge',
    };

    const newTopology = {
      ...topology,
      nodes: [...topology.nodes, newLabelNode],
    };

    set({
      topology: newTopology,
      isDirty: true,
      selectedElement: { type: 'node', id },
      activeTool: 'select',
    });
  },

  updateNode: (id, updates) => {
    const { topology } = get();
    if (!topology) return;

    const oldNode = topology.nodes.find((n) => n.id === id);
    const dx = updates.x !== undefined && oldNode ? updates.x - oldNode.x : 0;
    const dy = updates.y !== undefined && oldNode ? updates.y - oldNode.y : 0;

    const newNodes = topology.nodes.map((node) => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.lock_to === id && (dx !== 0 || dy !== 0)) {
        return { ...node, x: node.x + dx, y: node.y + dy };
      }
      return node;
    });

    set({
      topology: { ...topology, nodes: newNodes },
      isDirty: true,
    });
  },

  updateNodePosition: (id, x, y) => {
    const { topology, settings } = get();
    if (!topology) return;

    const snapX = snapCoordinate(x, settings.gridSnap);
    const snapY = snapCoordinate(y, settings.gridSnap);

    const oldNode = topology.nodes.find((n) => n.id === id);
    const dx = oldNode ? snapX - oldNode.x : 0;
    const dy = oldNode ? snapY - oldNode.y : 0;

    const newNodes = topology.nodes.map((node) => {
      if (node.id === id) {
        return { ...node, x: snapX, y: snapY };
      }
      if (node.lock_to === id && (dx !== 0 || dy !== 0)) {
        return { ...node, x: node.x + dx, y: node.y + dy };
      }
      return node;
    });

    set({
      topology: { ...topology, nodes: newNodes },
      isDirty: true,
    });
  },

  deleteNode: (id) => {
    const { topology, selectedElement } = get();
    if (!topology) return;

    const newNodes = topology.nodes.filter((n) => n.id !== id);
    const newLinks = topology.links.filter((l) => l.source !== id && l.target !== id);

    set({
      topology: { ...topology, nodes: newNodes, links: newLinks },
      isDirty: true,
      selectedElement: selectedElement?.id === id ? null : selectedElement,
    });
  },

  cloneNode: (id) => {
    const { topology, addNode } = get();
    if (!topology) return;
    const src = topology.nodes.find((n) => n.id === id);
    if (!src) return;
    addNode(src.x + 40, src.y + 40, `${src.label} (Copie)`);
  },

  addLink: (source, target) => {
    const { topology } = get();
    if (!topology || source === target) return;

    const exists = topology.links.some(
      (l) => (l.source === source && l.target === target) || (l.source === target && l.target === source)
    );
    if (exists) {
      alert(`Un lien existe déjà entre ${source} et ${target}`);
      set({ linkSourceNodeId: null, activeTool: 'select' });
      return;
    }

    const defaultBw = topology.metadata?.default_link_bwin || '100M';
    const defaultWidth = topology.metadata?.default_link_width || 6;

    const newLink: LinkData = {
      id: `${source}-${target}`,
      source,
      target,
      bandwidth_in: 100000000,
      bandwidth_out: 100000000,
      bandwidth_in_cfg: defaultBw,
      bandwidth_out_cfg: defaultBw,
      in_pct: 0,
      out_pct: 0,
      in_color: '#38bdf8',
      out_color: '#34d399',
      width: defaultWidth,
      routing: 'bezier',
      commentpos_out: 25,
      commentpos_in: 75,
    };

    set({
      topology: { ...topology, links: [...topology.links, newLink] },
      isDirty: true,
      linkSourceNodeId: null,
      activeTool: 'select',
      selectedElement: { type: 'link', id: newLink.id },
    });
  },

  updateLink: (id, updates) => {
    const { topology } = get();
    if (!topology) return;

    const newLinks = topology.links.map((link) => {
      if (link.id === id) {
        const merged = { ...link, ...updates };
        if (updates.in_pct !== undefined) {
          merged.in_color = getColorForPercentage(updates.in_pct, topology.scales);
        }
        if (updates.out_pct !== undefined) {
          merged.out_color = getColorForPercentage(updates.out_pct, topology.scales);
        }
        return merged;
      }
      return link;
    });

    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  deleteLink: (id) => {
    const { topology, selectedElement } = get();
    if (!topology) return;

    set({
      topology: { ...topology, links: topology.links.filter((l) => l.id !== id) },
      isDirty: true,
      selectedElement: selectedElement?.id === id ? null : selectedElement,
    });
  },

  straightenLink: (id) => {
    const { topology } = get();
    if (!topology) return;

    const newLinks = topology.links.map((l) => (l.id === id ? { ...l, via: [] } : l));
    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  tidyLink: (id) => {
    const { topology } = get();
    if (!topology) return;

    const link = topology.links.find((l) => l.id === id);
    if (!link) return;
    const src = topology.nodes.find((n) => n.id === link.source);
    const dst = topology.nodes.find((n) => n.id === link.target);
    if (!src || !dst) return;

    const viaX = dst.x;
    const viaY = src.y;

    const newLinks = topology.links.map((l) =>
      l.id === id ? { ...l, via: [[viaX, viaY]] as [number, number][], routing: 'step' as const } : l
    );

    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  tidyAllLinks: () => {
    const { topology } = get();
    if (!topology) return;

    const newLinks = topology.links.map((link) => {
      const src = topology.nodes.find((n) => n.id === link.source);
      const dst = topology.nodes.find((n) => n.id === link.target);
      if (!src || !dst) return link;
      return {
        ...link,
        via: [[dst.x, src.y]] as [number, number][],
        routing: 'step' as const,
      };
    });

    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  addLinkVia: (id, x, y) => {
    const { topology } = get();
    if (!topology) return;

    const link = topology.links.find((l) => l.id === id);
    if (!link) return;
    const src = topology.nodes.find((n) => n.id === link.source);
    const dst = topology.nodes.find((n) => n.id === link.target);

    const midX = x !== undefined ? x : src && dst ? Math.round((src.x + dst.x) / 2) : 100;
    const midY = y !== undefined ? y : src && dst ? Math.round((src.y + dst.y) / 2) : 100;

    const newVias: [number, number][] = [...(link.via || []), [midX, midY]];

    const newLinks = topology.links.map((l) => (l.id === id ? { ...l, via: newVias } : l));

    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  updateLinkVia: (id, index, x, y) => {
    const { topology, settings } = get();
    if (!topology) return;

    const snapX = snapCoordinate(x, settings.gridSnap);
    const snapY = snapCoordinate(y, settings.gridSnap);

    const newLinks = topology.links.map((link) => {
      if (link.id !== id || !link.via) return link;
      const newVias: [number, number][] = [...link.via];
      newVias[index] = [snapX, snapY];
      return { ...link, via: newVias };
    });

    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  removeLinkVia: (id, index) => {
    const { topology } = get();
    if (!topology) return;

    const newLinks = topology.links.map((link) => {
      if (link.id !== id || !link.via) return link;
      const newVias = link.via.filter((_, idx) => idx !== index);
      return { ...link, via: newVias };
    });

    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  setLinkRouting: (id, routing) => {
    const { topology } = get();
    if (!topology) return;

    const newLinks = topology.links.map((l) => (l.id === id ? { ...l, routing } : l));
    set({
      topology: { ...topology, links: newLinks },
      isDirty: true,
    });
  },

  updateMetadata: (updates) => {
    const { topology } = get();
    if (!topology) return;

    set({
      topology: { ...topology, metadata: { ...topology.metadata, ...updates } },
      isDirty: true,
    });
  },

  updateMapMetadata: (updates) => {
    const { topology } = get();
    if (!topology) return;

    set({
      topology: { ...topology, metadata: { ...topology.metadata, ...updates } },
      isDirty: true,
    });
  },

  updateScales: (scales) => {
    const { topology } = get();
    if (!topology) return;

    const updatedLinks = topology.links.map((link) => ({
      ...link,
      in_color: getColorForPercentage(link.in_pct, scales),
      out_color: getColorForPercentage(link.out_pct, scales),
    }));

    set({
      topology: { ...topology, scales, links: updatedLinks },
      isDirty: true,
    });
  },

  markSaved: () => set({ isDirty: false }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        topology: history[historyIndex - 1],
        historyIndex: historyIndex - 1,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        topology: history[historyIndex + 1],
        historyIndex: historyIndex + 1,
        isDirty: true,
      });
    }
  },
}));
