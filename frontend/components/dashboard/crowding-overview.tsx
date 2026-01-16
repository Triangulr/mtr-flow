'use client';

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { FlowData } from '@/lib/api';

interface CrowdingOverviewProps {
  flowDataMap: Map<string, FlowData | null>;
  className?: string;
}

const COLORS = {
  low: 'hsl(150 60% 45%)',    // Emerald
  medium: 'hsl(35 90% 50%)',  // Amber
  high: 'hsl(0 75% 55%)',     // Red
  unknown: 'hsl(220 14% 90%)', // Light Gray
};

export function CrowdingOverview({ flowDataMap, className }: CrowdingOverviewProps) {
  // Calculate crowding distribution
  const distribution = {
    low: 0,
    medium: 0,
    high: 0,
    unknown: 0,
  };

  flowDataMap.forEach((flow) => {
    if (flow?.crowding_level) {
      distribution[flow.crowding_level]++;
    } else {
      distribution.unknown++;
    }
  });

  const data = [
    { name: 'Low', value: distribution.low, color: COLORS.low },
    { name: 'Medium', value: distribution.medium, color: COLORS.medium },
    { name: 'High', value: distribution.high, color: COLORS.high },
    { name: 'No Data', value: distribution.unknown, color: COLORS.unknown },
  ].filter((d) => d.value > 0);

  const total = flowDataMap.size;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'glass-card rounded-xl p-6',
        className
      )}
    >
      <h3 className="text-lg font-bold text-foreground mb-4">
        Crowding Overview
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = ((data.value / total) * 100).toFixed(1);
                  return (
                    <div className="glass-card rounded-lg px-3 py-2 text-sm">
                      <p className="font-medium" style={{ color: data.color }}>
                        {data.name}
                      </p>
                      <p className="text-foreground">
                        {data.value} stations ({percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with counts */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">{item.name}</span>
            <span className="text-sm font-bold text-foreground ml-auto">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
