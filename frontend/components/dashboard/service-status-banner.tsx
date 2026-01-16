'use client';

import { motion } from 'framer-motion';
import { Moon, Clock } from 'lucide-react';

export function ServiceStatusBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-indigo-950/50 border-b border-indigo-500/20 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center gap-3 text-indigo-200">
          <Moon className="w-4 h-4" />
          <p className="text-sm font-medium">
            MTR Service is currently inactive (01:00 - 06:00 HK Time). Real-time data updates will resume at 06:00.
          </p>
          <Clock className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}
