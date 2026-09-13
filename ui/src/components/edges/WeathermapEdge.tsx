import React, { useState } from 'react';
import { EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import type { LinkData } from '../../types/weathermap';

// Catmull-Rom spline / Bezier interpolation for curved routing ('bezier')
function getCatmullRomSpine(points: [number, number][], samplesPerSeg = 20): [number, number][] {
  if (points.length < 2) return points;
  if (points.length === 2) {
    // Quadratic bezier arch between 2 points
    const [p0, p1] = points;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return points;
    const nx = -dy / dist;
    const ny = dx / dist;
    const curvature = Math.min(50, Math.max(20, dist * 0.16));
    const mx = (p0[0] + p1[0]) / 2 + nx * curvature;
    const my = (p0[1] + p1[1]) / 2 + ny * curvature;

    const res: [number, number][] = [];
    const steps = 36;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const inv = 1 - t;
      const x = inv * inv * p0[0] + 2 * inv * t * mx + t * t * p1[0];
      const y = inv * inv * p0[1] + 2 * inv * t * my + t * t * p1[1];
      res.push([x, y]);
    }
    return res;
  }

  const result: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 0; s < samplesPerSeg; s++) {
      const t = s / samplesPerSeg;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      result.push([x, y]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// 90° Orthogonal step spine ('step')
function getStepSpine(points: [number, number][]): [number, number][] {
  if (points.length < 2) return points;
  const result: [number, number][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    result.push(p1);

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];

    if (Math.abs(dx) > 3 && Math.abs(dy) > 3) {
      const midX = (p1[0] + p2[0]) / 2;
      result.push([midX, p1[1]]);
      result.push([midX, p2[1]]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// Fluid rounded step spine ('smoothstep' with rounded corners)
function getSmoothStepSpine(points: [number, number][]): [number, number][] {
  if (points.length < 2) return points;
  const rawStep = getStepSpine(points);
  if (rawStep.length <= 2) return rawStep;

  const result: [number, number][] = [];
  result.push(rawStep[0]);

  for (let i = 1; i < rawStep.length - 1; i++) {
    const prev = rawStep[i - 1];
    const curr = rawStep[i];
    const next = rawStep[i + 1];

    const d1 = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
    const d2 = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
    const r = Math.min(22, d1 / 2, d2 / 2);

    if (r > 3) {
      const u1x = (curr[0] - prev[0]) / d1;
      const u1y = (curr[1] - prev[1]) / d1;
      const u2x = (next[0] - curr[0]) / d2;
      const u2y = (next[1] - curr[1]) / d2;

      const pStart: [number, number] = [curr[0] - u1x * r, curr[1] - u1y * r];
      const pEnd: [number, number] = [curr[0] + u2x * r, curr[1] + u2y * r];

      result.push(pStart);
      for (let s = 1; s <= 6; s++) {
        const t = s / 7;
        const inv = 1 - t;
        const x = inv * inv * pStart[0] + 2 * inv * t * curr[0] + t * t * pEnd[0];
        const y = inv * inv * pStart[1] + 2 * inv * t * curr[1] + t * t * pEnd[1];
        result.push([x, y]);
      }
      result.push(pEnd);
    } else {
      result.push(curr);
    }
  }

  result.push(rawStep[rawStep.length - 1]);
  return result;
}

// Generate complete spine points based on selected routing mode
function generateSpinePoints(
  source: [number, number],
  target: [number, number],
  vias: [number, number][],
  routing: string
): [number, number][] {
  const basePoints: [number, number][] = [source, ...vias, target];

  switch (routing) {
    case 'smoothstep':
      return getSmoothStepSpine(basePoints);
    case 'step':
      return getStepSpine(basePoints);
    case 'polyline':
      return basePoints;
    case 'bezier':
    default:
      return getCatmullRomSpine(basePoints);
  }
}

// Helper: extract a polyline subpath between distance [dStart, dEnd] along the full spine
function getSubpath(pts: [number, number][], dStart: number, dEnd: number): [number, number][] {
  if (pts.length < 2) return pts;
  if (dStart >= dEnd) return [pts[0]];

  const result: [number, number][] = [];
  let accum = 0;
  let started = false;

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = segLen || 1;
    const nextAccum = accum + segLen;

    if (!started && dStart <= nextAccum) {
      const t = Math.max(0, Math.min(1, (dStart - accum) / len));
      result.push([p1[0] + dx * t, p1[1] + dy * t]);
      started = true;
    }

    if (started) {
      if (dEnd < nextAccum) {
        const t = Math.max(0, Math.min(1, (dEnd - accum) / len));
        result.push([p1[0] + dx * t, p1[1] + dy * t]);
        return result;
      }
      result.push([p2[0], p2[1]]);
    }

    accum = nextAccum;
  }

  if (result.length === 0 && pts.length > 0) {
    result.push(pts[pts.length - 1]);
  }
  return result;
}



export const WeathermapEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}) => {
  const {
    setSelectedElement,
    updateLinkVia,
    removeLinkVia,
    editMode,
    topology,
  } = useMapStore();
  const { screenToFlowPosition } = useReactFlow();
  const linkData = data as unknown as LinkData | undefined;
  const [hoveredLabel, setHoveredLabel] = useState<'in' | 'out' | null>(null);

  const inPct = linkData?.in_pct ?? 0;
  const outPct = linkData?.out_pct ?? 0;
  const inColor = linkData?.in_color || '#38bdf8';
  const outColor = linkData?.out_color || '#34d399';
  const strokeWidth = Math.max(5, Math.min(12, linkData?.width || topology?.metadata?.default_link_width || 6));
  const vias = linkData?.via || [];
  const routing = linkData?.routing || (vias.length > 0 ? 'polyline' : 'bezier');
  const linklabels = topology?.metadata?.linklabels || 'percent';
  const arrowstyle = topology?.metadata?.arrowstyle || 'classic';
  const htmlstyle = topology?.metadata?.htmlstyle || 'overlib';
  const linkfont = Number(topology?.metadata?.linkfont) || 2;

  const badgeFontClass =
    linkfont === 1
      ? 'text-[9px]'
      : linkfont === 3
      ? 'text-[11px]'
      : linkfont === 4
      ? 'text-[12px]'
      : linkfont === 5
      ? 'text-[13px]'
      : 'text-[10px]';

  // Full coordinate spine generated according to chosen routing ('bezier', 'smoothstep', 'step', 'polyline')
  const spinePoints: [number, number][] = generateSpinePoints(
    [sourceX, sourceY],
    [targetX, targetY],
    vias,
    routing
  );

  // Calculate total cumulative length of spine
  let totalLength = 0;
  for (let i = 0; i < spinePoints.length - 1; i++) {
    totalLength += Math.hypot(
      spinePoints[i + 1][0] - spinePoints[i][0],
      spinePoints[i + 1][1] - spinePoints[i][1]
    );
  }

  // Interpolate single point and tangent at specific distance along polyline
  const getPointAndTangentAt = (pts: [number, number][], dist: number): { pt: [number, number]; u: [number, number] } => {
    let accum = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = segLen || 1;
      const u: [number, number] = [dx / len, dy / len];

      if (dist <= accum + segLen || i === pts.length - 2) {
        const t = Math.max(0, Math.min(1, (dist - accum) / len));
        return {
          pt: [p1[0] + dx * t, p1[1] + dy * t],
          u,
        };
      }
      accum += segLen;
    }
    const lastSegDx = pts[pts.length - 1][0] - pts[pts.length - 2][0];
    const lastSegDy = pts[pts.length - 1][1] - pts[pts.length - 2][1];
    const len = Math.hypot(lastSegDx, lastSegDy) || 1;
    return {
      pt: pts[pts.length - 1],
      u: [lastSegDx / len, lastSegDy / len],
    };
  };

  const isCompact = arrowstyle === 'compact';
  // Classic: Very bold, large triangular arrowhead (traditional Weathermap)
  // Compact: Sleek, slim, low-profile and discreet arrowhead
  const arrowLen = isCompact ? Math.max(10, strokeWidth * 1.3) : Math.max(26, strokeWidth * 3.8);
  const arrowWidth = isCompact ? Math.max(5, strokeWidth * 0.75) : Math.max(16, strokeWidth * 2.4);
  const midDist = totalLength * 0.5;

  // Arrow 1 (Outbound: Source -> Center) & Arrow 2 (Inbound: Target -> Center):
  // Both arrow tips meet at midDist (gap = 0), touching each other directly (-><-)
  const dTip1 = Math.max(arrowLen + 2, Math.min(totalLength - arrowLen - 2, midDist));
  const dBase1 = Math.max(0, dTip1 - arrowLen);
  const dShaft1End = dBase1 + 2;

  const { pt: tip1Pt, u: u1 } = getPointAndTangentAt(spinePoints, dTip1);
  const nx1 = -u1[1];
  const ny1 = u1[0];
  const base1X = tip1Pt[0] - u1[0] * arrowLen;
  const base1Y = tip1Pt[1] - u1[1] * arrowLen;
  const arrow1Points = `${tip1Pt[0]},${tip1Pt[1]} ${base1X + nx1 * arrowWidth},${base1Y + ny1 * arrowWidth} ${base1X - nx1 * arrowWidth},${base1Y - ny1 * arrowWidth}`;

  // Shaft 1 runs strictly from 0 to dShaft1End
  const shaft1Points = getSubpath(spinePoints, 0, dShaft1End);

  // Arrow 2: Tip is at dTip2 = dTip1 (touching tip 1 directly at center)
  const dTip2 = dTip1;
  const dBase2 = Math.min(totalLength, dTip2 + arrowLen);
  const dShaft2Start = dBase2 - 2;

  const { pt: tip2Pt, u: u2 } = getPointAndTangentAt(spinePoints, dTip2);
  const nx2 = -u2[1];
  const ny2 = u2[0];
  const base2X = tip2Pt[0] + u2[0] * arrowLen;
  const base2Y = tip2Pt[1] + u2[1] * arrowLen;
  const arrow2Points = `${tip2Pt[0]},${tip2Pt[1]} ${base2X + nx2 * arrowWidth},${base2Y + ny2 * arrowWidth} ${base2X - nx2 * arrowWidth},${base2Y - ny2 * arrowWidth}`;

  // Shaft 2 runs strictly from dShaft2Start to totalLength
  const shaft2Points = getSubpath(spinePoints, dShaft2Start, totalLength);

  // Labels positioned along each shaft.
  // Outbound cannot exceed 40% (max 40%) and defaults close to center (38%).
  // Inbound is symmetrical between 60% and 95% and defaults close to center (62%).
  const outPctPos =
    linkData?.commentpos_out != null && linkData.commentpos_out !== 5
      ? Math.max(5, Math.min(40, linkData.commentpos_out))
      : 25;
  const inPctPos =
    linkData?.commentpos_in != null && linkData.commentpos_in !== 95
      ? Math.max(60, Math.min(95, linkData.commentpos_in))
      : 75;

  const outLabelPos = getPointAndTangentAt(spinePoints, totalLength * (outPctPos / 100)).pt;
  const inLabelPos = getPointAndTangentAt(spinePoints, totalLength * (inPctPos / 100)).pt;

  const buildPath = (pts: [number, number][]) =>
    `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ');

  const path1D = buildPath(shaft1Points);
  const path2D = buildPath(shaft2Points);

  const formatBits = (val?: number) => {
    if (!val || val === 0) return '0 bps';
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)} Gbps`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} Mbps`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)} kbps`;
    return `${val} bps`;
  };

  const outLabelText = linklabels === 'bits' ? formatBits(linkData?.out_bytes) : `${outPct}%`;
  const inLabelText = linklabels === 'bits' ? formatBits(linkData?.in_bytes) : `${inPct}%`;

  const handleViaDragStart = (e: React.MouseEvent, viaIdx: number) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
      updateLinkVia(id, viaIdx, flowPos.x, flowPos.y);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

