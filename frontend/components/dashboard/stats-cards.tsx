'use client';

import { motion } from 'framer-motion';
import { Train, Users, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Station, FlowData } from '@/lib/api';

interface StatsCardsProps {
  stations: Station[];
  flowDataMap: Map<string, FlowData | null>;
}

export function StatsCards({ stations, flowDataMap }: StatsCardsProps) {
  // Calculate stats
  const totalStations = stations.length;
  const stationsWithData = Array.from(flowDataMap.values()).filter(Boolean).length;

  const crowdingCounts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  let totalFrequency = 0;
  let frequencyCount = 0;

  flowDataMap.forEach((flow) => {
    if (flow?.crowding_level) {
      crowdingCounts[flow.crowding_level]++;
    }
    if (flow?.train_frequency) {
      totalFrequency += flow.train_frequency;
      frequencyCount++;
    }
  });

  const avgFrequency = frequencyCount > 0 ? (totalFrequency / frequencyCount).toFixed(1) : '--';

  const stats = [
    {
      label: 'Total Stations',
      value: totalStations,
      icon: Train,
      color: 'primary',
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/20',
    },
    {
      label: 'Low Crowding',
      value: crowdingCounts.low,
      icon: CheckCircle,
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconBg: 'bg-emerald-500/20',
    },
    {
      label: 'Medium Crowding',
      value: crowdingCounts.medium,
      icon: Users,
      color: 'amber',
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconBg: 'bg-amber-500/20',
    },
    {
      label: 'High Crowding',
      value: crowdingCounts.high,
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500/20 to-red-500/5',
      iconBg: 'bg-red-500/20',
    },
    {
      label: 'Avg Frequency',
      value: avgFrequency,
      suffix: 'min',
      icon: Clock,
      color: 'accent',
      gradient: 'from-accent/20 to-accent/5',
      iconBg: 'bg-accent/20',
    },
    {
      label: 'Data Coverage',
      value: Math.round((stationsWithData / totalStations) * 100) || 0,
      suffix: '%',
      icon: TrendingUp,
      color: 'violet',
      gradient: 'from-violet-500/20 to-violet-500/5',
      iconBg: 'bg-violet-500/20',
    },
  ];

  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    accent: 'text-accent',
    violet: 'text-violet-400',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-4 border border-border',
            'bg-card shadow-sm hover:shadow-md transition-all duration-200'
          )}
        >
          <div className="flex items-start justify-between relative z-10">
            <div className={cn('p-2 rounded-lg', stat.iconBg)}>
              <stat.icon className={cn('w-4 h-4', colorMap[stat.color])} />
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-2xl font-bold text-foreground">
              {stat.value}
              {stat.suffix && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {stat.suffix}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
