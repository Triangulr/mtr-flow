'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Map, LayoutGrid, Network } from 'lucide-react';
import { stationsApi, flowDataApi, type Station, type FlowData } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { CrowdingBadge } from '@/components/dashboard/crowding-badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { SystemMap } from '@/components/map/system-map';

// MTR line colors matching official colors via Tailwind config
const lineStyles: Record<string, { bg: string; border: string; text: string }> = {
  'Island Line': { bg: 'bg-mtr-island', border: 'border-mtr-island', text: 'text-mtr-island' },
  'Kwun Tong Line': { bg: 'bg-mtr-kwun-tong', border: 'border-mtr-kwun-tong', text: 'text-mtr-kwun-tong' },
  'Tsuen Wan Line': { bg: 'bg-mtr-tsuen-wan', border: 'border-mtr-tsuen-wan', text: 'text-mtr-tsuen-wan' },
  'Tung Chung Line': { bg: 'bg-mtr-tung-chung', border: 'border-mtr-tung-chung', text: 'text-mtr-tung-chung' },
  'East Rail Line': { bg: 'bg-mtr-east-rail', border: 'border-mtr-east-rail', text: 'text-mtr-east-rail' },
  'South Island Line': { bg: 'bg-mtr-south-island', border: 'border-mtr-south-island', text: 'text-mtr-south-island' },
  'Tseung Kwan O Line': { bg: 'bg-mtr-tseung-kwan-o', border: 'border-mtr-tseung-kwan-o', text: 'text-mtr-tseung-kwan-o' },
  'Tuen Ma Line': { bg: 'bg-mtr-tuen-ma', border: 'border-mtr-tuen-ma', text: 'text-mtr-tuen-ma' },
  'Airport Express': { bg: 'bg-mtr-airport', border: 'border-mtr-airport', text: 'text-mtr-airport' },
  'Disneyland Resort Line': { bg: 'bg-mtr-disneyland', border: 'border-mtr-disneyland', text: 'text-mtr-disneyland' },
};

export default function MapPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const response = await stationsApi.getAll();
      return response.data;
    },
  });

  const { data: flowDataMap } = useQuery({
    queryKey: ['allFlowData', stations?.map((s) => s.code)],
    queryFn: async () => {
      if (!stations) return new globalThis.Map<string, FlowData | null>();

      const flowMap = new globalThis.Map<string, FlowData | null>();
      // To prevent spamming the "mock" API too hard in parallel if there are many stations, 
      // we could batch this, but for now we'll rely on the mock being fast.
      // In a real app with 90+ stations, we'd want a bulk endpoint.
      await Promise.all(
        stations.map(async (station) => {
          try {
            const response = await flowDataApi.getLatest(station.code);
            flowMap.set(station.code, response.data);
          } catch {
            flowMap.set(station.code, null);
          }
        })
      );
      return flowMap;
    },
    enabled: !!stations && stations.length > 0,
    refetchInterval: 10000,
  });

  // Group stations by line
  // We use the order in lineStyles to define the display order
  const orderedLines = Object.keys(lineStyles);
  
  const stationsByLine = stations?.reduce(
    (acc, station) => {
      if (!acc[station.line]) {
        acc[station.line] = [];
      }
      acc[station.line].push(station);
      return acc;
    },
    {} as Record<string, Station[]>
  ) || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Network Overview
              </h1>
              <p className="text-muted-foreground">
                Real-time crowding status across all MTR lines
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'map' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Network className="w-4 h-4" />
              System Map
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'grid' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid View
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {viewMode === 'map' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <SystemMap 
                  stations={stations || []} 
                  flowDataMap={flowDataMap || new globalThis.Map()} 
                />
              </motion.div>
            ) : (
              /* Lines Grid */
              <div className="space-y-12">
                {orderedLines.map((line, lineIndex) => {
                  const lineStations = stationsByLine[line];
                  if (!lineStations) return null;

                  const styles = lineStyles[line] || {
                    bg: 'bg-primary',
                    border: 'border-primary',
                    text: 'text-primary'
                  };

                  return (
                    <motion.div
                      key={line}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: lineIndex * 0.05 }}
                      className="bg-card rounded-xl p-6 border border-border shadow-sm"
                    >
                      {/* Line Header */}
                      <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                        <div className={cn('w-1.5 h-8 rounded-full', styles.bg)} />
                        <h2 className={cn('text-xl font-bold', styles.text)}>{line}</h2>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {lineStations.length} stations
                        </span>
                      </div>

                      {/* Stations Scroll Area */}
                      <div className="relative">
                        {/* Connecting Line */}
                        <div
                          className={cn(
                            'absolute top-[27px] left-4 right-4 h-2 rounded-full opacity-20',
                            styles.bg
                          )}
                        />

                        {/* Stations */}
                        <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                          {lineStations.map((station) => {
                            const flowData = flowDataMap?.get(station.code);

                            return (
                              <Link
                                key={`${line}-${station.code}`}
                                href={`/station/${station.code}`}
                                className="group flex-shrink-0"
                              >
                                <div className="flex flex-col items-center">
                                  {/* Station Node */}
                                  <div
                                    className={cn(
                                      'w-14 h-14 rounded-full border-4 bg-background z-10 flex items-center justify-center transition-all duration-300',
                                      styles.border,
                                      'group-hover:scale-110 group-hover:shadow-md',
                                      flowData?.crowding_level === 'high' && 'ring-2 ring-red-500 ring-offset-2',
                                      flowData?.crowding_level === 'medium' && 'ring-2 ring-amber-500 ring-offset-2',
                                      flowData?.crowding_level === 'low' && 'ring-2 ring-emerald-500 ring-offset-2'
                                    )}
                                  >
                                    <span className={cn('text-xs font-bold', styles.text)}>
                                        {station.code}
                                    </span>
                                  </div>

                                  {/* Station Info */}
                                  <div className="mt-4 w-32 text-center">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                      {station.name}
                                    </p>
                                    {flowData?.crowding_level && (
                                      <div className="mt-1">
                                        <CrowdingBadge
                                          level={flowData.crowding_level}
                                          size="sm"
                                          showPulse={false}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
