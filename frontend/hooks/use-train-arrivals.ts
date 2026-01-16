import { useQuery } from '@tanstack/react-query';
import { trainsApi, type StationTrains } from '@/lib/api';

export function useTrainArrivals(stationCode: string | null, enabled: boolean = true) {
  return useQuery<StationTrains>({
    queryKey: ['train-arrivals', stationCode],
    queryFn: async () => {
      if (!stationCode) throw new Error('Station code is required');
      const response = await trainsApi.getArrivals(stationCode);
      return response.data;
    },
    enabled: enabled && stationCode !== null,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
    retry: 2,
  });
}
