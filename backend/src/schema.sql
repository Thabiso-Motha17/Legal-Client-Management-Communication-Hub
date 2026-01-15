-- Create the database and tables from your provided schema
-- You'll need to run this in your PostgreSQL database first
-- Or use a migration tool

-- First, create law_firms table since users will reference it
CREATE TABLE law_firms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
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

-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    
    -- Role and association
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'associate', 'client', 'system-admin')),
    law_firm_id INTEGER REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- User status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT admin_associate_must_have_law_firm 
        CHECK ((role IN ('admin', 'associate') AND law_firm_id IS NOT NULL) 
               OR role NOT IN ('admin', 'associate')),
    CONSTRAINT client_cannot_have_law_firm 
        CHECK (role != 'client' OR law_firm_id IS NULL)
);

-- CASES TABLE
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    file_number VARCHAR(50) UNIQUE NOT NULL,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' 
        CHECK (status IN ('Active', 'On Hold', 'Closed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Relationships
    law_firm_id INTEGER NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
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

-- CLIENTS TABLE
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(255),
    client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('individual', 'business')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Relationships
    assigned_associate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Dates
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Constraints for business clients
    CONSTRAINT business_company_required 
        CHECK (client_type != 'business' OR (client_type = 'business' AND company IS NOT NULL))
);

-- DOCUMENTS TABLE
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    
    -- Relationships
    law_firm_id INTEGER NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Document metadata
    document_type VARCHAR(50) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' 
        CHECK (status IN ('Draft', 'Under Review', 'Approved', 'Rejected', 'Reference')),
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTES TABLE
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Relationships
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    
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

-- Add indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_law_firm ON users(law_firm_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_case_status ON cases(status);
CREATE INDEX idx_case_priority ON cases(priority);
CREATE INDEX idx_case_law_firm ON cases(law_firm_id);
CREATE INDEX idx_assigned_to ON cases(assigned_to_user_id);
CREATE INDEX idx_date_opened ON cases(date_opened);
CREATE INDEX idx_deadline ON cases(deadline);

CREATE INDEX idx_clients_assigned_associate ON clients(assigned_associate_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(client_type);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_joined_date ON clients(joined_date);

CREATE INDEX idx_documents_law_firm ON documents(law_firm_id);
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by_user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);

CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_case ON notes(case_id);
CREATE INDEX idx_notes_pinned ON notes(is_pinned);
CREATE INDEX idx_notes_archived ON notes(is_archived);
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_created_at ON notes(created_at);

-- Create a trigger to update member_count in law_firms when users are added/removed
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
            -- User changed from admin/associate to another role
            UPDATE law_firms 
            SET member_count = member_count - 1
            WHERE id = OLD.law_firm_id;
        ELSIF OLD.role NOT IN ('admin', 'associate') AND NEW.role IN ('admin', 'associate') THEN
            -- User changed to admin/associate from another role
            UPDATE law_firms 
            SET member_count = member_count + 1
            WHERE id = NEW.law_firm_id;
        ELSIF OLD.law_firm_id != NEW.law_firm_id AND OLD.role IN ('admin', 'associate') AND NEW.role IN ('admin', 'associate') THEN
            -- User changed law firms while staying admin/associate
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

-- Create a trigger to update case_count in law_firms
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

-- Create a trigger to update last_active_at in law_firms
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

-- Insert sample data (optional)
INSERT INTO law_firms (name, email, phone, city, country) 
VALUES ('Legal Eagles LLP', 'contact@legaleagles.com', '+1234567890', 'New York', 'USA');

INSERT INTO users (username, email, password_hash, full_name, role, law_firm_id) 
VALUES 
('admin1', 'admin@legaleagles.com', '$2a$10$YourHashedPasswordHere', 'John Doe', 'admin', 1),
('associate1', 'lawyer@legaleagles.com', '$2a$10$YourHashedPasswordHere', 'Jane Smith', 'associate', 1);