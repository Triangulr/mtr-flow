'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type FlowData, type Station } from '@/lib/api';
import { cn } from '@/lib/utils';
import * as d3 from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  INTERCHANGE_CONFIGS,
  getInterchangeCirclePositions,
  LINE_COLORS
} from '@/lib/interchange-config';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { TrainArrivalsTooltip } from './train-arrivals-tooltip';

interface SystemMapProps {
  stations: Station[];
  flowDataMap: Map<string, FlowData | null>;
}

// -----------------------------------------------------------------------------
// MAP CONFIGURATION
// -----------------------------------------------------------------------------
type Coord = { x: number; y: number; labelAlign?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };

// Map data extracted from SVG (0-300 coordinate space)
// Manually adjusted positions via map editor
const STATIONS: Record<string, Coord> = {
  "TUM": { "x": 24, "y": 148.1 },
  "SIH": { "x": 24, "y": 130.5 },
  "TIS": { "x": 24, "y": 117 },
  "LOP": { "x": 35.6, "y": 117.4 },
  "YUL": { "x": 36, "y": 132 },
  "KSR": { "x": 36, "y": 148.1 },
  "TWW": { "x": 43.9, "y": 159.8 },
  "TUC": { "x": 43, "y": 216 },
  "AIR": { "x": 40, "y": 206 },
  "AWE": { "x": 46, "y": 199 },
  "SUN": { "x": 58.5, "y": 201 },
  "TSY": { "x": 73.9, "y": 185.3 },
  "DIS": { "x": 64.9, "y": 208.5 },
  "KET": { "x": 59, "y": 239 },
  "HKU": { "x": 72, "y": 239 },
  "SYP": { "x": 87, "y": 239 },
  "SHW": { "x": 103, "y": 239 },
  "CEN": { "x": 119.6, "y": 238.9 },
  "ADM": { "x": 132, "y": 239.3 },
  "WAC": { "x": 153, "y": 238.9 },
  "CAB": { "x": 169.1, "y": 238.9 },
  "TIH": { "x": 186, "y": 239 },
  "FOH": { "x": 201, "y": 239 },
  "NOP": { "x": 216.8, "y": 238.5 },
  "QUB": { "x": 231.8, "y": 238.5 },
  "TAK": { "x": 245, "y": 239 },
  "SWH": { "x": 258, "y": 239 },
  "SKW": { "x": 270, "y": 241.9 },
  "HFC": { "x": 273.8, "y": 254.3 },
  "CHW": { "x": 274, "y": 267 },
  "OCP": { "x": 136.9, "y": 259.7 },
  "WCH": { "x": 121.1, "y": 270.9 },
  "LET": { "x": 96.4, "y": 282.2 },
  "SOH": { "x": 72, "y": 282.2 },
  "TST": { "x": 136.9, "y": 214.1 },
  "JOR": { "x": 136.5, "y": 204.8 },
  "YMT": { "x": 137.3, "y": 196.1 },
  "MOK": { "x": 137.3, "y": 187.5 },
  "PRE": { "x": 137.3, "y": 178.1 },
  "SSP": { "x": 129, "y": 171 },
  "CSW": { "x": 118, "y": 171 },
  "LCK": { "x": 107, "y": 171 },
  "MEF": { "x": 97.9, "y": 171.4 },
  "LAK": { "x": 86.6, "y": 171.4 },
  "KWF": { "x": 75, "y": 171 },
  "KWH": { "x": 64, "y": 171 },
  "TWH": { "x": 52, "y": 171 },
  "TSW": { "x": 40, "y": 171 },
  "WHA": { "x": 195.4, "y": 212.4 },
  "HOM": { "x": 185.6, "y": 203.6 },
  "SKM": { "x": 150.8, "y": 170.8 },
  "KOT": { "x": 166, "y": 171 },
  "LOF": { "x": 179.3, "y": 170.8 },
  "WTS": { "x": 190.9, "y": 170.8 },
  "DIH": { "x": 210.4, "y": 170.8 },
  "CHH": { "x": 219.4, "y": 170.8 },
  "KOB": { "x": 228.4, "y": 170.8 },
  "NTK": { "x": 234.8, "y": 178.9 },
  "KWT": { "x": 234.8, "y": 190.9 },
  "LAT": { "x": 234.8, "y": 204.2 },
  "YAT": { "x": 242.3, "y": 213.8 },
  "TIK": { "x": 264, "y": 213.8 },
  "TKO": { "x": 283.9, "y": 213.8 },
  "HAH": { "x": 290.3, "y": 194.3 },
  "POA": { "x": 289.9, "y": 178.9 },
  "LHP": { "x": 289.9, "y": 223.9 },
  "NAC": { "x": 96.8, "y": 184.5 },
  "OLY": { "x": 96.4, "y": 198 },
  "KOW": { "x": 96, "y": 212.6 },
  "HOK": { "x": 111.4, "y": 234.4 },
  "AUS": { "x": 116.6, "y": 202.5 },
  "ETS": { "x": 143.6, "y": 218.6 },
  "HUH": { "x": 165.4, "y": 212.1 },
  "EXC": { "x": 147, "y": 229.9 },
  "WEK": { "x": 106.9, "y": 207 },
  "SUW": { "x": 202.1, "y": 191.4 },
  "KAT": { "x": 208.9, "y": 184.9 },
  "HIK": { "x": 188.6, "y": 159.9 },
  "TAW": { "x": 166.1, "y": 155.6 },
  "CKT": { "x": 189, "y": 147.9 },
  "STW": { "x": 189, "y": 131.4 },
  "CIO": { "x": 199.9, "y": 114.2 },
  "SHM": { "x": 219, "y": 114.2 },
  "TSH": { "x": 237, "y": 114.2 },
  "HEO": { "x": 255.4, "y": 114.2 },
  "MOS": { "x": 272.3, "y": 114.2 },
  "WKS": { "x": 289.1, "y": 114.2 },
  "MKK": { "x": 166.1, "y": 187.7 },
  "FOT": { "x": 166, "y": 127 },
  "RAC": { "x": 172, "y": 127 },
  "UNI": { "x": 153.8, "y": 113.8 },
  "TAP": { "x": 142.5, "y": 113.8 },
  "TWO": { "x": 131.6, "y": 113.8 },
  "FAN": { "x": 119.3, "y": 113.8 },
  "SHS": { "x": 106.9, "y": 113.8 },
  "LOW": { "x": 93.8, "y": 113.8 },
  "LMC": { "x": 86.6, "y": 118.3 }
};

