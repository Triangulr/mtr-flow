'use client';

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { cn, formatHKTime } from '@/lib/utils';

interface PredictionMiniChartProps {
  data: Array<{
    hour: string;
    crowding: number;
    level: 'low' | 'medium' | 'high';
  }>;
  className?: string;
}

const levelToValue = {
  low: 1,
  medium: 2,
  high: 3,
};

export function PredictionMiniChart({ data, className }: PredictionMiniChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    value: levelToValue[d.level],
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('h-24 w-full', className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="crowdingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185 100% 50%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(185 100% 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 4]} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass-card rounded-lg px-3 py-2 text-xs">
                    <p className="text-foreground font-medium">{data.hour}</p>
                    <p className={cn(
                      'capitalize',
                      data.level === 'low' && 'text-emerald-400',
                      data.level === 'medium' && 'text-amber-400',
                      data.level === 'high' && 'text-red-400'
                    )}>
                      {data.level} crowding
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(185 100% 50%)"
            strokeWidth={2}
            fill="url(#crowdingGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// Sample data generator for demo
export function generateSamplePrediction() {
  const hours = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hourNum = hour.getHours();

    // Simulate crowding patterns
    let level: 'low' | 'medium' | 'high' = 'low';
    if ((hourNum >= 7 && hourNum <= 9) || (hourNum >= 17 && hourNum <= 19)) {
      level = Math.random() > 0.3 ? 'high' : 'medium';
    } else if ((hourNum >= 10 && hourNum <= 16) || (hourNum >= 20 && hourNum <= 22)) {
      level = Math.random() > 0.5 ? 'medium' : 'low';
    }

    hours.push({
      hour: formatHKTime(hour),
      crowding: Math.random() * 100,
      level,
    });
  }

  return hours;
}
