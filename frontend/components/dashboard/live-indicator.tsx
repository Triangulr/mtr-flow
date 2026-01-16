'use client';

import { motion } from 'framer-motion';

interface LiveIndicatorProps {
  isLive?: boolean;
  label?: string;
  className?: string;
}

export function LiveIndicator({
  isLive = true,
  label = 'LIVE',
  className = '',
}: LiveIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        {isLive && (
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-emerald-500"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
        {/* Inner dot */}
        <motion.div
          className={`w-2 h-2 rounded-full ${
            isLive ? 'bg-emerald-500' : 'bg-muted-foreground'
          }`}
          animate={
            isLive
              ? {
                  opacity: [1, 0.7, 1],
                }
              : undefined
          }
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      <span
        className={`text-xs font-bold tracking-wider ${
          isLive ? 'text-emerald-500' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
