import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { useMapStore } from '../../store/useMapStore';

interface MapBackgroundData {
  width: number;
  height: number;
  background?: string;
  title?: string;
}

export const MapBackgroundNode: React.FC<NodeProps> = ({ data }) => {
  const bgData = data as unknown as MapBackgroundData;
  const { topology } = useMapStore();

  const width = bgData.width || topology?.metadata?.width || 800;
  const height = bgData.height || topology?.metadata?.height || 600;
  const bg = bgData.background ?? topology?.metadata?.background;

  // If no background image is configured, display nothing (no borders, no boxes)
  if (!bg) return null;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
      }}
      className="relative select-none pointer-events-none"
    >
      <img
        src={bg.startsWith('http') || bg.startsWith('/') ? bg : `/${bg}`}
        alt="Campus Map"
        className="w-full h-full object-contain pointer-events-none select-none"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.includes('/images/')) {
            target.src = `/images/${bg.replace(/^images\//, '')}`;
          }
        }}
      />
    </div>
  );
};