// Interchange rotation angles (in degrees)
const INTERCHANGE_ROTATIONS: Record<string, number> = {
  "YAT": 90,
  "TIK": 90,
  "QUB": 90,
  "NOP": 90,
  "HOK": 90,
  "CEN": 270,
  "SUN": 90,
  "HOM": 90
};

// Non-MTR stations (displayed but not clickable/no data)
const NON_MTR_STATIONS = new Set(['WEK']);

// Map segments extracted from SVG
const LINE_SEGMENTS = [
  {
    "id": "line-AEL",
    "code": "AEL",
    "d": "M 96.0 234.0 L 97.0 235.0 M 40.0 205.0 L 46.0 199.0 M 45.0 212.0 L 46.0 212.0 M 87.0 173.0 L 95.0 173.0 M 46.0 212.0 L 61.0 197.0 M 61.0 197.0 L 63.0 197.0 M 63.0 197.0 L 87.0 173.0 M 40.0 207.0 L 45.0 212.0 M 96.0 174.0 L 96.0 234.0 M 97.0 235.0 L 120.0 235.0 M 95.0 173.0 L 96.0 174.0 M 40.0 205.0 L 40.0 207.0",
    "dashed": false
  },
  {
    "id": "line-TCL",
    "code": "TCL",
    "d": "M 59.0 200.0 L 59.0 201.0 M 59.0 200.0 L 61.0 198.0 M 87.0 172.0 L 95.0 172.0 M 97.0 233.0 L 98.0 234.0 M 43.0 216.0 L 57.0 202.0 M 95.0 172.0 L 97.0 174.0 M 63.0 196.0 L 87.0 172.0 M 97.0 234.0 L 120.0 234.0 M 58.0 202.0 L 59.0 201.0 M 57.0 202.0 L 58.0 202.0 M 97.0 174.0 L 97.0 234.0",
    "dashed": false
  },
  {
    "id": "line-DRL",
    "code": "DRL",
    "d": "M 64.0 200.0 L 65.0 201.0 M 61.0 200.0 L 64.0 200.0 M 59.0 202.0 L 61.0 200.0 M 65.0 201.0 L 65.0 208.0",
    "dashed": false
  },
  {
    "id": "line-TWL",
    "code": "TWL",
    "d": "M 120.0 238.0 L 136.0 238.0 M 137.0 220.0 L 137.0 237.0 M 40.0 171.0 L 132.0 171.0 M 136.0 238.0 L 137.0 237.0 M 137.0 176.0 L 137.0 218.0 M 132.0 171.0 L 137.0 176.0",
    "dashed": false
  },
  {
    "id": "line-TML",
    "code": "TML",
    "d": "M 167.0 211.0 L 174.0 204.0 M 36.0 156.0 L 40.0 160.0 M 189.0 121.0 L 196.0 114.0 M 167.0 159.0 L 168.0 160.0 M 133.0 219.0 L 158.0 219.0 M 167.0 153.0 L 168.0 152.0 M 98.0 184.0 L 133.0 219.0 M 190.0 204.0 L 211.0 183.0 M 168.0 152.0 L 187.0 152.0 M 189.0 121.0 L 189.0 150.0 M 167.0 153.0 L 167.0 159.0 M 95.0 160.0 L 98.0 163.0 M 34.0 114.0 L 36.0 116.0 M 168.0 160.0 L 210.0 160.0 M 98.0 172.0 L 98.0 184.0 M 210.0 160.0 L 211.0 161.0 M 40.0 160.0 L 95.0 160.0 M 187.0 152.0 L 189.0 150.0 M 36.0 116.0 L 36.0 156.0 M 158.0 219.0 L 165.0 212.0 M 211.0 172.0 L 211.0 183.0 M 24.0 116.0 L 24.0 148.0 M 196.0 114.0 L 290.0 114.0 M 174.0 204.0 L 190.0 204.0 M 211.0 161.0 L 211.0 170.0 M 26.0 114.0 L 34.0 114.0 M 98.0 163.0 L 98.0 170.0 M 24.0 116.0 L 26.0 114.0",
    "dashed": false
  },
  {
    "id": "line-KTL",
    "code": "KTL",
    "d": "M 232.0 171.0 L 235.0 174.0 M 143.0 171.0 L 232.0 171.0 M 188.0 205.0 L 195.0 212.0 M 138.0 176.0 L 143.0 171.0 M 138.0 176.0 L 138.0 200.0 M 138.0 200.0 L 141.0 203.0 M 141.0 203.0 L 165.0 203.0 M 235.0 210.0 L 238.0 213.0 M 167.0 203.0 L 186.0 203.0 M 235.0 174.0 L 235.0 210.0 M 238.0 213.0 L 264.0 213.0",
    "dashed": false
  },
  {
    "id": "line-ISL",
    "code": "ISL",
    "d": "M 59.0 239.0 L 138.0 239.0 M 274.0 246.0 L 274.0 267.0 M 267.0 239.0 L 274.0 246.0 M 140.0 239.0 L 267.0 239.0",
    "dashed": false
  },
  {
    "id": "line-TKL",
    "code": "TKL",
    "d": "M 234.0 238.0 L 235.0 237.0 M 235.0 217.0 L 235.0 237.0 M 235.0 217.0 L 238.0 214.0 M 284.0 214.0 L 290.0 220.0 M 238.0 214.0 L 284.0 214.0 M 290.0 179.0 L 290.0 208.0 M 290.0 220.0 L 290.0 224.0 M 217.0 238.0 L 234.0 238.0 M 284.0 214.0 L 290.0 208.0",
    "dashed": false
  },
  {
    "id": "line-SIL",
    "code": "SIL",
    "d": "M 131.0 271.0 L 137.0 265.0 M 131.0 241.0 L 135.0 241.0 M 72.0 282.0 L 100.0 282.0 M 135.0 241.0 L 137.0 243.0 M 100.0 282.0 L 111.0 271.0 M 111.0 271.0 L 131.0 271.0 M 137.0 243.0 L 137.0 265.0",
    "dashed": false
  },
  {
    "id": "line-EAL",
    "code": "EAL",
    "d": "M 166.0 120.0 L 166.0 170.0 M 101.0 118.0 L 102.0 117.0 M 94.0 114.0 L 160.0 114.0 M 102.0 114.0 L 102.0 117.0 M 131.0 240.0 L 138.0 240.0 M 101.0 114.0 L 102.0 115.0 M 160.0 114.0 L 166.0 120.0 M 138.0 240.0 L 166.0 212.0 M 102.0 115.0 L 103.0 114.0 M 166.0 172.0 L 166.0 212.0 M 87.0 118.0 L 101.0 118.0 M 172.0 125.0 L 172.0 129.0 M 171.0 124.0 L 172.0 125.0 M 167.0 130.0 L 171.0 130.0 M 167.0 124.0 L 171.0 124.0 M 171.0 130.0 L 172.0 129.0",
    "dashed": false
  },
  {
    "id": "connection-TST-ETS",
    "code": "CONNECTION",
    "d": "M 136.9 214.1 L 143.6 218.6",
    "dashed": true
  },
  {
    "id": "connection-KOW-AUS",
    "code": "CONNECTION",
    "d": "M 96 212.6 L 116.6 202.5",
    "dashed": true
  }
];

