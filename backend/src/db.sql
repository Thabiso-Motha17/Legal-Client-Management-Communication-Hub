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
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_law_firms_name (name),
    INDEX idx_law_firms_status (subscription_status),
    INDEX idx_law_firms_plan (subscription_plan),
    INDEX idx_law_firms_joined (joined_date)
);

-- USERS TABLE - Updated with law_firm_id
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
        CHECK (role != 'client' OR law_firm_id IS NULL),
    
    -- Indexes
    INDEX idx_users_role (role),
    INDEX idx_users_law_firm (law_firm_id),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_created_at (created_at)
);

-- CASES TABLE - Updated with law_firm_id
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
    
    -- Constraints
    CONSTRAINT assigned_user_must_be_associate_or_admin 
        CHECK (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = assigned_to_user_id 
            AND u.role IN ('associate', 'admin')
        )),
    
    -- Indexes for performance
    INDEX idx_case_status (status),
    INDEX idx_case_priority (priority),
    INDEX idx_case_law_firm (law_firm_id),
    INDEX idx_assigned_to (assigned_to_user_id),
    INDEX idx_date_opened (date_opened),
    INDEX idx_deadline (deadline)
);

-- CLIENTS TABLE - Updated with law_firm_id
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
        CHECK (client_type != 'business' OR (client_type = 'business' AND company IS NOT NULL)),
    
    -- Check that assigned user is an associate
    CONSTRAINT assigned_user_must_be_associate
        CHECK (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = assigned_associate_id 
            AND u.role IN ('associate')
        )),
    
    -- Indexes
    INDEX idx_clients_assigned_associate (assigned_associate_id),
    INDEX idx_clients_status (status),
    INDEX idx_clients_type (client_type),
    INDEX idx_clients_email (email),
    INDEX idx_clients_joined_date (joined_date)
);

-- DOCUMENTS TABLE - Updated with law_firm_id
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_documents_law_firm (law_firm_id),
    INDEX idx_documents_case (case_id),
    INDEX idx_documents_uploaded_by (uploaded_by_user_id),
    INDEX idx_documents_status (status),
    INDEX idx_documents_type (document_type),
    INDEX idx_documents_uploaded_at (uploaded_at)
);

-- NOTES TABLE - Updated with law_firm_id
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
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_notes_user (user_id),
    INDEX idx_notes_case (case_id),
    INDEX idx_notes_pinned (is_pinned),
    INDEX idx_notes_archived (is_archived),
    INDEX idx_notes_category (category),
    INDEX idx_notes_created_at (created_at)
);

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