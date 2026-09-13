import React from "react";
import { useMapStore } from "../../store/useMapStore";

export const TrafficLoadLegend: React.FC = () => {
  const { topology } = useMapStore();
  if (!topology) return null;

  // Retrieve scale entries from topology, fallback to standard Weathermap scale
  const defaultScale = topology.scales?.["DEFAULT"]?.entries;

  const tiers = defaultScale && defaultScale.length > 0
    ? defaultScale
    : [
        { bottom: 0, top: 1, color1: "#ffffff" },
        { bottom: 1, top: 10, color1: "#94a3b8" },
        { bottom: 10, top: 25, color1: "#0284c7" },
        { bottom: 25, top: 40, color1: "#06b6d4" },
        { bottom: 40, top: 55, color1: "#22c55e" },
        { bottom: 55, top: 70, color1: "#eab308" },
        { bottom: 70, top: 85, color1: "#f97316" },
        { bottom: 85, top: 100, color1: "#ef4444" },
      ];

  return (
    <div className="absolute bottom-20 left-6 z-30 pointer-events-auto select-none bg-stone-950/90 border border-amber-900/40 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Charge réseau
        </span>
        <span className="text-[10px] font-mono text-stone-400 font-medium">
          % bande passante
        </span>
      </div>

      <div className="flex items-center rounded-lg overflow-hidden h-2.5 shadow-inner border border-black/40 min-w-[180px]">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className="flex-1 h-full transition-all hover:scale-y-125"
            style={{ backgroundColor: tier.color1 || "#eab308" }}
            title={`${tier.bottom}% - ${tier.top}%`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 font-medium mt-1.5 tabular-nums">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};
