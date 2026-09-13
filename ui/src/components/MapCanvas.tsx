import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import { NetworkNode } from './nodes/NetworkNode';
import { WeathermapEdge } from './edges/WeathermapEdge';
import { MapBackgroundNode } from './nodes/MapBackgroundNode';
import { CanvasControls } from './editor/CanvasControls';
import { MapHud } from './editor/MapHud';
import { TrafficLoadLegend } from './editor/TrafficLoadLegend';
import { NodeInspector } from './editor/NodeInspector';
import { LinkInspector } from './editor/LinkInspector';
import { useMapStore } from '../store/useMapStore';
import type { NodeData } from '../types/weathermap';

const nodeTypes = {
  networkNode: NetworkNode,
  mapBackground: MapBackgroundNode,
};

const edgeTypes = {
  weathermapEdge: WeathermapEdge,
};

// Calculate optimal cardinal handles based on relative node positions
const getBestHandles = (src?: NodeData, dst?: NodeData) => {
  if (!src || !dst) {
    return { sourceHandle: 's-right', targetHandle: 't-left' };
  }
  const dx = dst.x - src.x;
  const dy = dst.y - src.y;

  // Decide if horizontal or vertical axis dominates
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      return { sourceHandle: 's-right', targetHandle: 't-left' };
    } else {
      return { sourceHandle: 's-left', targetHandle: 't-right' };
    }
  } else {
    if (dy >= 0) {
      return { sourceHandle: 's-bottom', targetHandle: 't-top' };
    } else {
      return { sourceHandle: 's-top', targetHandle: 't-bottom' };
    }
  }
};

export const MapCanvas: React.FC = () => {
  const {
    topology,
    editMode,
    activeTool,
    settings,
    addNode,
    addLabel,
    addLink,
    setLinkSourceNodeId,
    updateNodePosition,
    setSelectedElement,
  } = useMapStore();

  const { screenToFlowPosition } = useReactFlow();

  // If no map is loaded or used, display nothing
  const hasMapContent = Boolean(
    topology &&
    (topology.nodes?.length > 0 ||
      topology.links?.length > 0 ||
      topology.metadata?.background)
  );

  const canDrag = editMode && activeTool === 'select';
  const canSelect = editMode && activeTool === 'select';
  const canConnect = editMode && activeTool === 'add_link';

  // Convert Weathermap nodes & background into React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!topology || !hasMapContent) return [];
    const result: Node[] = [];

    // Background map node (only if background image is configured)
    if (topology.metadata?.background) {
      result.push({
        id: '__map_background__',
        type: 'mapBackground',
        position: { x: 0, y: 0 },
        data: {
          width: topology.metadata.width || 800,
          height: topology.metadata.height || 600,
          background: topology.metadata.background,
          title: topology.metadata.title,
        },
        selectable: false,
        draggable: false,
        deletable: false,
        focusable: false,
        zIndex: -1000,
      });
    }

    // Network Nodes placed on top of the campus background
    if (topology.nodes) {
      for (const node of topology.nodes) {
        result.push({
          id: node.id,
          type: 'networkNode',
          position: { x: node.x, y: node.y },
          data: node as unknown as Record<string, unknown>,
          draggable: canDrag,
          selectable: canSelect,
          zIndex: 10,
        });
      }
    }

    return result;
  }, [topology, hasMapContent, canDrag, canSelect]);

  // Convert Weathermap links into React Flow custom edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!topology || !topology.links) return [];

    const nodeMap = new Map<string, NodeData>();
    for (const node of topology.nodes || []) {
      nodeMap.set(node.id, node);
    }

    return topology.links.map((link) => {
      const srcNode = nodeMap.get(link.source);
      const dstNode = nodeMap.get(link.target);
      const { sourceHandle, targetHandle } = getBestHandles(srcNode, dstNode);

      return {
        id: link.id,
        source: link.source,
        target: link.target,
        type: 'weathermapEdge',
        sourceHandle,
        targetHandle,
        data: link as unknown as Record<string, unknown>,
        selectable: canSelect,
      };
    });
  }, [topology, canSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes & edges when underlying topology or activeTool changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      if (!editMode || node.id === '__map_background__') return;
      updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [editMode, updateNodePosition]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (canConnect && connection.source && connection.target) {
        addLink(connection.source, connection.target);
      }
    },
    [canConnect, addLink]
  );

  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (editMode && activeTool === 'add_node') {
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        addNode(flowPos.x, flowPos.y);
        return;
      }
      if (editMode && activeTool === 'add_label') {
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        addLabel(flowPos.x, flowPos.y);
        return;
      }
      if (editMode && activeTool === 'add_link') {
        setLinkSourceNodeId(null);
      }
      setSelectedElement(null);
    },
    [editMode, activeTool, addNode, addLabel, screenToFlowPosition, setSelectedElement, setLinkSourceNodeId]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      useMapStore.getState().setCursorPos(flowPos);
    },
    [screenToFlowPosition]
  );

  const canvasTheme = settings.canvasTheme || 'obsidian';
  const themeBgMap: Record<string, string> = {
    obsidian: '#0c0a09',
    slate: '#0f172a',
    navy: '#0a1128',
    blueprint: '#051923',
  };
  const bgColor = themeBgMap[canvasTheme] || '#0c0a09';

  if (!hasMapContent) {
    return <div className="w-full h-full" style={{ backgroundColor: bgColor }} />;
  }

  const isGridActive = editMode && (settings.gridSnap || 0) > 0;
  const gridGap = settings.gridSnap || 20;

  return (
    <div
      className={`w-full h-full relative overflow-hidden ${
        editMode && (activeTool === 'add_node' || activeTool === 'add_label')
          ? 'cursor-cell'
          : editMode && activeTool === 'add_link'
          ? 'cursor-crosshair'
          : ''
      }`}
      style={{ backgroundColor: bgColor }}
      onMouseMove={handleMouseMove}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={5}
        nodesDraggable={canDrag}
        nodesConnectable={canConnect}
        elementsSelectable={canSelect}
        snapToGrid={isGridActive}
        snapGrid={[gridGap, gridGap]}
        defaultEdgeOptions={{ type: 'weathermapEdge' }}
      >
        {/* Visual grid indicator: ONLY rendered in edit mode when a grid size is chosen */}
        {isGridActive && (
          <Background
            variant={gridGap < 20 ? BackgroundVariant.Dots : BackgroundVariant.Lines}
            gap={gridGap}
            size={1}
            color="rgba(245, 158, 11, 0.12)"
          />
        )}

        {/* Traffic Load scale legend on canvas */}
        {settings.showTrafficLegend !== false && <TrafficLoadLegend />}

        {/* High-contrast zoom & navigation controls (Bottom-Left) */}
        <CanvasControls />

        {/* Discrete bottom-right credit watermark */}
        <MapHud />
      </ReactFlow>

      {/* Slide-in Inspector for Selected Node or Link (Only active in Edit mode) */}
      {editMode && (
        <>
          <NodeInspector />
          <LinkInspector />
        </>
      )}
    </div>
  );
};

