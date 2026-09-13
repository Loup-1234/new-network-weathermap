import type { Node, Edge } from '@xyflow/react';

export interface MapMetadata {
  title?: string;
  background?: string;
  width?: number;
  height?: number;
  htmlstyle?: 'static' | 'overlib';
  arrowstyle?: 'classic' | 'compact';
  linklabels?: 'percent' | 'bits' | 'none';
  htmlfile?: string;
  imagefile?: string;
  nodefont?: number;
  linkfont?: number;
  legendfont?: number;
  filename?: string;
  datestamp?: string;
  default_link_width?: number;
  default_link_bwin?: string;
  default_link_bwout?: string;
}

export interface ArtificialIcon {
  type: 'box' | 'round' | 'rbox';
  width: number;
  height: number;
  color?: string;
}

export interface NodeData {
  id: string;
  label: string;
  raw_label?: string;
  x: number;
  y: number;
  icon?: string;
  target?: string;
  aicon?: ArtificialIcon;
  lock_to?: string;
  infourl?: string;
  hover?: string;
  overliburl?: string;
  color?: string | null;
  bgcolor?: string;
  fontsize?: number;
  fontcolor?: string;
  notes?: Record<string, string>;
  labeloffsetx?: number;
  labeloffsety?: number;
  labeloffset?: string;
  hide_label?: boolean;
  hints?: Record<string, string>;
  [key: string]: unknown;
}

export interface LinkComments {
  in: string;
  out: string;
}

export interface LinkInfoUrl {
  in: string;
  out: string;
}

export interface LinkData {
  id: string;
  source: string;
  target: string;
  bandwidth_in: number;
  bandwidth_out: number;
  bandwidth_in_cfg?: string;
  bandwidth_out_cfg?: string;
  in_pct: number;
  out_pct: number;
  in_bytes?: number;
  out_bytes?: number;
  in_color: string;
  out_color: string;
  width: number;
  via?: [number, number][];
  routing?: 'bezier' | 'smoothstep' | 'step' | 'polyline';
  comments?: LinkComments;
  infourl?: string | LinkInfoUrl;
  hover?: { in?: string; out?: string };
  target_ds?: string;
  commentpos_in?: number;
  commentpos_out?: number;
  notes?: Record<string, string>;
  hide_labels?: boolean;
  hints?: Record<string, string>;
  [key: string]: unknown;
}

export interface ScaleEntry {
  bottom: number;
  top: number;
  tag?: string;
  color1?: string | null;
  color2?: string | null;
}

export interface ScaleData {
  name: string;
  entries: ScaleEntry[];
}

export interface WeathermapTopology {
  metadata: MapMetadata;
  nodes: NodeData[];
  links: LinkData[];
  scales: Record<string, ScaleData>;
}

export interface EditorSettings {
  showVias: boolean;
  showRelative: boolean;
  gridSnap: number; // 0, 5, 10, 15, 20, 50, 100
  autoSave: boolean; // Autosave désactivé par défaut
  autoSaveDelay?: number; // Délai en secondes (défaut 3s)
  canvasTheme?: 'obsidian' | 'navy' | 'slate' | 'blueprint';
  showTrafficLegend?: boolean;
}

export type EditorTool =
  | 'select'
  | 'add_node'
  | 'add_link'
  | 'add_label'
  | 'add_via'
  | 'delete_node'
  | 'delete_link'
  | 'move_node';

export interface SelectedElement {
  type: 'node' | 'link';
  id: string;
}

export type ModalType =
  | 'file_manager'
  | 'map_props'
  | 'map_style'
  | 'map_labels'
  | 'colors'
  | 'node_defaults'
  | 'link_defaults'
  | 'raw_config'
  | 'settings'
  | null;

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge<LinkData>;
