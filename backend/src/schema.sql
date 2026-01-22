-- Create tables in correct order to avoid circular dependencies

-- 1. LAW FIRMS TABLE (no dependencies)
CREATE TABLE law_firms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    logo_url VARCHAR(500),
    description TEXT,
    
    -- Stats
    member_count INTEGER DEFAULT 0,
    case_count INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    
    -- Dates
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE (depends on law_firms only)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    permissions VARCHAR(255) DEFAULT 'limited access'
     CHECK (permissions IN ('full access', 'limited access', 'no access')),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    
    -- Role and association
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'associate', 'client')),
    law_firm_id INTEGER REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- User status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints - Only associate must have law_firm
    CONSTRAINT associate_must_have_law_firm 
        CHECK ((role = 'associate' AND law_firm_id IS NOT NULL) 
               OR role != 'associate'),
    CONSTRAINT client_cannot_have_law_firm 
        CHECK (role != 'client' OR law_firm_id IS NULL)
);

-- 3. CLIENTS TABLE (depends on users)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(255),
    client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('individual', 'business')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Relationships - link to user account (for client login)
    user_account_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    
    -- Relationship - assigned associate/lawyer
    assigned_associate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Relationship - law firm this client belongs to
    law_firm_id INTEGER NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Dates
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints for business clients
    CONSTRAINT business_company_required 
        CHECK (client_type != 'business' OR (client_type = 'business' AND company IS NOT NULL))
);

