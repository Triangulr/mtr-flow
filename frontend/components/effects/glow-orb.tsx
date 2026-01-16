'use client';

import { motion } from 'framer-motion';

interface GlowOrbProps {
  color?: 'cyan' | 'magenta' | 'green' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const colorMap = {
  cyan: 'bg-neon-cyan',
  magenta: 'bg-neon-magenta',
  green: 'bg-neon-green',
  amber: 'bg-neon-amber',
};

const sizeMap = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
};

export function GlowOrb({
  color = 'cyan',
  size = 'md',
  className = '',
  animate = true,
}: GlowOrbProps) {
  return (
    <motion.div
      className={`${sizeMap[size]} ${colorMap[color]} rounded-full blur-3xl opacity-20 ${className}`}
      initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
      animate={
        animate
          ? {
              scale: [0.8, 1.1, 0.9, 1],
              opacity: [0.1, 0.25, 0.15, 0.2],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }
          : undefined
      }
    />
  );
}
