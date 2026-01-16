'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LineFilterProps {
  lines: string[];
  selectedLine: string | null;
  onSelectLine: (line: string | null) => void;
}

const lineColors: Record<string, { bg: string; text: string; activeBorder: string; hoverBg: string }> = {
  'Island Line': {
    bg: 'bg-mtr-island/10',
    hoverBg: 'hover:bg-mtr-island/20',
    text: 'text-mtr-island',
    activeBorder: 'border-mtr-island',
  },
  'Kwun Tong Line': {
    bg: 'bg-mtr-kwun-tong/10',
    hoverBg: 'hover:bg-mtr-kwun-tong/20',
    text: 'text-mtr-kwun-tong',
    activeBorder: 'border-mtr-kwun-tong',
  },
  'Tsuen Wan Line': {
    bg: 'bg-mtr-tsuen-wan/10',
    hoverBg: 'hover:bg-mtr-tsuen-wan/20',
    text: 'text-mtr-tsuen-wan',
    activeBorder: 'border-mtr-tsuen-wan',
  },
  'Tung Chung Line': {
    bg: 'bg-mtr-tung-chung/10',
    hoverBg: 'hover:bg-mtr-tung-chung/20',
    text: 'text-mtr-tung-chung',
    activeBorder: 'border-mtr-tung-chung',
  },
  'East Rail Line': {
    bg: 'bg-mtr-east-rail/10',
    hoverBg: 'hover:bg-mtr-east-rail/20',
    text: 'text-mtr-east-rail',
    activeBorder: 'border-mtr-east-rail',
  },
  'South Island Line': {
    bg: 'bg-mtr-south-island/10',
    hoverBg: 'hover:bg-mtr-south-island/20',
    text: 'text-mtr-south-island',
    activeBorder: 'border-mtr-south-island',
  },
  'Tseung Kwan O Line': {
    bg: 'bg-mtr-tseung-kwan-o/10',
    hoverBg: 'hover:bg-mtr-tseung-kwan-o/20',
    text: 'text-mtr-tseung-kwan-o',
    activeBorder: 'border-mtr-tseung-kwan-o',
  },
  'Tuen Ma Line': {
    bg: 'bg-mtr-tuen-ma/10',
    hoverBg: 'hover:bg-mtr-tuen-ma/20',
    text: 'text-mtr-tuen-ma',
    activeBorder: 'border-mtr-tuen-ma',
  },
  'Airport Express': {
    bg: 'bg-mtr-airport/10',
    hoverBg: 'hover:bg-mtr-airport/20',
    text: 'text-mtr-airport',
    activeBorder: 'border-mtr-airport',
  },
  'Disneyland Resort Line': {
    bg: 'bg-mtr-disneyland/10',
    hoverBg: 'hover:bg-mtr-disneyland/20',
    text: 'text-mtr-disneyland',
    activeBorder: 'border-mtr-disneyland',
  },
};

export function LineFilter({ lines, selectedLine, onSelectLine }: LineFilterProps) {
  // Ensure we sort lines or just use the passed lines. 
  // If lines are missing in passed props but we want to show them, we might rely on parent to pass all.
  // For now, we trust 'lines' prop but we map styles safely.

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* All lines button */}
      <motion.button
        onClick={() => onSelectLine(null)}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
          selectedLine === null
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        All Lines
      </motion.button>

      {/* Line buttons */}
      {lines.map((line) => {
        const styles = lineColors[line] || {
          bg: 'bg-primary/10',
          hoverBg: 'hover:bg-primary/20',
          text: 'text-primary',
          activeBorder: 'border-primary',
        };
        const isSelected = selectedLine === line;

        return (
          <motion.button
            key={line}
            onClick={() => onSelectLine(line)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              isSelected 
                ? cn('bg-background border-2', styles.activeBorder, styles.text) 
                : cn(styles.bg, styles.text, styles.hoverBg, 'border-transparent')
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {line.replace(' Line', '').replace(' Express', '')}
          </motion.button>
        );
      })}
    </div>
  );
}
