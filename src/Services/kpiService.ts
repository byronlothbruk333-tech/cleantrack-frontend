import api from './api';

// ============================================
// TYPES
// ============================================
export interface KPIs {
  completionRate: number;
  fuelEfficiency: number;
  punctuality: number;
  citizenSatisfaction: number;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  inProgressReports: number;
  totalCollections: number;
  totalTrucks: number;
  activeTrucks: number;
  availableTrucks: number;
  totalCitizens: number;
  totalDrivers: number;
  avgTruckCompletion: number;
}

export interface FleetTruck {
  id: string;
  truckId: string;
  registrationNumber: string;
  driver: {
    id: string;
    name: string;
    email: string;
  } | null;
  driverName: string;
  zone: string;
  status: string;
  completion: number;
  capacity: number;
  workingDays?: string[];
  lastUpdate: string;
}

export interface RoutePerformance {
  id: number;
  route: string;
  driver: string;
  truckId: string;
  duration: string;
  durationType?: 'scheduled' | 'actual';
  stops: number;
  completed: number;
  efficiency: number;
  status: string;
}

export interface RoutePerformanceResponse {
  routes: RoutePerformance[];
  stats: {
    totalRoutes: number;
    completedRoutes: number;
    avgEfficiency: number;
    avgDuration: number;
  };
}

export interface DashboardData {
  kpis: KPIs;
  fleet: FleetTruck[];
  routes: RoutePerformance[];
  stats: {
    totalRoutes: number;
    completedRoutes: number;
    avgEfficiency: number;
    avgDuration: number;
  };
  fetchedAt: string;
}

// ============================================
// NO-CACHE HEADERS
// ============================================
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// ============================================
// KPI SERVICE
// ============================================
export const kpiService = {
  // ✅ NEW: Single call that returns everything for the dashboard
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get('/kpis/dashboard', {
      headers: noCacheHeaders,
    });
    return response.data;
  },

  // Legacy methods — kept for other pages that may still use them
  getKPIs: async (): Promise<{ kpis: KPIs }> => {
    const response = await api.get('/kpis', {
      headers: noCacheHeaders,
    });
    return response.data;
  },

  getFleetStatus: async (): Promise<{ fleet: FleetTruck[] }> => {
    const response = await api.get('/kpis/fleet', {
      headers: noCacheHeaders,
    });
    return response.data;
  },

  getRoutePerformance: async (): Promise<RoutePerformanceResponse> => {
    const response = await api.get('/kpis/routes', {
      headers: noCacheHeaders,
    });
    return response.data;
  },
};