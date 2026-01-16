'use client';

import { motion } from 'framer-motion';
import { Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrowdingBadge } from '@/components/dashboard/crowding-badge';
import type { Station, FlowData } from '@/lib/api';
import Link from 'next/link';

interface StationCardProps {
  station: Station;
  flowData?: FlowData | null;
  className?: string;
  isServiceClosed?: boolean;
}

const lineStyles: Record<string, { badge: string; border: string }> = {
  'Island Line': { badge: 'bg-mtr-island text-white', border: 'border-mtr-island' },
  'Kwun Tong Line': { badge: 'bg-mtr-kwun-tong text-white', border: 'border-mtr-kwun-tong' },
  'Tsuen Wan Line': { badge: 'bg-mtr-tsuen-wan text-white', border: 'border-mtr-tsuen-wan' },
  'Tung Chung Line': { badge: 'bg-mtr-tung-chung text-white', border: 'border-mtr-tung-chung' },
  'East Rail Line': { badge: 'bg-mtr-east-rail text-white', border: 'border-mtr-east-rail' },
  'South Island Line': { badge: 'bg-mtr-south-island text-white', border: 'border-mtr-south-island' },
  'Tseung Kwan O Line': { badge: 'bg-mtr-tseung-kwan-o text-white', border: 'border-mtr-tseung-kwan-o' },
  'Tuen Ma Line': { badge: 'bg-mtr-tuen-ma text-white', border: 'border-mtr-tuen-ma' },
  'Airport Express': { badge: 'bg-mtr-airport text-white', border: 'border-mtr-airport' },
  'Disneyland Resort Line': { badge: 'bg-mtr-disneyland text-white', border: 'border-mtr-disneyland' },
};

export function StationCard({ station, flowData, className, isServiceClosed = false }: StationCardProps) {
  const styles = lineStyles[station.line] || {
    badge: 'bg-primary text-primary-foreground',
    border: 'border-primary',
  };

  return (
    <Link href={`/station/${station.code}`}>
      <motion.div
        className={cn(
          'station-card group relative overflow-hidden',
          className
        )}
        whileHover={{ y: -4 }}
      >
        {/* Accent Bar */}
        <div className={cn('absolute top-0 left-0 w-1 h-full', styles.badge)} />

        <div className="flex flex-col h-full pl-3">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={cn(
                'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2',
                styles.badge
              )}>
                {station.line}
              </span>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {station.name}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">{station.code}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!isServiceClosed && flowData?.is_delay && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                  DELAYED
                </span>
              )}
              {!isServiceClosed && flowData?.crowding_level && (
                <CrowdingBadge level={flowData.crowding_level} />
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frequency</p>
                <p className="font-semibold text-foreground">
                  {!isServiceClosed && flowData?.train_frequency 
                    ? `${flowData.train_frequency.toFixed(1)} min`
                    : '--'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Flow</p>
                <p className="font-semibold text-foreground">
                  {!isServiceClosed && flowData ? 'Active' : isServiceClosed ? 'Inactive' : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
