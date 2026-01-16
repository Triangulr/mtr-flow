'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { stationsApi, flowDataApi, type FlowData } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { StationCard } from '@/components/station/station-card';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { LineFilter } from '@/components/dashboard/line-filter';
import { CrowdingOverview } from '@/components/dashboard/crowding-overview';
import { ServiceStatusBanner } from '@/components/dashboard/service-status-banner';
import { useMTRStatus } from '@/hooks/use-mtr-status';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isClosed } = useMTRStatus();

  // Fetch all stations
  const {
    data: stations,
    isLoading: stationsLoading,
    error: stationsError,
    refetch: refetchStations,
  } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const response = await stationsApi.getAll();
      return response.data;
    },
  });

  // Fetch flow data for all stations
  const { data: flowDataMap } = useQuery({
    queryKey: ['allFlowData', stations?.map((s) => s.code)],
    queryFn: async () => {
      if (!stations) return new globalThis.Map<string, FlowData | null>();

      const flowMap = new globalThis.Map<string, FlowData | null>();
      // Use parallel fetch but catches errors individually
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

  // Get unique lines
  const lines = useMemo(() => {
    if (!stations) return [];
    return [...new Set(stations.map((s) => s.line))].sort();
  }, [stations]);

  // Filter stations
  const filteredStations = useMemo(() => {
    if (!stations) return [];
    return stations.filter((station) => {
      const matchesLine = !selectedLine || station.line === selectedLine;
      const matchesSearch =
        !searchQuery ||
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLine && matchesSearch;
    });
  }, [stations, selectedLine, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Service Status Banner */}
      <AnimatePresence>
        {isClosed && <ServiceStatusBanner />}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
            <span className="text-primary">Real-time</span> MTR Crowding
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Monitor live passenger flow and predictions across Hong Kong&apos;s MTR network.
          </p>
        </motion.div>

        {/* Stats Overview */}
        {stations && flowDataMap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <StatsCards 
              stations={stations} 
              flowDataMap={flowDataMap} 
              isServiceClosed={isClosed}
            />
          </motion.div>
        )}

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-6"
        >
          {/* Search and Refresh */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-xl',
                  'bg-card border border-border',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'transition-all duration-200'
                )}
              />
            </div>

            {/* Refresh Button */}
            <motion.button
              onClick={() => refetchStations()}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
                'bg-card text-foreground border border-border shadow-sm',
                'hover:bg-muted/50 transition-colors font-medium'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </motion.button>
          </div>

          {/* Line Filter */}
          {lines.length > 0 && (
            <LineFilter
              lines={lines}
              selectedLine={selectedLine}
              onSelectLine={setSelectedLine}
            />
          )}
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Station Cards - Main Content */}
          <div className="lg:col-span-3">
            {stationsLoading ? (
              // Loading State
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="h-32 rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : stationsError ? (
              // Error State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl p-8 text-center border border-destructive/20"
              >
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Connection Error
                </h3>
                <p className="text-muted-foreground mb-4">
                  Unable to fetch station data. Please check your connection and try
                  again.
                </p>
                <motion.button
                  onClick={() => refetchStations()}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Retry
                </motion.button>
              </motion.div>
            ) : filteredStations.length > 0 ? (
              // Station Grid
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStations.map((station) => (
                  <StationCard 
                    key={station.id} 
                    station={station} 
                    flowData={flowDataMap?.get(station.code)} 
                    isServiceClosed={isClosed}
                  />
                ))}
              </div>
            ) : stations && stations.length > 0 ? (
              // No Results
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-xl p-8 text-center border border-dashed border-muted-foreground/20"
              >
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No stations found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </motion.div>
            ) : (
              // Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No Stations Available
                </h3>
                <p className="text-muted-foreground mb-4">
                  No stations found in the database.
                </p>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Overview */}
          <div className="lg:col-span-1 space-y-6">
            {flowDataMap && (
              <CrowdingOverview 
                flowDataMap={flowDataMap} 
                isServiceClosed={isClosed}
              />
            )}

            {/* Quick Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">
                Legend
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-crowding-low mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">Low</p>
                    <p className="text-sm text-muted-foreground">
                      Comfortable
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-crowding-medium mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">Medium</p>
                    <p className="text-sm text-muted-foreground">
                      Moderate
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-crowding-high mt-1.5" />
                  <div>
                    <p className="font-medium text-foreground">High</p>
                    <p className="text-sm text-muted-foreground">
                      Busy/Congested
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              MTR Flow Analytics
            </p>
            <p className="text-sm text-muted-foreground">
              Data sourced from{' '}
              <a
                href="https://data.gov.hk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                DATA.GOV.HK
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
