import type{ 
  Invoice, Case, Client,Document,Note,
  CreateInvoiceData, UpdateInvoiceData,
  InvoiceFilters, MeResponse,
} from '../../types/Types';
import { apiRequest } from '../lib/api';

export const invoiceService = {
  // Get all invoices with optional filters
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.client_id) queryParams.append('client_id', filters.client_id.toString());
    if (filters?.case_id) queryParams.append('case_id', filters.case_id.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/invoices${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<Invoice[]>(endpoint);
    return result.data || [];
  },

  // Get single invoice by ID
  getById: async (id: number): Promise<Invoice | null> => {
    const result = await apiRequest<Invoice>(`/api/invoices/${id}`);
    return result.data || null;
  },

  // Create new invoice
  create: async (invoiceData: CreateInvoiceData): Promise<Invoice | null> => {
    const result = await apiRequest<Invoice>(`/api/invoices`, {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
    return result.data || null;
  },

  // Update invoice
  update: async (id: number, updateData: UpdateInvoiceData): Promise<Invoice | null> => {
    const result = await apiRequest<Invoice>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return result.data || null;
  },

  // Delete invoice (if you add this endpoint)
  delete: async (id: number): Promise<boolean> => {
    const result = await apiRequest(`/api/invoices/${id}`, {
      method: 'DELETE'
    });
    return !result.error;
  }
};

export const caseService = {
  // Get all cases
  getAll: async (filters?: { status?: string; search?: string }): Promise<Case[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/cases${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<Case[]>(endpoint);
    return result.data || [];
  },

  // Get single case by ID
  getById: async (id: number): Promise<Case | null> => {
    const result = await apiRequest<Case>(`/api/cases/${id}`);
    return result.data || null;
  }
};

export const clientService = {
  // Get all clients
  getAll: async (): Promise<Client[]> => {
    const result = await apiRequest<Client[]>(`/api/clients`);
    return result.data || [];
  }
};

export const authService = {
  // Get current user info
  getMe: async (): Promise<MeResponse | null> => {
    const result = await apiRequest<MeResponse>(`/api/auth/me`);
    return result.data || null;
  }
};


// Add these functions to the existing api.ts file

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (lawFirmId: number): Promise<any> => {
    const result = await apiRequest(`/api/stats/law-firm/${lawFirmId}`);
    return result.data || {};
  },

  // Get recent cases for the current user
  getMyRecentCases: async (limit: number = 3): Promise<Case[]> => {
    const result = await apiRequest<Case[]>(`/api/cases`);
    const cases = result.data || [];
    
    // Filter and limit cases (you could add sorting by recent activity)
    return cases
      .filter(c => c.status === 'Active')
      .slice(0, limit);
  },

  // Get recent documents
  getRecentDocuments: async (limit: number = 4): Promise<Document[]> => {
    const result = await apiRequest<Document[]>(`/api/documents`);
    const documents = result.data || [];
    
    // Sort by uploaded_at and limit
    return documents
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, limit);
  },

  // Get upcoming deadlines (cases with deadlines in the future)
  getUpcomingDeadlines: async (userId: number, limit: number = 5) => {
    const response = await apiRequest(`/api/cases?assigned_to=${userId}&status=Active&sort=deadline&limit=${limit}`);
    return response.data;
  },

  getFirmStats: async (lawFirmId: number) => {
    const response = await apiRequest(`/api/stats/law-firm/${lawFirmId}`);
    return response.data;
  },
  
  getUserStats: async (userId: number) => {
    const response = await apiRequest(`/api/stats/user/${userId}`);
    return response.data;
  },
  
  getMyRecentDocuments: async (userId: number, limit: number = 5) => {
    const response = await apiRequest(`/api/documents?user_id=${userId}&limit=${limit}`);
    return response.data;
  },
};

// Add these to your existing api.ts

export const clientCaseService = {
  // Get cases for the current client (client sees only their own cases)
  getMyCases: async (): Promise<Case[]> => {
    const result = await apiRequest<Case[]>(`/api/cases`);
    // Backend should already filter cases to show only the client's cases
    return result.data || [];
  },

  // Get single case by ID (with client access check)
  getCaseById: async (id: number): Promise<Case | null> => {
    const result = await apiRequest<Case>(`/api/cases/${id}`);
    return result.data || null;
  },

  // Get case timeline/activity (you might need to create this endpoint)
  getCaseTimeline: async (caseId: number): Promise<any[]> => {
    // This is a placeholder - you'll need to create this endpoint
    // Or you can use notes/documents as timeline events
    const notesResult = await apiRequest<Note[]>(`/api/notes?case_id=${caseId}`);
    return notesResult.data?.map(note => ({
      id: note.id,
      date: note.created_at,
      title: note.title,
      description: note.content,
      type: 'note'
    })) || [];
  }
};

// Add these to your existing api.ts

export const documentService = {
  // Get all documents for the current client
  getMyDocuments: async (filters?: { 
    case_id?: number; 
    status?: string;
    search?: string;
  }): Promise<Document[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.case_id) queryParams.append('case_id', filters.case_id.toString());
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search || '');
    
    const queryString = queryParams.toString();
    const endpoint = `/api/documents${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<Document[]>(endpoint);
    return result.data || [];
  },

  // Upload a new document
  uploadDocument: async (formData: FormData): Promise<Document | null> => {
    const result = await apiRequest<Document>(`/api/documents`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData, browser will set it with boundary
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return result.data || null;
  },

  // Delete a document
  deleteDocument: async (id: number): Promise<boolean> => {
    const result = await apiRequest(`/api/documents/${id}`, {
      method: 'DELETE'
    });
    return !result.error;
  },

  // Download a document
  downloadDocument: async (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

// Add these to your existing api.ts

export const clientBillingService = {
  // Get invoices for the current client
  getMyInvoices: async (filters?: { 
    status?: string; 
    search?: string;
  }): Promise<Invoice[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search || '');
    
    const queryString = queryParams.toString();
    const endpoint = `/api/invoices${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<Invoice[]>(endpoint);
    return result.data || [];
  },

  // Get single invoice by ID
  getInvoiceById: async (id: number): Promise<Invoice | null> => {
    const result = await apiRequest<Invoice>(`/api/invoices/${id}`);
    return result.data || null;
  },

  // Update invoice (for payment proof upload)
  updateInvoice: async (id: number, updateData: UpdateInvoiceData): Promise<Invoice | null> => {
    const result = await apiRequest<Invoice>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return result.data || null;
  },

  // Upload payment proof (this would need a separate endpoint)
  uploadPaymentProof: async (invoiceId: number, file: File, description?: string): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('invoice_id', invoiceId.toString());
    if (description) formData.append('description', description);

    // Note: You'll need to create this endpoint in your backend
    const result = await apiRequest(`/api/payments/proof`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        // Don't set Content-Type for FormData, browser will set it
      }
    });
    
    return !result.error;
  },

  // Get payment history (from paid invoices)
  getPaymentHistory: async (): Promise<Invoice[]> => {
    const result = await apiRequest<Invoice[]>(`/api/invoices?status=paid`);
    return result.data || [];
  }
};

// Add these to your existing api.ts

export const clientDashboardService = {
  // Get dashboard statistics for client
  getClientStats: async (): Promise<{
    totalCases: number;
    activeCases: number;
    completedCases: number;
    totalDocuments: number;
    pendingDocuments: number;
    outstandingBalance: number;
    totalBilled: number;
  }> => {
    // Get cases
    const cases = await caseService.getAll();
    
    // Get documents
    const documents = await documentService.getMyDocuments();
    
    // Get invoices
    const invoices = await invoiceService.getAll();
    
    return {
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'Active').length,
      completedCases: cases.filter(c => c.status === 'Closed').length,
      totalDocuments: documents.length,
      pendingDocuments: documents.filter(d => d.status === 'Draft' || d.status === 'Under Review').length,
      outstandingBalance: invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.amount, 0),
      totalBilled: invoices.reduce((sum, inv) => sum + inv.amount, 0)
    };
  },

  // Get recent documents for dashboard
  getRecentDocuments: async (limit: number = 4): Promise<Document[]> => {
    const documents = await documentService.getMyDocuments();
    return documents
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, limit);
  }
};