// Mouse drag on link labels disabled as requested

  return (
    <>
      {/* SVG Arrow Geometry */}
      <g
        className={`group ${editMode ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={(e) => {
          if (!editMode) return;
          e.stopPropagation();
          setSelectedElement({ type: 'link', id });
        }}
      >
        {/* Transparent wide click hit-area for easy selection */}
        <path
          d={buildPath(spinePoints)}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(22, strokeWidth * 3.5)}
        />

        {/* Selection glowing highlight */}
        {selected && editMode && (
          <>
            <path
              d={path1D}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={strokeWidth + 5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.5}
            >
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
            </path>
            <polygon
              points={arrow1Points}
              fill="#f59e0b"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeLinejoin="round"
              opacity={0.5}
            >
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
            </polygon>
            <path
              d={path2D}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={strokeWidth + 5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.5}
            >
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
            </path>
            <polygon
              points={arrow2Points}
              fill="#f59e0b"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeLinejoin="round"
              opacity={0.5}
            >
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
            </polygon>
          </>
        )}

        {/* Direction 1 (Outbound: Source -> Center): Tail rounded at origin, Arrowhead at center */}
        <path
          d={path1D}
          fill="none"
          stroke={outColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors"
        />
        <polygon
          points={arrow1Points}
          fill={outColor}
          stroke={outColor}
          strokeWidth={1}
          strokeLinejoin="round"
          className="transition-colors"
        />

        {/* Direction 2 (Inbound: Target -> Center): Tail rounded at target, Arrowhead at center */}
        <path
          d={path2D}
          fill="none"
          stroke={inColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors"
        />
        <polygon
          points={arrow2Points}
          fill={inColor}
          stroke={inColor}
          strokeWidth={1}
          strokeLinejoin="round"
          className="transition-colors"
        />
      </g>

      {/* Waypoints (VIAs) Handles - visible strictly in Edit mode */}
      {editMode &&
        vias.map(([vx, vy], idx) => (
          <EdgeLabelRenderer key={idx}>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${vx}px,${vy}px)`,
                pointerEvents: 'all',
                zIndex: 1050,
              }}
              className="nodrag nopan group"
              onMouseDown={(e) => handleViaDragStart(e, idx)}
              title={`Waypoint #${idx + 1} (${vx}, ${vy})`}
            >
              <div className="relative flex items-center justify-center cursor-grab active:cursor-grabbing">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-mono font-bold text-[9px] flex items-center justify-center shadow-lg border border-white ring-2 ring-amber-500/50 hover:scale-125 transition-transform">
                  {idx + 1}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLinkVia(id, idx);
                  }}
                  className="absolute -top-3 -right-3 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-lg"
                  title="Supprimer ce waypoint"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </EdgeLabelRenderer>
        ))}

      {/* Modern High-End Network Weathermap Badges (BWLABEL) - Zero Latency Positioning */}
      {linklabels !== 'none' && !linkData?.hide_labels && (
        <EdgeLabelRenderer>
          {/* Outbound Badge (Arrow 1: Source -> Center) */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${outLabelPos[0]}px,${outLabelPos[1]}px)`,
              pointerEvents: 'all',
              zIndex: hoveredLabel === 'out' ? 999999 : 1000,
            }}
            className="nodrag nopan select-none"
            onMouseEnter={() => setHoveredLabel('out')}
            onMouseLeave={() => setHoveredLabel(null)}
            onClick={(e) => {
              if (!editMode) return;
              e.stopPropagation();
              setSelectedElement({ type: 'link', id });
            }}
          >
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-950/95 border border-amber-500/40 text-stone-100 font-mono ${badgeFontClass} font-bold shadow-xl backdrop-blur-md transition-colors duration-100 ${
                editMode ? 'cursor-pointer hover:border-amber-400 hover:scale-105' : 'cursor-default'
              } ${selected && editMode ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-950' : ''}`}
              title={
                editMode
                  ? "Cliquer pour sélectionner le lien"
                  : `Sortie : ${outPct}% (${formatBits(linkData?.out_bytes)})`
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor] shrink-0"
                style={{ backgroundColor: outColor, color: outColor }}
              />
              {linkData?.comments?.out && (
                <span className="text-[8.5px] font-normal text-amber-200/70 border-r border-amber-900/60 pr-1 mr-0.5">
                  {linkData.comments.out}
                </span>
              )}
              <span className="tabular-nums tracking-tight">{outLabelText}</span>
            </div>

            {/* Hover Tooltip (Overlib Style with top priority z-index) */}
            {hoveredLabel === 'out' && htmlstyle !== 'static' && (
              <div
                style={{ zIndex: 999999 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-stone-950/98 border border-amber-500/50 rounded-xl shadow-2xl backdrop-blur-xl text-stone-200 pointer-events-none text-xs animate-in fade-in duration-100"
              >
                <div className="font-bold text-amber-300 text-[11px] border-b border-amber-900/50 pb-1.5 mb-1.5 truncate flex items-center justify-between">
                  <span>{linkData?.source} → {linkData?.target}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 uppercase font-mono">SORTIE</span>
                </div>
                <div className="text-[10px] font-mono space-y-1 text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Charge :</span>
                    <span className="font-bold text-amber-400">{outPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Débit :</span>
                    <span className="font-semibold text-stone-200">{formatBits(linkData?.out_bytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Capacité :</span>
                    <span className="text-stone-400">{linkData?.bandwidth_out_cfg || '100M'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inbound Badge (Arrow 2: Target -> Center) */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${inLabelPos[0]}px,${inLabelPos[1]}px)`,
              pointerEvents: 'all',
              zIndex: hoveredLabel === 'in' ? 999999 : 1000,
            }}
            className="nodrag nopan select-none"
            onMouseEnter={() => setHoveredLabel('in')}
            onMouseLeave={() => setHoveredLabel(null)}
            onClick={(e) => {
              if (!editMode) return;
              e.stopPropagation();
              setSelectedElement({ type: 'link', id });
            }}
          >
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-950/95 border border-amber-500/40 text-stone-100 font-mono ${badgeFontClass} font-bold shadow-xl backdrop-blur-md transition-colors duration-100 ${
                editMode ? 'cursor-pointer hover:border-amber-400 hover:scale-105' : 'cursor-default'
              } ${selected && editMode ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-950' : ''}`}
              title={
                editMode
                  ? "Cliquer pour sélectionner le lien"
                  : `Entrée : ${inPct}% (${formatBits(linkData?.in_bytes)})`
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor] shrink-0"
                style={{ backgroundColor: inColor, color: inColor }}
              />
              {linkData?.comments?.in && (
                <span className="text-[8.5px] font-normal text-amber-200/70 border-r border-amber-900/60 pr-1 mr-0.5">
                  {linkData.comments.in}
                </span>
              )}
              <span className="tabular-nums tracking-tight">{inLabelText}</span>
            </div>

            {/* Hover Tooltip (Overlib Style with top priority z-index) */}
            {hoveredLabel === 'in' && htmlstyle !== 'static' && (
              <div
                style={{ zIndex: 999999 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-stone-950/98 border border-amber-500/50 rounded-xl shadow-2xl backdrop-blur-xl text-stone-200 pointer-events-none text-xs animate-in fade-in duration-100"
              >
                <div className="font-bold text-amber-300 text-[11px] border-b border-amber-900/50 pb-1.5 mb-1.5 truncate flex items-center justify-between">
                  <span>{linkData?.target} → {linkData?.source}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 uppercase font-mono">ENTRÉE</span>
                </div>
                <div className="text-[10px] font-mono space-y-1 text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Charge :</span>
                    <span className="font-bold text-amber-400">{inPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Débit :</span>
                    <span className="font-semibold text-stone-200">{formatBits(linkData?.in_bytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Capacité :</span>
                    <span className="text-stone-400">{linkData?.bandwidth_in_cfg || '100M'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

