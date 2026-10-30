-- =============================================================================
-- Database Schema for EdTech CRM & Inquiry Management System
-- Compatible with Supabase PostgreSQL (and standard PostgreSQL 13+)
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: admins
-- Stores authorized administrators who can manage inquiries.
-- Passwords must ALWAYS be hashed using bcrypt before insertion.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin email lookups during login
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (LOWER(email));

-- -----------------------------------------------------------------------------
-- Table: inquiries
-- Stores prospective customer inquiries submitted through the public portal.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('Parent', 'Student', 'School')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Scholarship', 'Concert', 'Admission', 'General Query')),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Performance Indexes for search, filtering, and sorting
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_name ON inquiries (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries (phone);

-- Composite index for frequent combined query patterns
CREATE INDEX IF NOT EXISTS idx_inquiries_filter_composite ON inquiries (status, category, user_type);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS) Configuration
-- -----------------------------------------------------------------------------
-- Enables RLS to secure tables against direct access via Supabase's PostgREST API.
-- Because no public policies are added, anonymous/client-side access is completely blocked.
-- Your Node.js backend connects as the table owner ('postgres') and automatically
-- bypasses RLS, retaining full access to perform all queries without complex policies.
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Trigger Function: Automatically update updated_at timestamp on row modification
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditionally create the trigger without using DROP statements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_inquiries_updated_at'
    ) THEN
        CREATE TRIGGER set_inquiries_updated_at
        BEFORE UPDATE ON inquiries
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