-- 4. CASES TABLE (depends on law_firms, users, and clients)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    file_number VARCHAR(50) UNIQUE NOT NULL,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' 
        CHECK (status IN ('Active', 'On Hold', 'Closed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Relationships
    law_firm_id INTEGER NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    added_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Dates
    date_opened DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    
    -- Description
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make sure your documents table has a column for base64 data
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  case_id INTEGER REFERENCES cases(id),
  document_type VARCHAR(100),
  description TEXT,
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'Draft',
  law_firm_id INTEGER REFERENCES law_firms(id),
  uploaded_by_user_id INTEGER REFERENCES users(id),
  reviewer_user_id INTEGER REFERENCES users(id),
  
  -- Base64 storage
  file_data TEXT, -- Store base64 data here
  file_name VARCHAR(255),
  file_path VARCHAR(500), -- Optional: can still store path for filesystem storage
  file_size INTEGER,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Relationships
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    law_firm_id INTEGER REFERENCES law_firms(id);
    
    -- Categorization
    category VARCHAR(100) DEFAULT 'Uncategorized',
    tags TEXT[] DEFAULT '{}',
    
    -- Status flags
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Statistics
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. INVOICES TABLE (depends on cases, clients, law_firms, users)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    law_firm_id INTEGER NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Invoice details
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending', 'paid', 'overdue')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT amount_positive CHECK (amount > 0),
    CONSTRAINT due_after_issue CHECK (due_date >= issue_date),
    CONSTRAINT paid_after_issue CHECK (paid_date IS NULL OR paid_date >= issue_date)
);

-- Create triggers and indexes

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER law_firms_updated_at_trigger
    BEFORE UPDATE ON law_firms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER clients_updated_at_trigger
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cases_updated_at_trigger
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER documents_updated_at_trigger
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notes_updated_at_trigger
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER invoices_updated_at_trigger
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate assigned associate role (replaces CHECK constraint)
CREATE OR REPLACE FUNCTION validate_assigned_associate_role()
RETURNS TRIGGER AS $$
DECLARE
    associate_role VARCHAR(20);
BEGIN
    -- Check if assigned associate has the right role
    SELECT role INTO associate_role FROM users WHERE id = NEW.assigned_associate_id;
    
    IF associate_role NOT IN ('associate', 'admin') THEN
        RAISE EXCEPTION 'Assigned associate must have role associate or admin';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_assigned_associate_role_trigger
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION validate_assigned_associate_role();

-- Function to validate case assignments (replaces CHECK constraints)
CREATE OR REPLACE FUNCTION validate_case_assignments()
RETURNS TRIGGER AS $$
DECLARE
    assigned_user_firm_id INTEGER;
    added_by_user_firm_id INTEGER;
    client_firm_id INTEGER;
    user_role VARCHAR(20);
BEGIN
    -- Check assigned user is from same law firm
    SELECT law_firm_id, role INTO assigned_user_firm_id, user_role 
    FROM users WHERE id = NEW.assigned_to_user_id;
    
    IF assigned_user_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Assigned user must be from the same law firm';
    END IF;
    
    IF user_role NOT IN ('associate', 'admin') THEN
        RAISE EXCEPTION 'Assigned user must have role associate or admin';
    END IF;
    
    -- Check added by user is from same law firm
    SELECT law_firm_id INTO added_by_user_firm_id 
    FROM users WHERE id = NEW.added_by_user_id;
    
    IF added_by_user_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Added by user must be from the same law firm';
    END IF;
    
    -- Check client is from same law firm
    SELECT law_firm_id INTO client_firm_id 
    FROM clients WHERE id = NEW.client_id;
    
    IF client_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Client must be from the same law firm';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_case_assignments_trigger
BEFORE INSERT OR UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION validate_case_assignments();

-- Function to validate document assignments (replaces CHECK constraints)
CREATE OR REPLACE FUNCTION validate_document_assignments()
RETURNS TRIGGER AS $$
DECLARE
    uploaded_user_firm_id INTEGER;
    case_firm_id INTEGER;
BEGIN
    -- Check uploaded user is from same law firm
    SELECT law_firm_id INTO uploaded_user_firm_id 
    FROM users WHERE id = NEW.uploaded_by_user_id;
    
    IF uploaded_user_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Uploaded by user must be from the same law firm';
    END IF;
    
    -- Check case is from same law firm
    SELECT law_firm_id INTO case_firm_id 
    FROM cases WHERE id = NEW.case_id;
    
    IF case_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Case must be from the same law firm';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_document_assignments_trigger
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION validate_document_assignments();

-- Function to validate invoice assignments (replaces CHECK constraint)
CREATE OR REPLACE FUNCTION validate_invoice_assignments()
RETURNS TRIGGER AS $$
DECLARE
    case_firm_id INTEGER;
    client_firm_id INTEGER;
    created_by_firm_id INTEGER;
    assigned_to_firm_id INTEGER;
BEGIN
    -- Check case is from same law firm
    SELECT law_firm_id INTO case_firm_id 
    FROM cases WHERE id = NEW.case_id;
    
    IF case_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Case must be from the same law firm as invoice';
    END IF;
    
    -- Check client is from same law firm
    SELECT law_firm_id INTO client_firm_id 
    FROM clients WHERE id = NEW.client_id;
    
    IF client_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Client must be from the same law firm as invoice';
    END IF;
    
    -- Check created by user is from same law firm
    SELECT law_firm_id INTO created_by_firm_id 
    FROM users WHERE id = NEW.created_by_user_id;
    
    IF created_by_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Created by user must be from the same law firm as invoice';
    END IF;
    
    -- Check assigned to user is from same law firm
    SELECT law_firm_id INTO assigned_to_firm_id 
    FROM users WHERE id = NEW.assigned_to_user_id;
    
    IF assigned_to_firm_id != NEW.law_firm_id THEN
        RAISE EXCEPTION 'Assigned to user must be from the same law firm as invoice';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_invoice_assignments_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION validate_invoice_assignments();

-- Trigger to automatically mark invoices as overdue when due date passes
CREATE OR REPLACE FUNCTION update_invoice_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if due date has passed and status is still pending
    IF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
        NEW.status = 'overdue';
    END IF;
    
    -- If paid_date is set, update status to paid
    IF NEW.paid_date IS NOT NULL AND NEW.status != 'paid' THEN
        NEW.status = 'paid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_overdue_status_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_invoice_overdue_status();

-- Trigger to update member_count in law_firms
CREATE OR REPLACE FUNCTION update_law_firm_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.role IN ('admin', 'associate') THEN
        UPDATE law_firms 
        SET member_count = member_count + 1
        WHERE id = NEW.law_firm_id;
    ELSIF TG_OP = 'DELETE' AND OLD.role IN ('admin', 'associate') THEN
        UPDATE law_firms 
        SET member_count = member_count - 1
        WHERE id = OLD.law_firm_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle role changes or law_firm changes
        IF OLD.role IN ('admin', 'associate') AND NEW.role NOT IN ('admin', 'associate') THEN
            -- User changed from member role to client
            UPDATE law_firms 
            SET member_count = member_count - 1
            WHERE id = OLD.law_firm_id;
        ELSIF OLD.role NOT IN ('admin', 'associate') AND NEW.role IN ('admin', 'associate') THEN
            -- User changed to member role from client
            UPDATE law_firms 
            SET member_count = member_count + 1
            WHERE id = NEW.law_firm_id;
        ELSIF OLD.law_firm_id != NEW.law_firm_id AND OLD.role IN ('admin', 'associate') AND NEW.role IN ('admin', 'associate') THEN
            -- User transferred between law firms while staying in member role
            UPDATE law_firms SET member_count = member_count - 1 WHERE id = OLD.law_firm_id;
            UPDATE law_firms SET member_count = member_count + 1 WHERE id = NEW.law_firm_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION update_law_firm_member_count();

-- Trigger to update case_count in law_firms
CREATE OR REPLACE FUNCTION update_law_firm_case_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE law_firms 
        SET case_count = case_count + 1
        WHERE id = NEW.law_firm_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE law_firms 
        SET case_count = case_count - 1
        WHERE id = OLD.law_firm_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.law_firm_id != NEW.law_firm_id THEN
        -- Case transferred between law firms
        UPDATE law_firms SET case_count = case_count - 1 WHERE id = OLD.law_firm_id;
        UPDATE law_firms SET case_count = case_count + 1 WHERE id = NEW.law_firm_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_case_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH ROW EXECUTE FUNCTION update_law_firm_case_count();

-- Trigger to update storage_used_mb in law_firms
CREATE OR REPLACE FUNCTION update_law_firm_storage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE law_firms 
        SET storage_used_mb = storage_used_mb + (NEW.file_size / 1048576)
        WHERE id = NEW.law_firm_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE law_firms 
        SET storage_used_mb = storage_used_mb - (OLD.file_size / 1048576)
        WHERE id = OLD.law_firm_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.law_firm_id != NEW.law_firm_id THEN
            -- Document transferred between law firms
            UPDATE law_firms SET storage_used_mb = storage_used_mb - (OLD.file_size / 1048576) 
            WHERE id = OLD.law_firm_id;
            UPDATE law_firms SET storage_used_mb = storage_used_mb + (NEW.file_size / 1048576) 
            WHERE id = NEW.law_firm_id;
        ELSIF OLD.file_size != NEW.file_size THEN
            -- File size changed
            UPDATE law_firms 
            SET storage_used_mb = storage_used_mb + ((NEW.file_size - OLD.file_size) / 1048576)
            WHERE id = NEW.law_firm_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_storage_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION update_law_firm_storage();

-- Trigger to update last_active_at in law_firms
CREATE OR REPLACE FUNCTION update_law_firm_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE law_firms 
    SET last_active_at = CURRENT_TIMESTAMP
    WHERE id = NEW.law_firm_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users activity
CREATE TRIGGER users_last_active_trigger
AFTER UPDATE OF last_login_at ON users
FOR EACH ROW 
WHEN (NEW.role IN ('admin', 'associate'))
EXECUTE FUNCTION update_law_firm_last_active();

-- Trigger for cases activity
CREATE TRIGGER cases_last_active_trigger
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION update_law_firm_last_active();

-- Trigger for documents activity
CREATE TRIGGER documents_last_active_trigger
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_law_firm_last_active();

-- Trigger for notes activity
CREATE TRIGGER notes_last_active_trigger
AFTER INSERT OR UPDATE ON notes
FOR EACH ROW 
EXECUTE FUNCTION update_law_firm_last_active();

-- Create indexes for performance

-- Users indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_law_firm ON users(law_firm_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_email ON users(email);

-- Clients indexes
CREATE INDEX idx_clients_user_account ON clients(user_account_id) WHERE user_account_id IS NOT NULL;
CREATE INDEX idx_clients_assigned_associate ON clients(assigned_associate_id);
CREATE INDEX idx_clients_law_firm ON clients(law_firm_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(client_type);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_joined_date ON clients(joined_date);

-- Cases indexes
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_law_firm ON cases(law_firm_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to_user_id);
CREATE INDEX idx_cases_added_by ON cases(added_by_user_id);
CREATE INDEX idx_cases_date_opened ON cases(date_opened);
CREATE INDEX idx_cases_deadline ON cases(deadline);
CREATE INDEX idx_cases_file_number ON cases(file_number);
CREATE INDEX idx_cases_case_number ON cases(case_number);

-- Documents indexes
CREATE INDEX idx_documents_law_firm ON documents(law_firm_id);
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by_user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX idx_documents_reviewer ON documents(reviewer_user_id);

-- Notes indexes
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_case ON notes(case_id);
CREATE INDEX idx_notes_pinned ON notes(is_pinned);
CREATE INDEX idx_notes_archived ON notes(is_archived);
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_created_at ON notes(created_at);

-- Invoices indexes
CREATE INDEX idx_invoices_law_firm ON invoices(law_firm_id);
CREATE INDEX idx_invoices_case ON invoices(case_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_created_by ON invoices(created_by_user_id);
CREATE INDEX idx_invoices_assigned_to ON invoices(assigned_to_user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_paid_date ON invoices(paid_date);

-- Composite indexes for common queries
CREATE INDEX idx_cases_firm_status ON cases(law_firm_id, status);
CREATE INDEX idx_clients_firm_status ON clients(law_firm_id, status);
CREATE INDEX idx_documents_case_status ON documents(case_id, status);
CREATE INDEX idx_invoices_firm_status_date ON invoices(law_firm_id, status, due_date);
CREATE INDEX idx_users_firm_role ON users(law_firm_id, role, is_active);