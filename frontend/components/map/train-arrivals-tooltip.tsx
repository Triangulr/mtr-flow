'use client';

import { useTrainArrivals } from '@/hooks/use-train-arrivals';
import { Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainArrivalsTooltipProps {
  stationCode: string;
  stationName: string;
  crowdingLevel?: 'low' | 'medium' | 'high';
  isInterchange?: boolean;
  isNonMTR?: boolean;
}

export function TrainArrivalsTooltip({
  stationCode,
  stationName,
  crowdingLevel,
  isInterchange,
  isNonMTR = false,
}: TrainArrivalsTooltipProps) {
  const { data: trainsData, isLoading, error } = useTrainArrivals(
    stationCode,
    !isNonMTR // Only fetch if it's an MTR station
  );

  const getCrowdingBadgeColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="w-[320px] max-h-[400px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700">
        <div>
          <h3 className="font-bold text-base text-white">{stationName}</h3>
          {isInterchange && (
            <p className="text-[10px] text-primary mt-0.5">Interchange Station</p>
          )}
        </div>
        {crowdingLevel && (
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              getCrowdingBadgeColor(crowdingLevel)
            )}
            title={`Crowding: ${crowdingLevel}`}
          />
        )}
      </div>

      {/* Non-MTR Station Message */}
      {isNonMTR && (
        <div className="py-4 text-center">
          <p className="text-sm text-amber-400 font-medium">Not part of MTR network</p>
          <p className="text-xs text-slate-500 mt-1">High-speed rail station</p>
        </div>
      )}

      {/* Train Arrivals */}
      {!isNonMTR && isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-400">Loading trains...</span>
        </div>
      )}

      {!isNonMTR && error && (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-400">Unable to load train data</p>
        </div>
      )}

      {!isNonMTR && trainsData && trainsData.lines && trainsData.lines.length > 0 && (
        <div className="space-y-4">
          {trainsData.lines.map((line) => (
            <div key={line.line_code} className="space-y-2">
              {/* Line Header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-xs font-semibold text-slate-200">
                  {line.line_name}
                </span>
              </div>

              {/* UP Trains */}
              {line.up_trains && line.up_trains.length > 0 && (
                <div className="ml-5 space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Upward
                  </div>
                  {line.up_trains.map((train, idx) => (
                    <div
                      key={`up-${idx}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Plat {train.platform}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-300">{train.destination_code}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{train.ttnt} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DOWN Trains */}
              {line.down_trains && line.down_trains.length > 0 && (
                <div className="ml-5 space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Downward
                  </div>
                  {line.down_trains.map((train, idx) => (
                    <div
                      key={`down-${idx}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Plat {train.platform}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-300">{train.destination_code}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{train.ttnt} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No trains message */}
              {(!line.up_trains || line.up_trains.length === 0) &&
                (!line.down_trains || line.down_trains.length === 0) && (
                  <div className="ml-5 text-xs text-slate-500 italic">
                    No trains scheduled
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {!isNonMTR && trainsData && (!trainsData.lines || trainsData.lines.length === 0) && (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-400">No train data available</p>
        </div>
      )}

      {/* Timestamp */}
      {!isNonMTR && trainsData && trainsData.timestamp && (
        <div className="mt-3 pt-3 border-t border-slate-700 text-[10px] text-slate-500 text-center">
          Updated: {new Date(trainsData.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
