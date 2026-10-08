// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'driver' | 'admin' | 'management';
  status?: 'active' | 'inactive' | 'suspended';
  googleId?: string | null;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  zone?: string | null;
   bio?: string | null;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  deleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Truck Types
export interface Truck {
  truckid: string;
  registrationNumber: string;
  zone: string;
  status: 'available' | 'on-route' | 'maintenance' | 'offline';
  currentLocation: {
    lat: number;
    lng: number;
  };
  lastUpdate: string;
  driverId?: string;
}

// Route Types
export interface Route {
  id: string;
  truckId: string;
  zone: string;
  suburb: string;
  wards: string;
  stops: RouteStop[];
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  scheduledStart: string;
  scheduledEnd: string;
  estimatedDuration: number;
}

export interface RouteStop {
  id: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  isComplaintStop?: boolean;
  complaintType?: 'missed-collection' | 'illegal-dumping';
  photoProof?: string | null;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
}

export interface Complaint {
  id?: string;
  type: 'missed-pickup' | 'overflowing-bin' | 'illegal-dumping' | 'other';
  description: string;
  citizenName: string;
  address?: string;
  status?: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt?: string;
  resolvedAt?: string;
  photo?: string;
}

// KPI Types
export interface KPI {
  completionRate: number;
  fuelEfficiency: number;
  punctuality: number;
  totalCollections: number;
  citizenSatisfaction: number;
}