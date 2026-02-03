import axios from 'axios';
import { STATIONS } from './data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mtr-api.axs.ink';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Station {
  id: number;
  code: string;
  name: string;
  line: string;
  latitude?: number;
  longitude?: number;
}

export interface FlowData {
  id: number;
  station_code: string;
  timestamp: string;
  next_train_minutes?: number;
  train_frequency?: number;
  crowding_level?: 'low' | 'medium' | 'high';
  is_delay?: boolean;
}

export interface Prediction {
  id: number;
  station_code: string;
  prediction_timestamp: string;
  predicted_crowding: 'low' | 'medium' | 'high';
  confidence: number;
  created_at: string;
}

export interface TrainArrival {
  platform: string;
  destination: string;
  destination_code: string;
  time: string;
  ttnt: string; // Time to next train in minutes
  valid: boolean;
}

export interface LineTrains {
  line_code: string;
  line_name: string;
  color: string;
  up_trains: TrainArrival[];
  down_trains: TrainArrival[];
  frequency_up?: number;
  frequency_down?: number;
}

export interface StationTrains {
  station_code: string;
  station_name: string;
  timestamp: string;
  lines: LineTrains[];
}

// API functions
export const stationsApi = {
  // Use local data for reliability as per user request
  getAll: () => Promise.resolve({ data: STATIONS }),
  getByCode: (code: string) => {
    const station = STATIONS.find(s => s.code === code);
    return Promise.resolve({ data: station || STATIONS[0] });
  }
};

export const flowDataApi = {
  getLatest: (stationCode: string) => {
    // Mock random flow data for prototype feel if API fails (optional but good for demo)
    // We try to call real API first, if it fails, return mock
    return api.get<FlowData>(`/api/flow/latest/${stationCode}`).catch(() => {
        const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        return {
            data: {
                id: Math.random(),
                station_code: stationCode,
                timestamp: new Date().toISOString(),
                next_train_minutes: Math.floor(Math.random() * 10),
                train_frequency: 4 + Math.random() * 4,
                crowding_level: randomLevel,
                is_delay: Math.random() > 0.8 // 20% chance of delay in mock
            }
        };
    });
  },
  getAll: (params?: {
    station_code?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
  }) => {
    return api.get<FlowData[]>('/api/flow', { params })
      .then(response => {
        if (!response.data || response.data.length === 0) {
          return { ...response, data: generateMockHistory(params?.station_code, params?.limit) };
        }
        return response;
      })
      .catch(() => {
        return {
          data: generateMockHistory(params?.station_code, params?.limit),
          status: 200,
          statusText: 'OK',
          headers: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config: {} as any
        };
      });
  },
};

const generateMockHistory = (stationCode: string = 'CEN', limit: number = 48): FlowData[] => {
  const data: FlowData[] = [];
  const now = new Date();
  
  for (let i = 0; i < limit; i++) {
    const time = new Date(now.getTime() - i * 15 * 60 * 1000); // 15 min intervals backward
    const hour = time.getHours();
    
    // Simulate rush hours (8-9 AM, 6-7 PM)
    const isRushHour = (hour >= 8 && hour <= 9) || (hour >= 18 && hour <= 19);
    
    data.push({
      id: i,
      station_code: stationCode,
      timestamp: time.toISOString(),
      next_train_minutes: Math.floor(Math.random() * 5) + 2,
      train_frequency: isRushHour ? 2 + Math.random() : 4 + Math.random() * 3,
      crowding_level: isRushHour ? 'high' : (Math.random() > 0.7 ? 'medium' : 'low'),
      is_delay: false
    });
  }
  
  return data;
};

export const predictionsApi = {
  getForStation: (stationCode: string, hoursAhead: number = 24) =>
    api.get<Prediction[]>(`/api/predictions/${stationCode}`, {
      params: { hours_ahead: hoursAhead },
    }),
  getLatest: (stationCode: string) =>
    api.get<Prediction>(`/api/predictions/latest/${stationCode}`),
};

export const trainsApi = {
  getArrivals: (stationCode: string) =>
    api.get<StationTrains>(`/api/stations/${stationCode}/trains`),
};
