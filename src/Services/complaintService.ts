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

export interface Complaint {
  id: string;
  citizenId: string;
  issueType: IssueType;
  description: string;
  address: string;
  zone?: string | null; // ADDED
  latitude?: number | null;
  longitude?: number | null;
  photos: string[];
  status: ReportStatus;
  priority: Priority;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  createdAt: string;
  updatedAt: string;
  citizen?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
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
// COMPLAINT SERVICE
// ============================================
export const complaintService = {
  // ----------------------------------------
  // GET COMPLAINT BY ID
  // ----------------------------------------
  getComplaintById: async (id: string): Promise<{ report: Complaint }> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  // ----------------------------------------
  // UPDATE STATUS
  // ----------------------------------------
  updateStatus: async (
    id: string,
    status: ReportStatus,
    assignedTo?: string
  ): Promise<{ message: string; report: Complaint }> => {
    const response = await api.patch(`/reports/${id}/status`, {
      status,
      assignedTo,
    });
    return response.data;
  },

  // ----------------------------------------
  // GET COMMENTS
  // ----------------------------------------
  getComments: async (
    reportId: string
  ): Promise<{ count: number; comments: Comment[] }> => {
    const response = await api.get(`/reports/${reportId}/comments`);
    return response.data;
  },

  // ----------------------------------------
  // ADD COMMENT
  // ----------------------------------------
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

  // ----------------------------------------
  // DELETE COMMENT
  // ----------------------------------------
  deleteComment: async (
    reportId: string,
    commentId: string
  ): Promise<{ message: string }> => {
    const response = await api.delete(
      `/reports/${reportId}/comments/${commentId}`
    );
    return response.data;
  },
};