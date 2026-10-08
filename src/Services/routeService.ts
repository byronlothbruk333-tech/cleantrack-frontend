import api from './api';

// ============================================
// TYPES
// ============================================
export type StopStatus = 'pending' | 'completed' | 'skipped';

export type RouteStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';

export interface ReportCommentSummary {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorRole: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  sequence: number;
  address: string;
  suburb: string;
  latitude: number;
  longitude: number;
  status: StopStatus;
  completedAt?: string | null;
  skippedReason?: string | null;
  notes?: string | null;
  isComplaintStop: boolean;
  complaintType?: string | null;
  reportId?: string | null;
  beforePhoto?: string | null;
  afterPhoto?: string | null;

  // ✅ Report data attached for complaint stops
  reportPhotos?: string[];
  reportDescription?: string | null;
  reportIssueType?: string | null;
  reportComments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    authorName: string;
    authorRole: string;
  }>;
  reportAdminResponse?: string | null;
  reportAdminRespondedAt?: string | null;
}

export interface TruckInfo {
  id: string;
  truckId: string;
  registrationNumber: string;
  zone: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface Route {
  id: string;
  truckId: string;
  zone: string;
  suburb: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  estimatedDuration: number;
  status: RouteStatus;
  totalStops: number;
  completedStops: number;
  notes?: string | null;
  stops?: RouteStop[];
  truck?: TruckInfo;
}

// ============================================
// COMPLETE STOP RESPONSE
// ✅ `stop` can be null when a complaint stop is
//    removed from the route after completion.
// ✅ `stopRemoved` signals that the stop no longer
//    exists — the frontend should refetch the route.
// ============================================
export interface CompleteStopResponse {
  message: string;
  stop: RouteStop | null;
  stopRemoved?: boolean;
  routeProgress: {
    completedStops: number;
    totalStops: number;
    progressPercent: number;
    routeStatus: RouteStatus;
  };
}

export interface GetAllRoutesResponse {
  total: number;
  limit: number;
  offset: number;
  routes: Route[];
}

// ============================================
// TODAY'S ROUTES RESPONSE
// ✅ The backend now returns ALL of today's routes:
//    • Collection route (if today is a collection day)
//    • Any complaint-response routes assigned today
// The `route` alias points at the first item for backwards
// compatibility.
// ============================================
export interface TodaysRoutesResponse {
  routes: Route[];
  route: Route | null;
}

// ============================================
// ROUTE SERVICE
// ============================================
export const routeService = {
  // ----------------------------------------
  // GET TODAY'S ROUTES (driver)
  // ✅ Returns an array of routes:
  //    • Collection route (if today is a collection day)
  //    • Any complaint-response routes assigned today
  // ----------------------------------------
  getTodaysRoute: async (): Promise<TodaysRoutesResponse> => {
    const response = await api.get('/routes/today');
    return response.data;
  },

  // ----------------------------------------
  // GET ALL ROUTES (admin)
  // ----------------------------------------
  getAllRoutes: async (filters?: {
    status?: string;
    zone?: string;
    date?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetAllRoutesResponse> => {
    const response = await api.get('/routes', { params: filters });
    return response.data;
  },

  // ----------------------------------------
  // GET ROUTE BY ID
  // ----------------------------------------
  getRouteById: async (id: string | number): Promise<{ route: Route }> => {
    const response = await api.get(`/routes/${id}`);
    return response.data;
  },

  // ----------------------------------------
  // GET ROUTE BY TRUCK ID
  // ----------------------------------------
  getRouteByTruckId: async (truckId: string): Promise<{ route: Route }> => {
    const response = await api.get(`/routes/truck/${truckId}`);
    return response.data;
  },

  // ----------------------------------------
  // GET ROUTE BY DRIVER ID
  // ----------------------------------------
  getRouteByDriverId: async (driverId: string): Promise<{ route: Route }> => {
    const response = await api.get(`/routes/driver/${driverId}`);
    return response.data;
  },

  // ----------------------------------------
  // COMPLETE A STOP
  // ----------------------------------------
  completeStop: async (
    routeId: string,
    stopId: string,
    data: {
      beforePhoto?: string;
      afterPhoto?: string;
      notes?: string;
    }
  ): Promise<CompleteStopResponse> => {
    const response = await api.patch(
      `/routes/${routeId}/stops/${stopId}/complete`,
      data
    );
    return response.data;
  },

  // ----------------------------------------
  // SKIP A STOP
  // ----------------------------------------
  skipStop: async (
    routeId: string,
    stopId: string,
    reason: string
  ): Promise<{ message: string; stop: RouteStop }> => {
    const response = await api.patch(
      `/routes/${routeId}/stops/${stopId}/skip`,
      { reason }
    );
    return response.data;
  },

  // ----------------------------------------
  // UPDATE STOP NOTES
  // ----------------------------------------
  updateStopNotes: async (
    routeId: string,
    stopId: string,
    notes: string
  ): Promise<{ message: string; stop: RouteStop }> => {
    const response = await api.patch(
      `/routes/${routeId}/stops/${stopId}/notes`,
      { notes }
    );
    return response.data;
  },

  // ----------------------------------------
  // UPDATE ROUTE STATUS
  // ----------------------------------------
  updateRouteStatus: async (
    routeId: string,
    status: RouteStatus
  ): Promise<{ message: string; route: Route }> => {
    const response = await api.patch(`/routes/${routeId}/status`, { status });
    return response.data;
  },
};