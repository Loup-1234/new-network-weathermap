import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { WeathermapTopology } from '../types/weathermap';

const DEFAULT_FALLBACK_TOPOLOGY: WeathermapTopology = {
  metadata: {
    title: 'Weathermap Live Demo',
    width: 1000,
    height: 700,
    datestamp: new Date().toLocaleTimeString(),
  },
  nodes: [
    { id: 'core-r1', label: 'Core Router 1', x: 220, y: 150, color: '#38bdf8' },
    { id: 'core-r2', label: 'Core Router 2', x: 680, y: 150, color: '#38bdf8' },
    { id: 'dist-sw1', label: 'Distribution SW1', x: 160, y: 380, color: '#34d399' },
    { id: 'dist-sw2', label: 'Distribution SW2', x: 450, y: 450, color: '#34d399' },
    { id: 'edge-gw', label: 'Border Gateway', x: 740, y: 380, color: '#fb923c' },
    { id: 'internet', label: 'Transit Internet', x: 740, y: 580, color: '#a855f7' },
  ],
  links: [
    {
      id: 'core_interconnect',
      source: 'core-r1',
      target: 'core-r2',
      bandwidth_in: 100000000000,
      bandwidth_out: 100000000000,
      bandwidth_in_cfg: '100G',
      bandwidth_out_cfg: '100G',
      in_pct: 64.5,
      out_pct: 42.1,
      in_bytes: 64500000000,
      out_bytes: 42100000000,
      in_color: '#f59e0b',
      out_color: '#10b981',
      width: 8,
    },
    {
      id: 'r1_to_sw1',
      source: 'core-r1',
      target: 'dist-sw1',
      bandwidth_in: 40000000000,
      bandwidth_out: 40000000000,
      bandwidth_in_cfg: '40G',
      bandwidth_out_cfg: '40G',
      in_pct: 88.2,
      out_pct: 73.0,
      in_color: '#ef4444',
      out_color: '#f97316',
      width: 7,
    },
    {
      id: 'r2_to_sw2',
      source: 'core-r2',
      target: 'dist-sw2',
      bandwidth_in: 40000000000,
      bandwidth_out: 40000000000,
      bandwidth_in_cfg: '40G',
      bandwidth_out_cfg: '40G',
      in_pct: 22.4,
      out_pct: 18.9,
      in_color: '#10b981',
      out_color: '#10b981',
      width: 6,
    },
    {
      id: 'r2_to_gw',
      source: 'core-r2',
      target: 'edge-gw',
      bandwidth_in: 100000000000,
      bandwidth_out: 100000000000,
      bandwidth_in_cfg: '100G',
      bandwidth_out_cfg: '100G',
      in_pct: 54.0,
      out_pct: 61.2,
      in_color: '#eab308',
      out_color: '#f59e0b',
      width: 8,
    },
    {
      id: 'gw_to_internet',
      source: 'edge-gw',
      target: 'internet',
      bandwidth_in: 100000000000,
      bandwidth_out: 100000000000,
      bandwidth_in_cfg: '100G',
      bandwidth_out_cfg: '100G',
      in_pct: 81.3,
      out_pct: 79.5,
      in_color: '#ea580c',
      out_color: '#ea580c',
      width: 9,
    },
  ],
  scales: {
    DEFAULT: {
      name: 'DEFAULT',
      entries: [
        { bottom: 0, top: 0, tag: '', color1: '#c0c0c0' },
        { bottom: 0, top: 1, tag: '', color1: '#ffffff' },
        { bottom: 1, top: 10, tag: '', color1: '#8c00ff' },
        { bottom: 10, top: 25, tag: '', color1: '#2020ff' },
        { bottom: 25, top: 40, tag: '', color1: '#00c0ff' },
        { bottom: 40, top: 55, tag: '', color1: '#00f000' },
        { bottom: 55, top: 70, tag: '', color1: '#f0f000' },
        { bottom: 70, top: 85, tag: '', color1: '#ff8000' },
        { bottom: 85, top: 100, tag: '', color1: '#ff0000' },
      ],
    },
  },
};

export async function fetchTopology(endpoint = '/map.json'): Promise<WeathermapTopology> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`Failed to load ${endpoint}: ${res.statusText}`);
    }
    return (await res.json()) as WeathermapTopology;
  } catch (err) {
    console.warn(`Could not load live topology from ${endpoint}, falling back to demo topology.`, err);
    return DEFAULT_FALLBACK_TOPOLOGY;
  }
}

export function useMapData(endpoint = '/map.json') {
  const { setTopology, autoRefresh, refreshInterval } = useMapStore();

  const query = useQuery({
    queryKey: ['weathermap', endpoint],
    queryFn: () => fetchTopology(endpoint),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000,
  });

  useEffect(() => {
    if (query.data) {
      setTopology(query.data);
    }
  }, [query.data, setTopology]);

  return query;
}
