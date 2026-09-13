import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { EyeOff } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import type { NodeData } from '../../types/weathermap';

export const NetworkNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const node = data as unknown as NodeData;
  const {
    editMode,
    activeTool,
    linkSourceNodeId,
    setLinkSourceNodeId,
    addLink,
    setSelectedElement,
    topology,
  } = useMapStore();


  const [imgErrorStage, setImgErrorStage] = useState(0);

  React.useEffect(() => {
    setImgErrorStage(0);
  }, [node.icon]);
  const [isHovered, setIsHovered] = useState(false);

  const isCustomLabel = node.icon === 'none';
  const label = node.label || node.id;
  const isLinking = editMode && activeTool === 'add_link';
  const isLinkSource = linkSourceNodeId === node.id;

  const htmlstyle = topology?.metadata?.htmlstyle || 'overlib';
  const nodefont = Number(node.fontsize || topology?.metadata?.nodefont) || 3;

  const fontSizes: Record<number, string> = {
    1: 'text-[9px]',
    2: 'text-[10px]',
    3: 'text-[11px]',
    4: 'text-xs',
    5: 'text-sm',
  };

  // Compact font sizes for custom labels
  const customLabelFontSizes: Record<number, string> = {
    1: 'text-[10px]',
    2: 'text-[11px]',
    3: 'text-xs',
    4: 'text-sm',
    5: 'text-base',
  };

  const labelFontClass = fontSizes[nodefont] || 'text-[11px]';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editMode) return;

    if (activeTool === 'add_link') {
      if (!linkSourceNodeId) {
        setLinkSourceNodeId(node.id);
      } else if (linkSourceNodeId !== node.id) {
        addLink(linkSourceNodeId, node.id);
        setLinkSourceNodeId(null);
      } else {
        setLinkSourceNodeId(null);
      }
      return;
    }

    if (activeTool === 'select') {
      setSelectedElement({ type: 'node', id: node.id });
      return;
    }
  };

  const resolveIconSrc = () => {
    if (isCustomLabel) return '';
    if (imgErrorStage >= 2) return '/images/WorkgroupSwitch.svg';

    if (node.icon) {
      if (node.icon.startsWith('http://') || node.icon.startsWith('https://')) {
        return node.icon;
      }
      const clean = node.icon.replace(/^\/?/, '');
      if (imgErrorStage === 0) {
        return `/${clean}`;
      }
      if (imgErrorStage === 1) {
        if (clean.toLowerCase().endsWith(' .png'.trim())) {
          return `/${clean.replace(/\.png$/i, '.svg')}`;
        }
        if (clean.toLowerCase().endsWith(' .svg'.trim())) {
          return `/${clean.replace(/\.svg$/i, '.png')}`;
        }
        return '/images/WorkgroupSwitch.svg';
      }
    }

    // Default icon heuristics when no explicit icon is specified - defaults cleanly to SVG
    const t = (node.label || node.id).toLowerCase();
    if (t.includes('router') || t.includes('rtr') || t.includes('core') || t.includes('gw-')) {
      return '/images/Router.svg';
    }
    if (
      t.includes('transit') ||
      t.includes('internet') ||
      t.includes('cloud') ||
      t.includes('wan') ||
      t.includes('renater') ||
      t.includes('ipvpn')
    ) {
      return '/images/Cloud-Filled.svg';
    }
    if (t.includes('fw') || t.includes('firewall') || t.includes('security') || t.includes('gw')) {
      return '/images/Firewall.svg';
    }
    if (t.includes('server') || t.includes('srv') || t.includes('host') || t.includes('vm')) {
      return '/images/Host.svg';
    }
    return '/images/WorkgroupSwitch.svg';
  };

  const iconSrc = resolveIconSrc();

  // Handles stay rendered with geometry in DOM for React Flow edge calculations in both modes.
  // Connectable and interactive ONLY when activeTool === 'add_link'.
  const handleVisibility = isLinking
    ? '!opacity-100 !pointer-events-auto cursor-crosshair'
    : '!opacity-0 !pointer-events-none cursor-default';

  // 1. Custom Free Label Rendering (node.icon === 'none')
  if (isCustomLabel) {
    const fontSizeClass = customLabelFontSizes[nodefont] || 'text-xs';
    const textColor = node.fontcolor || node.color || '#f59e0b';
    const isTransparent = node.bgcolor === 'transparent';

    // Style dynamically matches the text color with border, subtle tint & ambient glow
    const badgeStyle: React.CSSProperties = isTransparent
      ? {
          color: textColor,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          boxShadow: 'none',
        }
      : {
          color: textColor,
          backgroundColor: 'rgba(12, 10, 9, 0.88)',
          borderColor: `${textColor}70`,
          boxShadow: `0 4px 14px ${textColor}22`,
        };

    return (
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ zIndex: isHovered ? 999999 : undefined }}
        className={`group relative flex items-center justify-center select-none ${
          !editMode
            ? 'cursor-default'
            : isLinking
            ? 'cursor-crosshair'
            : activeTool === 'select'
            ? 'cursor-pointer'
            : 'cursor-default'
        }`}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="t-top"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="s-top"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="t-bottom"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="s-bottom"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="t-left"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="s-left"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="t-right"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="s-right"
          isConnectable={isLinking}
          className={`!w-2 !h-2 !bg-amber-400 !border !border-stone-950 !rounded-full ${handleVisibility}`}
        />

        {/* Free Floating Label Box - Style dynamically matches textColor */}
        <div
          style={badgeStyle}
          className={`px-2.5 py-1 rounded-xl ${fontSizeClass} font-semibold text-center tracking-wide transition-all border backdrop-blur-md ${
            selected && editMode
              ? 'ring-2 ring-offset-2 ring-offset-stone-950 !border-amber-400'
              : ''
          } ${isLinkSource ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
        >
          {label}
        </div>
      </div>
    );
  }

  // 2. Standard Network Node Rendering (with hardware icon)
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: isHovered ? 999999 : undefined }}
      className={`group relative flex flex-col items-center select-none ${
        !editMode
          ? 'cursor-default'
          : isLinking
          ? 'cursor-crosshair'
          : activeTool === 'select'
          ? 'cursor-pointer'
          : 'cursor-default'
      }`}
    >
      {/* 3D Hardware Icon Container */}
      <div
        className={`relative w-12 h-12 flex items-center justify-center ${
          isLinkSource ? 'ring-2 ring-amber-400 rounded-xl animate-pulse' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="t-top"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="s-top"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />

        <Handle
          type="target"
          position={Position.Bottom}
          id="t-bottom"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="s-bottom"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />

        <Handle
          type="target"
          position={Position.Left}
          id="t-left"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="s-left"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />

        <Handle
          type="target"
          position={Position.Right}
          id="t-right"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="s-right"
          isConnectable={isLinking}
          className={`!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-stone-950 !rounded-full ${handleVisibility}`}
        />

        <img
          src={iconSrc}
          alt={label}
          onError={() => setImgErrorStage((s) => s + 1)}
          className="w-12 h-12 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)] pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {/* Bound Node Text Label (Positioned via settings, or hideable) */}
      {!node.hide_label ? (
        <div
          style={{
            transform: `translate(${node.labeloffsetx || 0}px, ${node.labeloffsety || 0}px)`,
          }}
          onClick={handleClick}
          className={`mt-1 flex flex-col items-center transition-transform ${
            editMode ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          }`}
          title={
            editMode
              ? "Cliquer pour sélectionner l'équipement"
              : undefined
          }
        >
          <div
            className={`px-2 py-0.5 rounded-lg ${labelFontClass} font-bold text-center tracking-wide shadow-md border ${
              selected && editMode
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-stone-950/90 text-stone-200 border-amber-900/40 backdrop-blur-sm hover:border-amber-400/60'
            }`}
          >
            {label}
          </div>
        </div>
      ) : editMode && selected ? (
        /* Discreet helper in edit mode when label is hidden */
        <div
          style={{
            transform: `translate(${node.labeloffsetx || 0}px, ${node.labeloffsety || 0}px)`,
          }}
          className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono text-stone-400 border border-dashed border-stone-600 bg-stone-950/70"
          title="Libellé masqué individuellement"
        >
          <EyeOff className="w-2.5 h-2.5 text-stone-400" />
          <span>(masqué)</span>
        </div>
      ) : null}

      {/* Floating Hover Information Box (Overlib Style with top priority z-index) */}
      {isHovered && htmlstyle !== 'static' && (
        <div
          style={{ zIndex: 999999 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-stone-950/98 border border-amber-500/50 rounded-xl shadow-2xl backdrop-blur-xl text-stone-200 pointer-events-none text-xs animate-in fade-in duration-100"
        >
          <div className="font-bold text-amber-300 text-[11px] border-b border-amber-900/50 pb-1.5 mb-1.5 truncate flex items-center justify-between">
            <span className="truncate">{label}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 uppercase font-mono">NŒUD</span>
          </div>
          <div className="text-[10px] font-mono space-y-1 text-stone-300">
            <div className="flex justify-between">
              <span className="text-stone-400">ID :</span>
              <span className="text-amber-400 font-bold">{id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Position :</span>
              <span className="text-stone-300">({Math.round(node.x)}, {Math.round(node.y)})</span>
            </div>
            {node.lock_to && (
              <div className="flex justify-between">
                <span className="text-stone-400">Parent :</span>
                <span className="text-amber-300">{node.lock_to}</span>
              </div>
            )}
            {node.infourl && (
              <div className="truncate text-amber-400/90 pt-0.5">
                URL : {node.infourl}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
