'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Train,
  Clock,
  TrendingUp,
  MapPin,
  Activity,
  RefreshCw,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { stationsApi, flowDataApi, predictionsApi, type Prediction } from '@/lib/api';
import { useTrainArrivals } from '@/hooks/use-train-arrivals';
import { GridBackground } from '@/components/effects/grid-background';
import { Header } from '@/components/dashboard/header';
import { CrowdingBadge } from '@/components/dashboard/crowding-badge';
import { LiveIndicator } from '@/components/dashboard/live-indicator';
import { cn, formatHKTime } from '@/lib/utils';

const lineColors: Record<string, string> = {
  'Island Line': '#0071CE',
  'Kwun Tong Line': '#00AF41',
  'Tsuen Wan Line': '#E2231A',
  'Tung Chung Line': '#F38B00',
  'East Rail Line': '#53B7E8',
  'South Island Line': '#BAC429',
  'Tseung Kwan O Line': '#A35EB5',
  'Tuen Ma Line': '#9A3820',
  'Airport Express': '#00888A',
  'Disneyland Resort Line': '#E777CB',
};

const hexToRgba = (hex: string, alpha: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}, ${alpha})`
    : hex;
};

const crowdingColors = {
  low: 'hsl(145 90% 50%)',
  medium: 'hsl(45 100% 55%)',
  high: 'hsl(0 90% 60%)',
};

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stationCode = params.code as string;

  // Fetch all stations for name lookup
  const { data: allStations } = useQuery({
    queryKey: ['all-stations'],
    queryFn: async () => {
      const response = await stationsApi.getAll();
      return response.data;
    },
  });

  // Fetch station details
  const { data: station, isLoading: stationLoading } = useQuery({
    queryKey: ['station', stationCode],
    queryFn: async () => {
      const response = await stationsApi.getByCode(stationCode);
      return response.data;
    },
  });

  // Helper to get station name from code
  const getStationName = (code: string) => {
    const foundStation = allStations?.find(s => s.code === code);
    return foundStation?.name || code;
  };

  // Fetch latest flow data
  const {
    data: flowData,
    refetch: refetchFlow,
  } = useQuery({
    queryKey: ['flow', stationCode],
    queryFn: async () => {
      try {
        const response = await flowDataApi.getLatest(stationCode);
        return response.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch historical flow data
  const { data: historicalData } = useQuery({
    queryKey: ['flowHistory', stationCode],
    queryFn: async () => {
      const response = await flowDataApi.getAll({
        station_code: stationCode,
        limit: 48, // Last 48 data points
      });
      return response.data;
    },
  });

  // Fetch predictions
  const { data: predictions } = useQuery({
    queryKey: ['predictions', stationCode],
    queryFn: async () => {
      try {
        const response = await predictionsApi.getForStation(stationCode, 24);
        return response.data;
      } catch {
        return [];
      }
    },
  });

  // Fetch train arrivals
  const { data: trainsData, isLoading: trainsLoading, error: trainsError } = useTrainArrivals(stationCode, true);

  // Process historical data for chart
  const chartData =
    historicalData
      ?.slice()
      .reverse()
      .map((d) => ({
        time: formatHKTime(d.timestamp),
        frequency: d.train_frequency || 0,
        level: d.crowding_level,
      })) || [];

  // Process predictions for chart
  const predictionChartData =
    predictions?.map((p: Prediction) => ({
      time: formatHKTime(p.prediction_timestamp),
      level: p.predicted_crowding,
      confidence: p.confidence * 100,
      value:
        p.predicted_crowding === 'high'
          ? 3
          : p.predicted_crowding === 'medium'
          ? 2
          : 1,
    })) || [];

  // Generate sample predictions if none exist
  const samplePredictions = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() + i);
    const hourNum = hour.getHours();

    let level: 'low' | 'medium' | 'high' = 'low';
    if ((hourNum >= 7 && hourNum <= 9) || (hourNum >= 17 && hourNum <= 19)) {
      level = Math.random() > 0.3 ? 'high' : 'medium';
    } else if (
      (hourNum >= 10 && hourNum <= 16) ||
      (hourNum >= 20 && hourNum <= 22)
    ) {
      level = Math.random() > 0.5 ? 'medium' : 'low';
    }

    return {
      time: formatHKTime(hour),
      level,
      confidence: 70 + Math.random() * 25,
      value: level === 'high' ? 3 : level === 'medium' ? 2 : 1,
    };
  });

  // Fetch all lines for this station
  const stationLines = allStations
    ?.filter((s) => s.code === stationCode)
    .map((s) => s.line) || [];
  
  // Use unique lines
  const uniqueLines = Array.from(new Set(stationLines));

  const displayPredictions =
    predictionChartData.length > 0 ? predictionChartData : samplePredictions;

  const getGradientStyle = () => {
    if (uniqueLines.length === 0) return {};
    
    // Get colors for all lines
    const colors = uniqueLines
      .map(line => lineColors[line])
      .filter(Boolean);
      
    if (colors.length === 0) return {};
    
    if (colors.length === 1) {
      const color = colors[0];
      return {
        background: `linear-gradient(to bottom right, ${hexToRgba(color, 0.3)}, ${hexToRgba(color, 0.05)})`
      };
    }
    
    // For interchanges, create a multi-stop gradient
    const stops = colors.map((color, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${hexToRgba(color, 0.25)} ${percentage}%`;
    }).join(', ');
    
    return {
      background: `linear-gradient(135deg, ${stops})`
    };
  };

  return (
    <div className="min-h-screen">
      <GridBackground />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </motion.button>

        {stationLoading ? (
          // Loading State
          <div className="space-y-6">
            <div className="h-40 rounded-xl shimmer" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 rounded-xl shimmer" />
              <div className="h-80 rounded-xl shimmer" />
            </div>
          </div>
        ) : station ? (
          <>
            {/* Station Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative overflow-hidden rounded-2xl p-8 mb-8',
                'backdrop-blur-xl border border-white/10'
              )}
              style={getGradientStyle()}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Train className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <h1 className="text-3xl font-bold text-foreground">
                        {station.name}
                      </h1>
                      <div className="flex flex-wrap gap-2">
                        {uniqueLines.length > 0 ? (
                          uniqueLines.map((line) => (
                            <span
                              key={line}
                              className={cn(
                                'text-sm font-medium px-2 py-0.5 rounded-md border',
                                line === 'Island Line' && 'bg-mtr-island/10 text-mtr-island border-mtr-island/20',
                                line === 'Tsuen Wan Line' && 'bg-mtr-tsuen-wan/10 text-mtr-tsuen-wan border-mtr-tsuen-wan/20',
                                line === 'Kwun Tong Line' && 'bg-mtr-kwun-tong/10 text-mtr-kwun-tong border-mtr-kwun-tong/20',
                                line === 'Tseung Kwan O Line' && 'bg-mtr-tseung-kwan-o/10 text-mtr-tseung-kwan-o border-mtr-tseung-kwan-o/20',
                                line === 'Tung Chung Line' && 'bg-mtr-tung-chung/10 text-mtr-tung-chung border-mtr-tung-chung/20',
                                line === 'East Rail Line' && 'bg-mtr-east-rail/10 text-mtr-east-rail border-mtr-east-rail/20',
                                line === 'Tuen Ma Line' && 'bg-mtr-tuen-ma/10 text-mtr-tuen-ma border-mtr-tuen-ma/20',
                                line === 'South Island Line' && 'bg-mtr-south-island/10 text-mtr-south-island border-mtr-south-island/20',
                                line === 'Airport Express' && 'bg-mtr-airport/10 text-mtr-airport border-mtr-airport/20',
                                line === 'Disneyland Resort Line' && 'bg-mtr-disneyland/10 text-mtr-disneyland border-mtr-disneyland/20'
                              )}
                            >
                              {line}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted-foreground">{station.line}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="font-mono">{station.code}</span>
                    </div>
                    <LiveIndicator />
                  </div>
                </div>

                {/* Current Status */}
                <div className="flex flex-col items-start md:items-end gap-4">
                  {flowData?.is_delay && (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-bold">Service Delay</span>
                    </div>
                  )}
                  {flowData?.crowding_level && (
                    <CrowdingBadge level={flowData.crowding_level} size="lg" />
                  )}
                  <motion.button
                    onClick={() => refetchFlow()}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                  </motion.button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Train className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Train Frequency</p>
                    <p className="text-lg font-bold text-foreground">
                      {flowData?.train_frequency?.toFixed(1) || '--'}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        min
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-bold text-foreground">
                      {flowData?.timestamp
                        ? formatHKTime(flowData.timestamp)
                        : '--'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data Points</p>
                    <p className="text-lg font-bold text-foreground">
                      {historicalData?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Predictions</p>
                    <p className="text-lg font-bold text-foreground">
                      24h forecast
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </motion.div>

            {/* Train Arrivals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 glass-card rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Next Train Arrivals</h3>
                  <p className="text-sm text-muted-foreground">Real-time train schedules</p>
                </div>
                <div className="flex items-center gap-2">
                  <Train className="w-5 h-5 text-muted-foreground" />
                  <LiveIndicator />
                </div>
              </div>

              {trainsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading train schedules...</span>
                  </div>
                </div>
              )}

              {trainsError && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Unable to load train arrival data</p>
                </div>
              )}

              {trainsData && trainsData.lines && trainsData.lines.length > 0 && (
                <div className="space-y-6">
                  {trainsData.lines.map((line) => (
                    <div key={line.line_code} className="space-y-4">
                      {/* Line Header */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: line.color }}
                        />
                        <span className="text-base font-bold text-foreground">
                          {line.line_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* UP Trains */}
                        {line.up_trains && line.up_trains.length > 0 && (
                          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                                Upward
                              </div>
                              {line.frequency_up && (
                                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                  Freq: {line.frequency_up.toFixed(1)}m
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {line.up_trains.map((train, idx) => (
                                <div
                                  key={`up-${idx}`}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-400">
                                      Plat {train.platform}
                                    </span>
                                    <span className="text-slate-500">→</span>
                                    <span className="text-sm text-slate-200 font-medium">
                                      {getStationName(train.destination_code)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-primary font-semibold">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-base">{train.ttnt} min</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* DOWN Trains */}
                        {line.down_trains && line.down_trains.length > 0 && (
                          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                                Downward
                              </div>
                              {line.frequency_down && (
                                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                  Freq: {line.frequency_down.toFixed(1)}m
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {line.down_trains.map((train, idx) => (
                                <div
                                  key={`down-${idx}`}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-400">
                                      Plat {train.platform}
                                    </span>
                                    <span className="text-slate-500">→</span>
                                    <span className="text-sm text-slate-200 font-medium">
                                      {getStationName(train.destination_code)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-primary font-semibold">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-base">{train.ttnt} min</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* No trains message */}
                      {(!line.up_trains || line.up_trains.length === 0) &&
                        (!line.down_trains || line.down_trains.length === 0) && (
                          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                            <p className="text-sm text-slate-500 italic text-center">
                              No trains scheduled
                            </p>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {trainsData && (!trainsData.lines || trainsData.lines.length === 0) && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No train data available</p>
                </div>
              )}

              {/* Timestamp */}
              {trainsData && trainsData.timestamp && (
                <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Updated: {new Date(trainsData.timestamp).toLocaleTimeString()}</span>
                </div>
              )}
            </motion.div>

            {flowData?.is_delay && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4"
              >
                <div className="p-3 rounded-full bg-red-500/20 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-100 mb-1">Service Delay Reported</h3>
                  <p className="text-red-200/80">
                    MTR has reported a delay on the {station.line} affecting {station.name}. 
                    Crowding levels may be higher than usual. Please allow extra travel time.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Wait Time Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Service Frequency History
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Recent train headways
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="frequencyGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(185 100% 50%)"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(185 100% 50%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(222 47% 15%)"
                        />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }}
                          axisLine={{ stroke: 'hsl(222 47% 15%)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }}
                          axisLine={{ stroke: 'hsl(222 47% 15%)' }}
                          tickLine={false}
                          label={{
                            value: 'Minutes',
                            angle: -90,
                            position: 'insideLeft',
                            fill: 'hsl(215 20% 55%)',
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="glass-card rounded-lg px-4 py-3">
                                  <p className="text-sm text-foreground font-medium">
                                    {data.time}
                                  </p>
                                  <p className="text-primary">
                                    {data.frequency?.toFixed(1)} min headway
                                  </p>
                                  {data.level && (
                                    <p
                                      className={cn(
                                        'text-sm capitalize',
                                        data.level === 'low' &&
                                          'text-emerald-400',
                                        data.level === 'medium' &&
                                          'text-amber-400',
                                        data.level === 'high' && 'text-red-400'
                                      )}
                                    >
                                      {data.level} crowding
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="frequency"
                          stroke="hsl(185 100% 50%)"
                          strokeWidth={2}
                          fill="url(#frequencyGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No historical data available
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 24h Prediction Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      24-Hour Forecast
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ML-predicted crowding levels
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    {predictions && predictions.length === 0 && (
                      <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                        Sample Data
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayPredictions}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222 47% 15%)"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
                        axisLine={{ stroke: 'hsl(222 47% 15%)' }}
                        tickLine={false}
                        interval={3}
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
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass-card rounded-lg px-4 py-3">
                                <p className="text-sm text-foreground font-medium">
                                  {data.time}
                                </p>
                                <p
                                  className={cn(
                                    'capitalize font-medium',
                                    data.level === 'low' && 'text-emerald-400',
                                    data.level === 'medium' && 'text-amber-400',
                                    data.level === 'high' && 'text-red-400'
                                  )}
                                >
                                  {data.level} crowding
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.confidence.toFixed(0)}% confidence
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {displayPredictions.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              crowdingColors[
                                entry.level as keyof typeof crowdingColors
                              ]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-xs text-muted-foreground">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-xs text-muted-foreground">High</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 glass-card rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">
                Station Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Station Code
                  </p>
                  <p className="text-foreground font-mono">{station.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Line(s)</p>
                  <div className="flex flex-col gap-1">
                     {uniqueLines.length > 0 ? (
                        uniqueLines.map(line => (
                           <p key={line} className="text-foreground">{line}</p>
                        ))
                     ) : (
                        <p className="text-foreground">{station.line}</p>
                     )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Coordinates
                  </p>
                  <p className="text-foreground font-mono text-sm">
                    {station.latitude && station.longitude
                      ? `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          // Station not found
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <Train className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Station Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              The station with code &quot;{stationCode}&quot; could not be found.
            </p>
            <motion.button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Return to Dashboard
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
