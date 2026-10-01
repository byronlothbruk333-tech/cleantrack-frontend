import api from './api';

// ============================================
// TYPES
// ============================================
export type IssueType =
  | 'missed-collection'
  | 'illegal-dumping'
  | 'overflowing-bin'
  | 'other';

export type ReportStatus = 'pending' | 'in-progress' | 'resolved' | 'rejected';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ReportData {
  issueType: IssueType;
  description: string;
  address: string;
  zone?: string; // ADDED
  latitude?: number;
  longitude?: number;
  photos?: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface Report extends ReportData {
  id: string;
  citizenId: string;
  status: ReportStatus;
  priority: Priority;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  citizen?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// ============================================
// REPORT SERVICE
// ============================================
export const reportService = {
  createReport: async (
    data: ReportData
  ): Promise<{ message: string; report: Report }> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getMyReports: async (): Promise<{ count: number; reports: Report[] }> => {
    const response = await api.get('/reports/my');
    return response.data;
  },

  getMyStats: async (): Promise<{ stats: ReportStats }> => {
    const response = await api.get('/reports/stats');
    return response.data;
  },

  getReportById: async (id: string): Promise<{ report: Report }> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  getAllReports: async (filters?: {
    status?: string;
    priority?: string;
    issueType?: string;
    zone?: string; // ADDED
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; reports: Report[] }> => {
    const response = await api.get('/reports', { params: filters });
    return response.data;
  },

  getCounts: async (): Promise<{
    counts: {
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
      rejected: number;
    };
  }> => {
    const response = await api.get('/reports/counts');
    return response.data;
  },

  updateReportStatus: async (
    id: string,
    status: ReportStatus,
    assignedTo?: string
  ): Promise<{ message: string; report: Report }> => {
    const response = await api.patch(`/reports/${id}/status`, {
      status,
      assignedTo,
    });
    return response.data;
  },

  updateReport: async (
    id: string,
    data: Partial<ReportData>
  ): Promise<{ message: string; report: Report }> => {
    const response = await api.put(`/reports/${id}`, data);
    return response.data;
  },

  deleteReport: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  getComments: async (
    reportId: string
  ): Promise<{ count: number; comments: Comment[] }> => {
    const response = await api.get(`/reports/${reportId}/comments`);
    return response.data;
  },

  addComment: async (
    reportId: string,
    content: string,
    isInternal: boolean = false
  ): Promise<{ message: string; comment: Comment }> => {
    const response = await api.post(`/reports/${reportId}/comments`, {
      content,
      isInternal,
    });
    return response.data;
  },

  createEmergencyAlert: async (data: {
    emergencyType: string;
    description: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ message: string; report: Report }> => {
    const { emergencyType, description, latitude, longitude } = data;

    const fullDescription = `[🚨 DRIVER EMERGENCY] ${emergencyType}${
      description ? `: ${description}` : ''
    }`;

    const response = await api.post('/reports', {
      issueType: 'other',
      description: fullDescription,
      address: 'Driver reported location',
      latitude,
      longitude,
      photos: [],
    });

    return response.data;
  },
};