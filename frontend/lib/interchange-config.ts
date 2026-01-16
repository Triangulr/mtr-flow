/**
 * Interchange Station Configuration
 * Defines how interchange stations should display their multiple lines
 */

export interface InterchangeConfig {
  layout: 'horizontal' | 'vertical';
  lines: string[]; // Line codes in display order
}

export const INTERCHANGE_CONFIGS: Record<string, InterchangeConfig> = {
  // 2-line interchanges
  'CEN': { layout: 'horizontal', lines: ['ISL', 'TWL'] },
  'YMT': { layout: 'horizontal', lines: ['TWL', 'KTL'] },
  'MOK': { layout: 'horizontal', lines: ['TWL', 'KTL'] },
  'PRE': { layout: 'horizontal', lines: ['TWL', 'KTL'] },
  'NOP': { layout: 'horizontal', lines: ['ISL', 'TKL'] },
  'QUB': { layout: 'horizontal', lines: ['ISL', 'TKL'] },
  'YAT': { layout: 'horizontal', lines: ['KTL', 'TKL'] },
  'TIK': { layout: 'horizontal', lines: ['KTL', 'TKL'] },
  'LAK': { layout: 'horizontal', lines: ['TWL', 'TCL'] },
  'MEF': { layout: 'horizontal', lines: ['TWL', 'TML'] },
  'HOM': { layout: 'horizontal', lines: ['KTL', 'TML'] },
  'HUH': { layout: 'horizontal', lines: ['EAL', 'TML'] },
  'KOT': { layout: 'horizontal', lines: ['KTL', 'EAL'] },
  'DIH': { layout: 'horizontal', lines: ['KTL', 'TML'] },
  'TAW': { layout: 'horizontal', lines: ['EAL', 'TML'] },
  'NAC': { layout: 'horizontal', lines: ['TCL', 'TML'] },
  'HOK': { layout: 'horizontal', lines: ['TCL', 'AEL'] },
  'KOW': { layout: 'horizontal', lines: ['TCL', 'AEL'] },
  'TSY': { layout: 'horizontal', lines: ['TCL', 'AEL'] },
  'SUN': { layout: 'horizontal', lines: ['TCL', 'DRL'] },

  // 3+ line interchanges (vertical layout for better visibility)
  // ADM order: TWL (red), ISL (dark blue), EAL (light blue), SIL (light green)
  'ADM': { layout: 'vertical', lines: ['TWL', 'ISL', 'EAL', 'SIL'] },
};

// Line colors (must match the system map LINES configuration)
export const LINE_COLORS: Record<string, string> = {
  'ISL': '#007DC5',  // Island Line - Blue
  'TWL': '#E2231A',  // Tsuen Wan Line - Red
  'KTL': '#00AB4E',  // Kwun Tong Line - Green
  'TKL': '#A35EB5',  // Tseung Kwan O Line - Purple
  'TCL': '#F38B00',  // Tung Chung Line - Orange
  'AEL': '#007078',  // Airport Express - Teal
  'DRL': '#E777CB',  // Disneyland Resort Line - Pink
  'EAL': '#53C7E3',  // East Rail Line - Light Blue
  'TML': '#923011',  // Tuen Ma Line - Brown
  'SIL': '#B6BD00',  // South Island Line - Lime
  'CONNECTION': '#9ca3af',  // Connection lines - Gray
};

/**
 * Calculate positions for interchange circles
 * Stacks circles horizontally or vertically, touching each other
 * Supports rotation via rotation parameter (in degrees)
 */
export function getInterchangeCirclePositions(
  config: InterchangeConfig,
  baseX: number,
  baseY: number,
  lineOffsets: Map<string, { x: number; y: number }>,
  circleRadius: number = 5,
  rotation: number = 0
): Array<{ x: number; y: number; lineCode: string; color: string }> {
  const { layout, lines } = config;
  const diameter = circleRadius * 2;

  let positions: Array<{ x: number; y: number; lineCode: string; color: string }>;

  if (layout === 'vertical') {
    // Stack vertically (top to bottom), circles touching
    const totalHeight = lines.length * diameter;
    const startY = baseY - totalHeight / 2 + circleRadius;

    positions = lines.map((lineCode, index) => ({
      x: baseX,
      y: startY + index * diameter,
      lineCode,
      color: LINE_COLORS[lineCode] || '#666666'
    }));
  } else {
    // Stack horizontally (left to right), circles touching
    const totalWidth = lines.length * diameter;
    const startX = baseX - totalWidth / 2 + circleRadius;

    positions = lines.map((lineCode, index) => ({
      x: startX + index * diameter,
      y: baseY,
      lineCode,
      color: LINE_COLORS[lineCode] || '#666666'
    }));
  }

  // Apply rotation if specified
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    positions = positions.map(pos => {
      const relX = pos.x - baseX;
      const relY = pos.y - baseY;
      return {
        ...pos,
        x: baseX + (relX * cos - relY * sin),
        y: baseY + (relX * sin + relY * cos)
      };
    });
  }

  return positions;
}
