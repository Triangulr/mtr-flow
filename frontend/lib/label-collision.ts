/**
 * Label Collision Detection and Adjustment
 * Prevents label overlaps on the system map using force-directed positioning
 */

export interface LabelBox {
  stationCode: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalX: number;
  originalY: number;
  align: string;
  priority: number; // Higher priority labels move less
}

export interface AdjustedLabel {
  stationCode: string;
  x: number;
  y: number;
  needsLeaderLine: boolean;
}

/**
 * Check if two axis-aligned bounding boxes overlap
 */
function boxesOverlap(box1: LabelBox, box2: LabelBox): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Calculate label dimensions based on text content and font size
 */
export function calculateLabelBox(
  stationCode: string,
  stationName: string,
  baseX: number,
  baseY: number,
  align: string,
  fontSize: number = 11,
  priority: number = 0
): LabelBox {
  // Approximate character width (monospace estimation)
  const charWidth = fontSize * 0.6;
  const width = stationName.length * charWidth + 8; // Add padding
  const height = fontSize + 4;

  // Calculate initial position based on alignment
  let x = baseX;
  let y = baseY;

  if (align.includes('top')) {
    y -= (height + 18);
  } else if (align.includes('bottom')) {
    y += 26;
  } else {
    y -= height / 2;
  }

  if (align.includes('left')) {
    x -= (width + 18);
  } else if (align.includes('right')) {
    x += 18;
  } else {
    x -= width / 2;
  }

  return {
    stationCode,
    x,
    y,
    width,
    height,
    originalX: x,
    originalY: y,
    align,
    priority
  };
}

/**
 * Adjust overlapping labels using force-directed algorithm
 */
export function adjustOverlappingLabels(
  labels: LabelBox[],
  maxIterations: number = 50,
  maxOffset: number = 50
): Map<string, AdjustedLabel> {
  // Create working copy
  const adjustedLabels = labels.map(label => ({ ...label }));
  const padding = 4; // Minimum spacing between labels

  // Iterative adjustment
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hadCollision = false;

    for (let i = 0; i < adjustedLabels.length; i++) {
      for (let j = i + 1; j < adjustedLabels.length; j++) {
        const label1 = adjustedLabels[i];
        const label2 = adjustedLabels[j];

        // Expand boxes with padding for collision check
        const box1 = {
          ...label1,
          x: label1.x - padding,
          y: label1.y - padding,
          width: label1.width + padding * 2,
          height: label1.height + padding * 2
        };

        const box2 = {
          ...label2,
          x: label2.x - padding,
          y: label2.y - padding,
          width: label2.width + padding * 2,
          height: label2.height + padding * 2
        };

        if (boxesOverlap(box1, box2)) {
          hadCollision = true;

          // Calculate overlap centers
          const center1X = label1.x + label1.width / 2;
          const center1Y = label1.y + label1.height / 2;
          const center2X = label2.x + label2.width / 2;
          const center2Y = label2.y + label2.height / 2;

          // Calculate repulsion vector
          let dx = center1X - center2X;
          let dy = center1Y - center2Y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          // Normalize
          dx /= distance;
          dy /= distance;

          // Apply repulsion force (proportional to priority)
          const force = 2;
          const ratio1 = label2.priority / (label1.priority + label2.priority + 1);
          const ratio2 = label1.priority / (label1.priority + label2.priority + 1);

          label1.x += dx * force * (1 - ratio1);
          label1.y += dy * force * (1 - ratio1);
          label2.x -= dx * force * (1 - ratio2);
          label2.y -= dy * force * (1 - ratio2);

          // Constrain to max offset from original position
          const dist1 = Math.sqrt(
            Math.pow(label1.x - label1.originalX, 2) +
            Math.pow(label1.y - label1.originalY, 2)
          );
          if (dist1 > maxOffset) {
            const scale = maxOffset / dist1;
            label1.x = label1.originalX + (label1.x - label1.originalX) * scale;
            label1.y = label1.originalY + (label1.y - label1.originalY) * scale;
          }

          const dist2 = Math.sqrt(
            Math.pow(label2.x - label2.originalX, 2) +
            Math.pow(label2.y - label2.originalY, 2)
          );
          if (dist2 > maxOffset) {
            const scale = maxOffset / dist2;
            label2.x = label2.originalX + (label2.x - label2.originalX) * scale;
            label2.y = label2.originalY + (label2.y - label2.originalY) * scale;
          }
        }
      }
    }

    // Stop if no collisions detected
    if (!hadCollision) break;
  }

  // Convert to result format
  const result = new Map<string, AdjustedLabel>();

  for (const label of adjustedLabels) {
    const offsetDistance = Math.sqrt(
      Math.pow(label.x - label.originalX, 2) +
      Math.pow(label.y - label.originalY, 2)
    );

    result.set(label.stationCode, {
      stationCode: label.stationCode,
      x: label.x,
      y: label.y,
      needsLeaderLine: offsetDistance > 20
    });
  }

  return result;
}

/**
 * Get label priority based on station type
 */
export function getLabelPriority(
  stationCode: string,
  isInterchange: boolean,
  isTerminal: boolean
): number {
  if (isTerminal) return 100;
  if (isInterchange) return 50;
  return 10;
}

/**
 * Filter labels within viewport (for optimization)
 */
export function getVisibleLabels(
  labels: LabelBox[],
  viewportX: number,
  viewportY: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number
): LabelBox[] {
  return labels.filter(label => {
    // Transform to screen coordinates
    const screenX = label.x * scale + viewportX;
    const screenY = label.y * scale + viewportY;
    const screenWidth = label.width * scale;
    const screenHeight = label.height * scale;

    // Check if in viewport (with margin)
    const margin = 100;
    return (
      screenX + screenWidth > -margin &&
      screenX < viewportWidth + margin &&
      screenY + screenHeight > -margin &&
      screenY < viewportHeight + margin
    );
  });
}
