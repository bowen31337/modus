-- ============================================================================
-- m - Community Moderation System
-- Initial Database Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- TYPES
-- ============================================================================

CREATE TYPE post_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE priority_level AS ENUM ('P1', 'P2', 'P3', 'P4', 'P5');
CREATE TYPE agent_status AS ENUM ('online', 'offline', 'busy');
CREATE TYPE agent_role AS ENUM ('agent', 'supervisor', 'admin', 'moderator');
CREATE TYPE sentiment_label AS ENUM ('negative', 'neutral', 'positive');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    color CHAR(7) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50),
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table (linked to Supabase Auth users)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role agent_role NOT NULL DEFAULT 'agent',
    status agent_status NOT NULL DEFAULT 'offline',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Moderation posts table
CREATE TABLE moderation_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    body_content TEXT NOT NULL,
    excerpt VARCHAR(300),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status post_status NOT NULL DEFAULT 'open',
    priority priority_level NOT NULL DEFAULT 'P3',
    sentiment_score NUMERIC(3, 2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label sentiment_label,
    author_user_id UUID NOT NULL,
    author_post_count INTEGER NOT NULL DEFAULT 0,
    assigned_to_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    embedding vector(1536)
);

-- Responses table
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES moderation_posts(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Response templates table
CREATE TABLE response_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    placeholders JSONB DEFAULT '[]'::jsonb,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Priority rules table
CREATE TABLE priority_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    condition_type VARCHAR(50) NOT NULL,
    condition_value TEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_value TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    post_id UUID REFERENCES moderation_posts(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Posts indexes
CREATE INDEX idx_posts_status ON moderation_posts(status);
CREATE INDEX idx_posts_priority ON moderation_posts(priority);
CREATE INDEX idx_posts_category ON moderation_posts(category_id);
CREATE INDEX idx_posts_assigned_to ON moderation_posts(assigned_to_id);
CREATE INDEX idx_posts_created_at ON moderation_posts(created_at DESC);
CREATE INDEX idx_posts_author ON moderation_posts(author_user_id);

-- Full-text search index
CREATE INDEX idx_posts_search ON moderation_posts
    USING GIN (to_tsvector('english', title || ' ' || body_content));

-- Vector similarity index
CREATE INDEX idx_posts_embedding ON moderation_posts
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Responses indexes
CREATE INDEX idx_responses_post ON responses(post_id);
CREATE INDEX idx_responses_agent ON responses(agent_id);
CREATE INDEX idx_responses_created_at ON responses(created_at DESC);

-- Agents indexes
CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_role ON agents(role);

-- Audit log indexes
CREATE INDEX idx_audit_agent ON audit_log(agent_id);
CREATE INDEX idx_audit_post ON audit_log(post_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_action_type ON audit_log(action_type);

-- Categories index
CREATE INDEX idx_categories_position ON categories(position);

-- Rules index
CREATE INDEX idx_rules_position ON priority_rules(position);
CREATE INDEX idx_rules_active ON priority_rules(is_active);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate excerpt function
CREATE OR REPLACE FUNCTION generate_excerpt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
        NEW.excerpt = LEFT(NEW.body_content, 297);
        IF LENGTH(NEW.body_content) > 297 THEN
            NEW.excerpt = NEW.excerpt || '...';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit log function
CREATE OR REPLACE FUNCTION log_post_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_agent_id UUID;
BEGIN
    -- Get the current user's agent ID (from session context)
    v_agent_id := current_setting('app.current_agent_id', true)::UUID;

    IF v_agent_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (agent_id, post_id, action_type, previous_state, new_state)
        VALUES (
            v_agent_id,
            NEW.id,
            'post_updated',
            jsonb_build_object(
                'status', OLD.status,
                'priority', OLD.priority,
                'assigned_to_id', OLD.assigned_to_id
            ),
            jsonb_build_object(
                'status', NEW.status,
                'priority', NEW.priority,
                'assigned_to_id', NEW.assigned_to_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON moderation_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_responses_updated_at
    BEFORE UPDATE ON responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON response_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_rules_updated_at
    BEFORE UPDATE ON priority_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Excerpt generation trigger
CREATE TRIGGER trigger_posts_excerpt
    BEFORE INSERT OR UPDATE OF body_content ON moderation_posts
    FOR EACH ROW
    EXECUTE FUNCTION generate_excerpt();

-- Audit log trigger
CREATE TRIGGER trigger_posts_audit
    AFTER UPDATE ON moderation_posts
    FOR EACH ROW
    EXECUTE FUNCTION log_post_changes();
