'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { stationsApi, type Station } from '@/lib/api';
import { GridBackground } from '@/components/effects/grid-background';
import { Header } from '@/components/dashboard/header';
import { UnderDevelopmentBanner } from '@/components/dashboard/under-development-banner';
import Link from 'next/link';
import { formatHKTime } from '@/lib/utils';

// Generate sample prediction data for multiple stations
function generatePredictionData(stations: Station[]) {
  const hours = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hourNum = hour.getHours();

    const dataPoint: Record<string, string | number> = {
      time: formatHKTime(hour),
      hour: hourNum,
    };

    // Generate predictions for each station
    stations.forEach((station) => {
      let level: number;
      if ((hourNum >= 7 && hourNum <= 9) || (hourNum >= 17 && hourNum <= 19)) {
        level = Math.random() > 0.3 ? 3 : 2;
      } else if (
        (hourNum >= 10 && hourNum <= 16) ||
        (hourNum >= 20 && hourNum <= 22)
      ) {
        level = Math.random() > 0.5 ? 2 : 1;
      } else {
        level = 1;
      }
      dataPoint[station.code] = level;
    });

    hours.push(dataPoint);
  }

  return hours;
}

// Get peak hours for a station's predictions
function analyzePredictions(predictions: Record<string, string | number>[], stationCode: string) {
  const highHours = predictions
    .filter((p) => p[stationCode] === 3)
    .map((p) => p.time);
  const mediumHours = predictions
    .filter((p) => p[stationCode] === 2)
    .map((p) => p.time);

  return { highHours, mediumHours };
}

const COLORS = [
  'hsl(185 100% 50%)',
  'hsl(320 100% 60%)',
  'hsl(145 90% 50%)',
  'hsl(45 100% 55%)',
  'hsl(270 90% 65%)',
  'hsl(0 90% 60%)',
];

export default function PredictionsPage() {
  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const response = await stationsApi.getAll();
      return response.data;
    },
  });

  const selectedStations = stations?.slice(0, 5) || [];
  const predictionData = stations
    ? generatePredictionData(selectedStations)
    : [];

  return (
    <div className="min-h-screen">
      <GridBackground />
      <Header />
      <UnderDevelopmentBanner message="Crowding predictions are currently under development. The ML model is being trained and data shown is simulated." />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Crowding Predictions
              </h1>
              <p className="text-muted-foreground">
                24-hour ML-powered forecasts across the MTR network
              </p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-96 rounded-xl shimmer" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl shimmer" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Multi-Station Comparison Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Network Overview
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compare crowding predictions across stations
                  </p>
                </div>
                <span className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                  ML Model v1.0
                </span>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(222 47% 15%)"
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }}
                      axisLine={{ stroke: 'hsl(222 47% 15%)' }}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      domain={[0, 4]}
                      ticks={[1, 2, 3]}
                      tickFormatter={(v) =>
                        v === 1 ? 'Low' : v === 2 ? 'Med' : v === 3 ? 'High' : ''
                      }
                      tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }}
                      axisLine={{ stroke: 'hsl(222 47% 15%)' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-card rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-foreground mb-2">
                                {label}
                              </p>
                              {payload.map((p: { dataKey: string; color: string; value: number }, i: number) => (
                                <p
                                  key={i}
                                  className="text-xs"
                                  style={{ color: p.color }}
                                >
                                  {p.dataKey}:{' '}
                                  {p.value === 3
                                    ? 'High'
                                    : p.value === 2
                                    ? 'Medium'
                                    : 'Low'}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">
                          {value}
                        </span>
                      )}
                    />
                    {selectedStations.map((station, index) => (
                      <Line
                        key={station.code}
                        type="monotone"
                        dataKey={station.code}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={station.name}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Station Cards with Peak Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedStations.map((station, index) => {
                const analysis = analyzePredictions(predictionData, station.code);

                return (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/station/${station.code}`}>
                      <div className="glass-card rounded-xl p-6 hover:shadow-neon-cyan transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {station.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {station.line}
                            </p>
                          </div>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          {/* High Crowding */}
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                High Crowding Expected
                              </p>
                              <p className="text-sm text-red-400 font-medium">
                                {analysis.highHours.length > 0
                                  ? analysis.highHours.slice(0, 4).join(', ')
                                  : 'None predicted'}
                              </p>
                            </div>
                          </div>

                          {/* Medium Crowding */}
                          <div className="flex items-start gap-3">
                            <Minus className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Medium Crowding
                              </p>
                              <p className="text-sm text-amber-400 font-medium">
                                {analysis.mediumHours.length > 0
                                  ? `${analysis.mediumHours.length} hours`
                                  : 'None'}
                              </p>
                            </div>
                          </div>

                          {/* Best Time */}
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Best Travel Time
                              </p>
                              <p className="text-sm text-emerald-400 font-medium">
                                {predictionData.find((p) => p[station.code] === 1)
                                  ?.time || 'Check schedule'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 glass-card rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">
                About Our Predictions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Machine Learning Model
                  </h4>
                  <p>
                    Predictions are generated using a Random Forest classifier
                    trained on historical MTR data patterns.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Features Used
                  </h4>
                  <p>
                    Hour of day, day of week, public holidays, rush hour
                    indicators, and recent crowding history.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Update Frequency
                  </h4>
                  <p>
                    Predictions are updated every hour based on the latest
                    real-time data from MTR stations.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