export function SystemMap({ stations, flowDataMap }: SystemMapProps) {
  const router = useRouter();
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Helper to get crowding color
  const getCrowdingColor = (code: string) => {
    const data = flowDataMap.get(code);
    if (!data) return '#e5e7eb';
    switch (data.crowding_level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#e5e7eb';
    }
  };

  // Helper to split station name into lines
  const splitStationName = (name: string): string[] => {
    const words = name.split(' ');
    if (words.length === 1) {
      return [name]; // Single word, no split
    } else if (words.length === 2) {
      return words; // Two words, split into 2 lines
    } else if (words.length === 3) {
      // Three words: first word, then last two words
      return [words[0], words.slice(1).join(' ')];
    } else {
      // 4+ words: group intelligently
      return [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
    }
  };

  // Setup d3-zoom
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = select(svgRef.current);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k
        });
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current)
        .transition()
        .duration(500)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity
        );
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[800px] bg-slate-950 rounded-xl shadow-sm border border-border overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-md border border-slate-800 text-xs font-medium text-slate-400">
        System Map
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-sm text-[10px] text-slate-500 max-w-[200px]">
        Map data derived from schematic SVG.
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-slate-900/90 backdrop-blur hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-slate-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-slate-900/90 backdrop-blur hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-slate-300" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-slate-900/90 backdrop-blur hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      <TooltipProvider>
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {/* 1. DRAW LINES */}
            {LINE_SEGMENTS.map((segment) => (
              <path
                key={segment.id}
                d={segment.d}
                fill="none"
                stroke={LINE_COLORS[segment.code] || '#999'}
                strokeWidth={segment.dashed ? "0.8" : "1"} // Adjusted for 300px viewbox
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={segment.dashed ? "2 1.5" : "none"}
                className="opacity-90"
              />
            ))}

            {/* 2. DRAW STATIONS */}
            {Object.entries(STATIONS).map(([code, coord]) => {
              const isNonMTR = NON_MTR_STATIONS.has(code);
              const stationName = code === 'WEK'
                ? 'Hong Kong West Kowloon'
                : (stations.find(s => s.code === code)?.name || code);
              const flowData = flowDataMap.get(code);
              const crowdingColor = getCrowdingColor(code);
              const isHovered = hoveredStation === code;
              const interchangeConfig = INTERCHANGE_CONFIGS[code];
              const isInterchange = !!interchangeConfig;

              // Adjust label position based on map data or defaults
              const labelX = coord.x;
              const labelY = coord.y;

              return (
                <g
                  key={code}
                  onClick={() => !isNonMTR && router.push(`/station/${code}`)}
                  onMouseEnter={() => setHoveredStation(code)}
                  onMouseLeave={() => setHoveredStation(null)}
                  className={isNonMTR ? "cursor-default transition-all duration-200" : "cursor-pointer transition-all duration-200"}
                >
                  {/* Hit area */}
                  <circle cx={coord.x} cy={coord.y} r={3} fill="transparent" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        {isInterchange && interchangeConfig ? (
                          // Interchange: Adjacent circles
                          <>
                            {getInterchangeCirclePositions(
                              interchangeConfig,
                              coord.x,
                              coord.y,
                              new Map(), // Offsets no longer needed
                              1.5, // Reduced radius for 300px viewbox
                              INTERCHANGE_ROTATIONS[code] || 0 // Apply rotation
                            ).map((circle, idx) => (
                              <circle
                                key={idx}
                                cx={circle.x}
                                cy={circle.y}
                                r={isHovered ? 1.8 : 1.5}
                                fill={circle.color}
                                stroke={crowdingColor}
                                strokeWidth={isHovered ? 0.8 : 0.5}
                                className="transition-all duration-300"
                              />
                            ))}
                          </>
                        ) : (
                          // Standard Station: Dot
                          <g>
                            <circle
                              cx={coord.x}
                              cy={coord.y}
                              r={isHovered ? 1.8 : 1.2}
                              fill={crowdingColor}
                              stroke="#0f172a"
                              strokeWidth="0.4"
                              className="transition-all duration-300"
                            />
                            <circle
                              cx={coord.x}
                              cy={coord.y}
                              r={isHovered ? 0.8 : 0.5}
                              fill="white"
                              className="transition-all duration-300"
                            />
                          </g>
                        )}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 bg-slate-900/95 border-slate-700">
                      <TrainArrivalsTooltip
                        stationCode={code}
                        stationName={stationName}
                        crowdingLevel={flowData?.crowding_level}
                        isInterchange={isInterchange}
                        isNonMTR={isNonMTR}
                      />
                    </TooltipContent>
                  </Tooltip>

                  {/* Label */}
                  <g className="pointer-events-none">
                    {(() => {
                      const lines = splitStationName(stationName);
                      const lineHeight = 2.8;
                      const fontSize = isHovered ? 3 : 2.5;
                      const baseY = labelY + (isInterchange ? 4 : 3);

                      return (
                        <>
                          {/* Multi-line text */}
                          <text
                            x={labelX}
                            y={baseY}
                            textAnchor="middle"
                            className={cn(
                              "font-semibold fill-slate-300 select-none transition-all tracking-wide",
                              isHovered ? "font-bold fill-white" : "",
                              isInterchange ? "text-slate-100 font-bold" : ""
                            )}
                            style={{
                              fontSize: `${fontSize}px`,
                              textShadow: isHovered ? 'none' : '0 0.5px 1px rgba(0,0,0,0.9)'
                            }}
                          >
                            {lines.map((line, idx) => (
                              <tspan
                                key={idx}
                                x={labelX}
                                dy={idx === 0 ? 0 : lineHeight}
                              >
                                {line}
                              </tspan>
                            ))}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </TooltipProvider>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-800 shadow-sm">
        <div className="text-xs font-semibold mb-2 text-slate-300">Crowding Levels</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-slate-900 shadow-sm" />
            <span className="text-xs text-slate-400">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 border border-slate-900 shadow-sm" />
            <span className="text-xs text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-slate-900 shadow-sm" />
            <span className="text-xs text-slate-400">High</span>
          </div>
          <div className="h-px bg-slate-700 my-2" />
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
            <span className="text-xs text-slate-400">Interchange</span>
          </div>
        </div>
      </div>
    </div>
  );
}
