'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface UnderDevelopmentBannerProps {
  message?: string;
}

export function UnderDevelopmentBanner({
  message = "This feature is currently under development. Data shown may be simulated or incomplete."
}: UnderDevelopmentBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-amber-500/20 border-b border-amber-500/30 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-100">
                  Under Development
                </p>
                <p className="text-xs text-amber-200/80">
                  {message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors text-amber-400 hover:text-amber-300"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
