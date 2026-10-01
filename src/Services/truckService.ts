import api from './api';

// ============================================
// TYPES
// ============================================
export type TruckStatus = 'available' | 'on-route' | 'maintenance' | 'offline';

export interface Truck {
  id: string;
  truckId: string;
  registrationNumber: string;
  driverId?: string | null;
  driverName?: string;
  zone: string;
  status: TruckStatus;
  completion: number;
  capacity: number;
  latitude?: number | null;
  longitude?: number | null;
  lastMaintenance: string;
  nextMaintenance: string;
  lastUpdate: string;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
}

export interface TruckFormData {
  truckId: string;
  registrationNumber: string;
  driverId: string;
  zone: string;
  status: TruckStatus;
  capacity: number;
  latitude: number;
  longitude: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface TruckStats {
  total: number;
  available: number;
  onRoute: number;
  maintenance: number;
  offline: number;
}

// ============================================
// DRIVER TYPE
// ============================================
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  zone?: string | null;
}

// ============================================
// TRUCK SERVICE
// ============================================
export const truckService = {
  // ----------------------------------------
  // GET ALL TRUCKS
  // ----------------------------------------
  getAllTrucks: async (filters?: {
    status?: string;
    zone?: string;
  }): Promise<{ count: number; trucks: Truck[] }> => {
    const response = await api.get('/trucks', { params: filters });
    return response.data;
  },

  // ----------------------------------------
  // GET TRUCK BY ID
  // ----------------------------------------
  getTruckById: async (id: string): Promise<{ truck: Truck }> => {
    const response = await api.get(`/trucks/${id}`);
    return response.data;
  },

  // ----------------------------------------
  // GET TRUCK STATS
  // ----------------------------------------
  getTruckStats: async (): Promise<{ stats: TruckStats }> => {
    const response = await api.get('/trucks/stats');
    return response.data;
  },

  // ----------------------------------------
  // CREATE TRUCK
  // ----------------------------------------
  createTruck: async (
    data: TruckFormData
  ): Promise<{ message: string; truck: Truck }> => {
    const response = await api.post('/trucks', data);
    return response.data;
  },

  // ----------------------------------------
  // UPDATE TRUCK
  // ----------------------------------------
  updateTruck: async (
    id: string,
    data: Partial<TruckFormData>
  ): Promise<{ message: string; truck: Truck }> => {
    const response = await api.put(`/trucks/${id}`, data);
    return response.data;
  },

  // ----------------------------------------
  // DELETE TRUCK
  // ----------------------------------------
  deleteTruck: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/trucks/${id}`);
    return response.data;
  },

  // ----------------------------------------
  // UPDATE TRUCK STATUS
  // ----------------------------------------
  updateTruckStatus: async (
    id: string,
    status: TruckStatus,
    completion?: number,
    latitude?: number,
    longitude?: number
  ): Promise<{ message: string; truck: Truck }> => {
    const response = await api.patch(`/trucks/${id}/status`, {
      status,
      completion,
      latitude,
      longitude,
    });
    return response.data;
  },
};

// ============================================
// USER SERVICE (for drivers dropdown)
// ============================================
export const userService = {
  getDrivers: async (): Promise<{ count: number; drivers: Driver[] }> => {
    const response = await api.get('/users/drivers');
    return response.data;
  },
};