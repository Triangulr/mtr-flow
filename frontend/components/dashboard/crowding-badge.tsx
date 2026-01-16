'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type CrowdingLevel = 'low' | 'medium' | 'high' | undefined;

interface CrowdingBadgeProps {
  level: CrowdingLevel;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelConfig = {
  low: {
    label: 'LOW',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-neon-green',
    pulseClass: 'pulse-low',
  },
  medium: {
    label: 'MEDIUM',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-neon-amber',
    pulseClass: 'pulse-medium',
  },
  high: {
    label: 'HIGH',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    glowColor: 'shadow-neon-red',
    pulseClass: 'pulse-high',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

export function CrowdingBadge({
  level,
  showPulse = true,
  size = 'md',
  className = '',
}: CrowdingBadgeProps) {
  if (!level) {
    return (
      <span
        className={cn(
          'rounded-full font-bold uppercase tracking-wider',
          'bg-muted/50 text-muted-foreground border border-muted',
          sizeConfig[size],
          className
        )}
      >
        N/A
      </span>
    );
  }

  const config = levelConfig[level];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        showPulse && config.pulseClass,
        sizeConfig[size],
        className
      )}
    >
      {/* Animated dot indicator */}
      <span className="relative flex h-1.5 w-1.5">
        {showPulse && (
          <motion.span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              level === 'low' && 'bg-emerald-400',
              level === 'medium' && 'bg-amber-400',
              level === 'high' && 'bg-red-400'
            )}
            animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: level === 'high' ? 1 : 2, repeat: Infinity }}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-1.5 w-1.5',
            level === 'low' && 'bg-emerald-400',
            level === 'medium' && 'bg-amber-400',
            level === 'high' && 'bg-red-400'
          )}
        />
      </span>
      {config.label}
    </motion.span>
  );
}
