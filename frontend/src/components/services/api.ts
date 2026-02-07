import type { 
  Invoice, Case, Client, Document, Note, 
  CreateInvoiceData, UpdateInvoiceData,
  InvoiceFilters, MeResponse, Event, CreateEventData, UpdateEventData, EventFilters
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

export const eventsService = {
  // Get all events with optional filters
  getAll: async (filters?: EventFilters): Promise<Event[]> => {
    const queryParams = new URLSearchParams();
    
    // Add all possible filters
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.event_type) queryParams.append('event_type', filters.event_type);
    if (filters?.case_id) queryParams.append('case_id', filters.case_id.toString());
    if (filters?.assigned_to_user_id) queryParams.append('assigned_to_user_id', filters.assigned_to_user_id.toString());
    if (filters?.start_date) queryParams.append('start_date', filters.start_date);
    if (filters?.end_date) queryParams.append('end_date', filters.end_date);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.upcoming) queryParams.append('upcoming', 'true');
    if (filters?.past) queryParams.append('past', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = `/api/events${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<Event[]>(endpoint);
    return result.data || [];
  },

  // Get single event by ID
  getById: async (id: number): Promise<Event | null> => {
    const result = await apiRequest<Event>(`/api/events/${id}`);
    return result.data || null;
  },

  // Create new event
  create: async (eventData: CreateEventData): Promise<Event | null> => {
    const result = await apiRequest<Event>(`/api/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    return result.data || null;
  },

  // Update event
  update: async (id: number, updateData: UpdateEventData): Promise<Event | null> => {
    const result = await apiRequest<Event>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return result.data || null;
  },

  // Delete event
  delete: async (id: number): Promise<boolean> => {
    const result = await apiRequest(`/api/events/${id}`, {
      method: 'DELETE'
    });
    return !result.error;
  },

  // Get upcoming events (next 7 days by default)
  getUpcomingEvents: async (days: number = 7, assignedTo?: number): Promise<Event[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('upcoming', 'true');
    if (assignedTo) queryParams.append('assigned_to', assignedTo.toString());
    
    const endpoint = `/api/events/upcoming?days=${days}&${queryParams.toString()}`;
    const result = await apiRequest<Event[]>(endpoint);
    return result.data || [];
  },

  // Get events for a specific case
  getCaseEvents: async (caseId: number): Promise<Event[]> => {
    const result = await apiRequest<Event[]>(`/api/cases/${caseId}/events`);
    return result.data || [];
  },

  // Get events for a specific month and year (calendar view)
  getCalendarEvents: async (year: number, month: number): Promise<Event[]> => {
    const result = await apiRequest<Event[]>(`/api/events/calendar/${year}/${month}`);
    return result.data || [];
  },

  // Send reminder for an event
  sendReminder: async (id: number): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<{ success: boolean; message: string }>(`/api/events/${id}/send-reminder`, {
      method: 'POST'
    });
    return result.data || { success: false, message: 'Failed to send reminder' };
  },

  // Get event statistics
  getStats: async (): Promise<any> => {
    const result = await apiRequest(`/api/stats/events`);
    return result.data || {};
  },

  // Get today's events
  getTodaysEvents: async (): Promise<Event[]> => {
    const today = new Date().toISOString().split('T')[0];
    const result = await apiRequest<Event[]>(`/api/events?start_date=${today}&end_date=${today}&status=scheduled,confirmed`);
    return result.data || [];
  },

  // Get events by date range
  getEventsByDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    const result = await apiRequest<Event[]>(`/api/events?start_date=${startDate}&end_date=${endDate}`);
    return result.data || [];
  },

  // Get events with pagination
  getPaginatedEvents: async (page: number = 1, limit: number = 10, filters?: EventFilters): Promise<{ 
    events: Event[]; 
    total: number; 
    page: number; 
    totalPages: number 
  }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.event_type) queryParams.append('event_type', filters.event_type);
    if (filters?.search) queryParams.append('search', filters.search);
    
    const endpoint = `/api/events?${queryParams.toString()}`;
    const result = await apiRequest<Event[]>(endpoint);
    
    // Note: This assumes your backend returns pagination info in headers or response
    // You might need to adjust based on your backend implementation
    return {
      events: result.data || [],
      total: 0,
      page,
      totalPages: 0
    };
  }
};

// Also update the dashboardService to include event-related functions
export const dashboardService = {
  // Existing functions...
  getStats: async (lawFirmId: number): Promise<any> => {
    const result = await apiRequest(`/api/stats/law-firm/${lawFirmId}`);
    return result.data || {};
  },

  // Get upcoming events for dashboard (next 5 events)
  getUpcomingDashboardEvents: async (limit: number = 5): Promise<Event[]> => {
    const result = await apiRequest<Event[]>(`/api/events?upcoming=true&limit=${limit}`);
    return result.data || [];
  },

  // Get today's events for dashboard
  getTodaysDashboardEvents: async (): Promise<Event[]> => {
    const today = new Date().toISOString().split('T')[0];
    const result = await apiRequest<Event[]>(`/api/events?start_date=${today}&end_date=${today}&status=scheduled,confirmed`);
    return result.data || [];
  },

  // Get recent documents
  getRecentDocuments: async (limit: number = 4): Promise<Document[]> => {
    const result = await apiRequest<Document[]>(`/api/documents?limit=${limit}&sort=uploaded_at:desc`);
    const documents = result.data || [];
    
    // Sort by uploaded_at and limit
    return documents
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, limit);
  },

  // Get upcoming deadlines (cases with deadlines in the future)
  getUpcomingDeadlines: async (limit: number = 5): Promise<Case[]> => {
    const today = new Date().toISOString().split('T')[0];
    const result = await apiRequest<Case[]>(`/api/cases?status=Active&deadline_from=${today}&sort=deadline&limit=${limit}`);
    return result.data || [];
  },

  // Get user-specific stats
  getUserStats: async (userId: number): Promise<any> => {
    try {
      // Get user's assigned cases
      const cases = await caseService.getAll();
      const userCases = cases.filter(c => c.assigned_to_user_id === userId);
      
      // Get upcoming events for user
      const upcomingEvents = await eventsService.getAll({ 
        assigned_to_user_id: userId,
        upcoming: true 
      });
      
      // Get today's events for user
      const todaysEvents = await eventsService.getTodaysEvents();
      const userTodaysEvents = todaysEvents.filter(e => e.assigned_to_user_id === userId);
      
      // Get recent documents uploaded by user
      const allDocuments = await documentService.getMyDocuments({});
      const userDocuments = allDocuments.filter(d => d.uploaded_by_user_id === userId)
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
        .slice(0, 5);
      
      // Calculate statistics
      const stats = {
        assignedCases: userCases.filter(c => c.status === 'Active').length,
        totalDocuments: userDocuments.length,
        upcomingEvents: upcomingEvents.length,
        todaysEvents: userTodaysEvents.length,
        deadlines: userCases.filter(c => c.deadline && new Date(c.deadline) > new Date()).length
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        assignedCases: 0,
        totalDocuments: 0,
        upcomingEvents: 0,
        todaysEvents: 0,
        deadlines: 0
      };
    }
  }
};


