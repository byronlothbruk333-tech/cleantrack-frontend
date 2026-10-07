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
  zone?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface AdminComment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorRole: string;
}

// ✅ IMPROVEMENT 4: Completion proof type
export interface CompletionProof {
  beforePhoto: string | null;
  afterPhoto: string | null;
  completedAt: string | null;
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
  adminComments?: AdminComment[];

  // ✅ Feature 1: Admin response to FAB alert / report
  adminResponse?: string | null;
  adminRespondedAt?: string | null;
  adminRespondedBy?: string | null;

  // ✅ Excel enhancements
  assignedTruck?: string | null;
  assignedDriver?: string | null;

  // ✅ IMPROVEMENT 4: Completion proof from driver
  completionProof?: CompletionProof | null;
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

export interface EmergencyResponse {
  id: string;
  emergencyType: string;
  adminResponse: string;
  respondedAt: string;
  createdAt: string;
   isResolved?: boolean;
  resolvedAt?: string | null;
}

// ============================================
// REPORT SERVICE
// ============================================
export const reportService = {
  // ✅ Admin responds to a report / emergency
  respondToReport: async (
    id: string,
    response: string
  ): Promise<{ message: string; report: Report }> => {
    const res = await api.post(`/reports/${id}/respond`, { response });
    return res.data;
  },

  // ✅ Driver fetches admin responses to their alerts
  getMyEmergencyResponses: async (): Promise<{
    count: number;
    responses: EmergencyResponse[];
  }> => {
    const res = await api.get('/reports/my-emergency-responses');
    return res.data;
  },

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
    zone?: string;
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

  // ✅ NEW: Fetch just the completion proof for a specific report
  // Useful if you want to refresh proof without fetching the whole report
  getReportCompletionProof: async (
    id: string
  ): Promise<{ completionProof: CompletionProof | null }> => {
    const response = await api.get(`/reports/${id}`);
    return {
      completionProof: response.data.report?.completionProof || null,
    };
  },
};