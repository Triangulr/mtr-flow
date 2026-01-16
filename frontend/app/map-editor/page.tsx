'use client';

import { useState, useRef } from 'react';
import { INTERCHANGE_CONFIGS, LINE_COLORS } from '@/lib/interchange-config';

type Coord = { x: number; y: number };

// Initial station positions (updated with latest coordinates)
const INITIAL_STATIONS: Record<string, Coord> = {
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

// Station names for reference
const STATION_NAMES: Record<string, string> = {
  "TUM": "Tuen Mun", "SIH": "Siu Hong", "TIS": "Tin Shui Wai", "LOP": "Long Ping",
  "YUL": "Yuen Long", "KSR": "Kam Sheung Road", "TWW": "Tsuen Wan West",
  "TUC": "Tung Chung", "AIR": "Airport", "AWE": "AsiaWorld-Expo", "SUN": "Sunny Bay",
  "TSY": "Tsing Yi", "DIS": "Disneyland", "KET": "Kennedy Town", "HKU": "HKU",
  "SYP": "Sai Ying Pun", "SHW": "Sheung Wan", "CEN": "Central", "ADM": "Admiralty",
  "WAC": "Wan Chai", "CAB": "Causeway Bay", "TIH": "Tin Hau", "FOH": "Fortress Hill",
  "NOP": "North Point", "QUB": "Quarry Bay", "TAK": "Tai Koo", "SWH": "Sai Wan Ho",
  "SKW": "Shau Kei Wan", "HFC": "Heng Fa Chuen", "CHW": "Chai Wan", "OCP": "Ocean Park", "WCH": "Wong Chuk Hang",
  "LET": "Lei Tung", "SOH": "South Horizons", "TST": "Tsim Sha Tsui", "JOR": "Jordan",
  "YMT": "Yau Ma Tei", "MOK": "Mong Kok", "PRE": "Prince Edward", "SSP": "Sham Shui Po",
  "CSW": "Cheung Sha Wan", "LCK": "Lai Chi Kok", "MEF": "Mei Foo", "LAK": "Lai King",
  "KWF": "Kwai Fong", "KWH": "Kwai Hing", "TWH": "Tai Wo Hau", "TSW": "Tsuen Wan",
  "WHA": "Whampoa", "HOM": "Ho Man Tin", "SKM": "Shek Kip Mei", "KOT": "Kowloon Tong",
  "LOF": "Lok Fu", "WTS": "Wong Tai Sin", "DIH": "Diamond Hill", "CHH": "Choi Hung",
  "KOB": "Kowloon Bay", "NTK": "Ngau Tau Kok", "KWT": "Kwun Tong", "LAT": "Lam Tin",
  "YAT": "Yau Tong", "TIK": "Tiu Keng Leng", "TKO": "Tseung Kwan O", "HAH": "Hang Hau",
  "POA": "Po Lam", "LHP": "LOHAS Park", "NAC": "Nam Cheong", "OLY": "Olympic",
  "KOW": "Kowloon", "HOK": "Hong Kong", "AUS": "Austin", "ETS": "East TST",
  "HUH": "Hung Hom", "EXC": "Exhibition", "WEK": "Hong Kong West Kowloon", "SUW": "Sung Wong Toi",
  "KAT": "Kai Tak", "HIK": "Hin Keng", "TAW": "Tai Wai", "CKT": "Che Kung Temple",
  "STW": "Sha Tin Wai", "CIO": "City One", "SHM": "Shek Mun", "TSH": "Tai Shui Hang",
  "HEO": "Heng On", "MOS": "Ma On Shan", "WKS": "Wu Kai Sha", "MKK": "Mong Kok East",
  "FOT": "Fo Tan", "RAC": "Racecourse", "UNI": "University", "TAP": "Tai Po Market",
  "TWO": "Tai Wo", "FAN": "Fanling", "SHS": "Sheung Shui", "LOW": "Lo Wu",
  "LMC": "Lok Ma Chau"
};

export default function MapEditorPage() {
  const [stations, setStations] = useState<Record<string, Coord>>(INITIAL_STATIONS);
  const [interchangeRotations, setInterchangeRotations] = useState<Record<string, number>>({});
  const [draggedStation, setDraggedStation] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (code: string, e: React.MouseEvent) => {
    if (e.shiftKey && INTERCHANGE_CONFIGS[code]) {
      // Shift+click to rotate interchange
      handleRotate(code);
      e.stopPropagation();
    } else {
      // Regular click to drag
      setDraggedStation(code);
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    if (draggedStation) {
      setStations(prev => ({
        ...prev,
        [draggedStation]: { x: Math.round(svgP.x * 10) / 10, y: Math.round(svgP.y * 10) / 10 }
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggedStation(null);

  };

  const handleRotate = (code: string) => {
    setInterchangeRotations(prev => ({
      ...prev,
      [code]: ((prev[code] || 0) + 90) % 360
    }));
  };

  const exportData = () => {
    const output = {
      stations,
      interchangeRotations
    };

    console.log('=== EXPORT DATA ===');
    console.log(JSON.stringify(output, null, 2));

    // Also create formatted TypeScript object
    const tsOutput = `const STATIONS: Record<string, Coord> = ${JSON.stringify(stations, null, 2).replace(/"([^"]+)":/g, '"$1":')};

const INTERCHANGE_ROTATIONS: Record<string, number> = ${JSON.stringify(interchangeRotations, null, 2)};`;

    console.log('\n=== TYPESCRIPT FORMAT ===');
    console.log(tsOutput);

    alert('Data exported to console! Check the browser console (F12)');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">MTR Map Editor</h1>
            <p className="text-slate-400 text-sm">
              Drag stations to reposition • <strong className="text-yellow-400">Shift+Click</strong> or click <strong className="text-yellow-400">yellow dot</strong> to rotate interchange • Export when done
            </p>
          </div>
          <button
            onClick={exportData}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Export Data
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <svg
            ref={svgRef}
            viewBox="0 0 300 300"
            className="w-full h-[800px] bg-slate-950 rounded-lg cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid for reference */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(100,116,139,0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="300" height="300" fill="url(#grid)" />

            {/* Draw line segments */}
            {LINE_SEGMENTS.map((segment) => (
              <path
                key={segment.id}
                d={segment.d}
                fill="none"
                stroke={LINE_COLORS[segment.code] || '#999'}
                strokeWidth={segment.dashed ? "0.8" : "1"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={segment.dashed ? "2 1.5" : "none"}
                className="opacity-60"
              />
            ))}

            {/* Draw stations */}
            {Object.entries(stations).map(([code, coord]) => {
              const isInterchange = !!INTERCHANGE_CONFIGS[code];
              const isDragging = draggedStation === code;
              const rotation = interchangeRotations[code] || 0;

              return (
                <g
                  key={code}
                  transform={`translate(${coord.x}, ${coord.y})`}
                  onMouseDown={(e) => handleMouseDown(code, e)}
                  className={isInterchange ? "cursor-pointer hover:opacity-80" : "cursor-move"}
                  style={{ opacity: isDragging ? 0.6 : 1 }}
                >
                  {/* Hit area */}
                  <circle r={5} fill="transparent" className="cursor-move" />

                  {isInterchange ? (
                    <g transform={`rotate(${rotation})`}>
                      {/* Interchange indicator - two circles */}
                      <circle cx={-2} cy={0} r={2} fill="#ef4444" stroke="#fff" strokeWidth="0.4" />
                      <circle cx={2} cy={0} r={2} fill="#3b82f6" stroke="#fff" strokeWidth="0.4" />
                      {/* Rotation handle - larger and more visible */}
                      <circle
                        cx={0}
                        cy={-6}
                        r={1.5}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth="0.3"
                        className="cursor-pointer hover:fill-yellow-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotate(code);
                        }}
                      />
                      {/* Visual indicator line from center to rotation handle */}
                      <line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={-6}
                        stroke="#fbbf24"
                        strokeWidth="0.4"
                        opacity="0.5"
                        className="pointer-events-none"
                      />
                    </g>
                  ) : (
                    <circle r={2} fill="#10b981" stroke="#fff" strokeWidth="0.4" />
                  )}

                  {/* Station code label */}
                  <text
                    y={-3}
                    textAnchor="middle"
                    className="text-[3px] font-bold fill-white select-none pointer-events-none"
                    style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
                  >
                    {code}
                  </text>

                  {/* Coordinates and rotation */}
                  <text
                    y={6}
                    textAnchor="middle"
                    className="text-[2px] fill-slate-400 select-none pointer-events-none"
                  >
                    {coord.x.toFixed(1)},{coord.y.toFixed(1)}
                    {isInterchange && rotation !== 0 && (
                      <tspan className="fill-yellow-400"> ↻{rotation}°</tspan>
                    )}
                  </text>
                </g>
              );
            })}

            {/* Coordinate display */}
            <text x="5" y="10" className="text-[4px] fill-slate-500">
              ViewBox: 0-300 x 0-300
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <h3 className="font-semibold text-white mb-2">Controls</h3>
            <ul className="space-y-1 text-slate-400 text-xs">
              <li>• <strong>Click & Drag:</strong> Move any station</li>
              <li>• <strong className="text-yellow-400">Shift + Click:</strong> Rotate interchange 90°</li>
              <li>• <strong className="text-yellow-400">Click yellow dot:</strong> Also rotates interchange</li>
              <li className="text-slate-500 text-[10px] mt-1">Rotation only works on interchange stations (red/blue circles)</li>
            </ul>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <h3 className="font-semibold text-white mb-2">Station Types</h3>
            <ul className="space-y-1 text-slate-400 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                <span>Regular station</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                </span>
                <span>Interchange (rotatable)</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <h3 className="font-semibold text-white mb-2">Export</h3>
            <p className="text-slate-400 text-xs">
              Click &quot;Export Data&quot; to copy coordinates. Check browser console (F12) for formatted output.
            </p>
          </div>
        </div>

        {/* Station list for reference */}
        <div className="mt-6 bg-slate-900 rounded-lg border border-slate-800 p-4">
          <h3 className="font-semibold text-white mb-3">Station Reference</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {Object.entries(STATION_NAMES).map(([code, name]) => (
              <div key={code} className="flex items-center gap-2 text-slate-400">
                <span className="font-mono text-slate-500">{code}</span>
                <span>{name}</span>
                {INTERCHANGE_CONFIGS[code] && (
                  <span className="text-[10px] text-amber-500">⟲</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
