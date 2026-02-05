// ==================== CORE TYPES ====================

export interface LawFirm {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  description: string | null;
  member_count: number;
  case_count: number;
  storage_used_mb: number;
  joined_date: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'associate' ;
  law_firm_id: number | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  permissions?: 'full access' | 'limited access' | 'no access';
  clientInfo?: Client;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  client_type: 'individual' | 'business';
  status: 'active' | 'inactive';
  user_account_id: number | null;
  assigned_associate_id: number;
  law_firm_id: number;
  joined_date: string;
  created_at: string;
  updated_at: string;
  
  assigned_associate_name?: string;
  assigned_associate_email?: string;
  user_account_username?: string;
  user_account_email?: string;
}

export interface Case {
  id: number;
  file_number: string;
  case_number: string;
  title: string;
  case_type: string;
  status: 'Active' | 'On Hold' | 'Closed';
  priority: 'low' | 'medium' | 'high';
  law_firm_id: number;
  client_id: number;
  assigned_to_user_id: number;
  added_by_user_id: number;
  date_opened: string;
  deadline: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  added_by_name?: string;
  law_firm_name?: string;
  
  documents?: Document[];
  notes?: Note[];
}

export interface Document {
  id: number;
  name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  mime_type: string | null;
  law_firm_id: number;
  case_id: number;
  uploaded_by_user_id: number;
  reviewer_user_id: number | null;
  document_type: string;
  description: string | null;
  version: number;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Reference';
  uploaded_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  file_data: string;
  uploaded_by_name?: string;
  case_title?: string;
  file_number?: string;
  client_name?: string;
  year?: string | number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  user_id: number;
  case_id: number | null;
  category: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  is_private: boolean;
  word_count: number;
  character_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  law_firm_id?: number | null;
  case_title?: string;
  file_number?: string;
  client_name?: string;
  user_name?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  case_id: number;
  client_id: number;
  law_firm_id: number;
  created_by_user_id: number;
  assigned_to_user_id: number;
  description: string | null;
  amount: number;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
  
  case_title?: string;
  file_number?: string;
  client_name?: string;
  created_by_name?: string;
  assigned_to_name?: string;
}

// ==================== AUTH TYPES ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'associate' | 'client';
  law_firm_id?: number;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
  clientInfo?: Client;
}

export interface MeResponse {
  user: User;
  clientInfo?: Client;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ==================== FORM TYPES ====================

export interface CreateLawFirmData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  description?: string;
}

export interface UpdateLawFirmData extends Partial<CreateLawFirmData> {}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'associate' | 'client';
  law_firm_id?: number;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  role?: 'admin' | 'associate' | 'client';
  law_firm_id?: number | null;
  is_active?: boolean;
  permissions?: 'full access' | 'limited access' | 'no access';
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  client_type: 'individual' | 'business';
  assigned_associate_id: number;
  user_account_id?: number;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: 'active' | 'inactive';
}

export interface CreateCaseData {
  file_number: string;
  case_number: string;
  title: string;
  client_id: number;
  case_type: string;
  status?: 'Active' | 'On Hold' | 'Closed';
  priority?: 'low' | 'medium' | 'high';
  assigned_to_user_id: number;
  deadline?: string;
  description?: string;
}

export interface UpdateCaseData extends Partial<CreateCaseData> {
  file_number?: string;
  case_number?: string;
  client_id?: number;
  assigned_to_user_id?: number;
}

export interface CreateDocumentData {
  name: string;
  case_id: number;
  document_type: string;
  description?: string;
  version?: number;
  status?: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Reference';
  file_data?: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  year?: string | number;
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  reviewer_user_id?: number | null;
  reviewed_at?: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  case_id?: number;
  category?: string;
  tags?: string[];
  is_private?: boolean;
  law_firm_id?: number | null;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
  is_private?: boolean;
  law_firm_id?: number | null;  
}

export interface CreateInvoiceData {
  invoice_number: string;
  case_id: number;
  client_id: number;
  assigned_to_user_id: number;
  description?: string;
  amount: number;
  due_date: string;
}

export interface UpdateInvoiceData {
  description?: string;
  amount?: number;
  due_date?: string;
  paid_date?: string | null;
  status?: 'draft' | 'pending' | 'paid' | 'overdue';
  assigned_to_user_id?: number;
}

// ==================== FILTER TYPES ====================

export interface CaseFilters {
  status?: 'Active' | 'On Hold' | 'Closed';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientFilters {
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DocumentFilters {
  case_id?: number;
  status?: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Reference';
  search?: string;
  page?: number;
  limit?: number;
}

export interface NoteFilters {
  case_id?: number;
  is_archived?: boolean;
  is_pinned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceFilters {
  status?: 'draft' | 'pending' | 'paid' | 'overdue';
  client_id?: number;
  case_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: 'admin' | 'associate' | 'client';
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== STATISTICS TYPES ====================

export interface LawFirmStats {
  member_count: number;
  case_count: number;
  storage_used_mb: number;
  active_cases: number;
  closed_cases: number;
  high_priority_cases: number;
  associate_count: number;
  admin_count: number;
  active_clients: number;
  paid_invoices: number;
  pending_invoices: number;
  total_revenue: number;
}

export interface DashboardStats {
  law_firm: LawFirmStats;
  recent_cases: Case[];
  upcoming_deadlines: Case[];
  recent_documents: Document[];
  pending_invoices: Invoice[];
}