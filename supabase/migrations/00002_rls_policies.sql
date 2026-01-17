-- ============================================================================
-- m - Community Moderation System
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's agent record
CREATE OR REPLACE FUNCTION get_current_agent()
RETURNS agents AS $$
DECLARE
    agent_record agents;
BEGIN
    SELECT * INTO agent_record
    FROM agents
    WHERE user_id = auth.uid();
    RETURN agent_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has specific role
CREATE OR REPLACE FUNCTION has_role(required_role agent_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role agent_role;
BEGIN
    SELECT role INTO user_role
    FROM agents
    WHERE user_id = auth.uid();

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Role hierarchy: admin > supervisor > moderator > agent
    CASE required_role
        WHEN 'agent' THEN
            RETURN user_role IN ('agent', 'moderator', 'supervisor', 'admin');
        WHEN 'moderator' THEN
            RETURN user_role IN ('moderator', 'supervisor', 'admin');
        WHEN 'supervisor' THEN
            RETURN user_role IN ('supervisor', 'admin');
        WHEN 'admin' THEN
            RETURN user_role = 'admin';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is supervisor or admin
CREATE OR REPLACE FUNCTION is_supervisor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role('supervisor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

-- Anyone authenticated can view active categories
CREATE POLICY "categories_select"
    ON categories FOR SELECT
    TO authenticated
    USING (is_active = true OR is_admin());

-- Only admins can insert categories
CREATE POLICY "categories_insert"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Only admins can update categories
CREATE POLICY "categories_update"
    ON categories FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Only admins can delete categories
CREATE POLICY "categories_delete"
    ON categories FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- AGENTS POLICIES
-- ============================================================================

-- Agents can view all other agents (for presence, assignment)
CREATE POLICY "agents_select"
    ON agents FOR SELECT
    TO authenticated
    USING (true);

-- Users can insert their own agent profile
CREATE POLICY "agents_insert"
    ON agents FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Agents can update their own profile, admins can update any
CREATE POLICY "agents_update"
    ON agents FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (
        -- Regular users can only update certain fields of their own profile
        (user_id = auth.uid() AND role = (SELECT role FROM agents WHERE user_id = auth.uid()))
        OR is_admin()
    );

-- Only admins can delete agents
CREATE POLICY "agents_delete"
    ON agents FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- MODERATION POSTS POLICIES
-- ============================================================================

-- All authenticated users with agent role can view posts
CREATE POLICY "posts_select"
    ON moderation_posts FOR SELECT
    TO authenticated
    USING (has_role('agent'));

-- Agents can insert posts (for testing/seeding)
CREATE POLICY "posts_insert"
    ON moderation_posts FOR INSERT
    TO authenticated
    WITH CHECK (has_role('agent'));

-- Agents can update posts (assign to self, change status)
-- Supervisors can update any post
CREATE POLICY "posts_update"
    ON moderation_posts FOR UPDATE
    TO authenticated
    USING (has_role('agent'))
    WITH CHECK (
        -- Agents can assign to themselves or release
        (
            assigned_to_id IS NULL
            OR assigned_to_id = (SELECT id FROM agents WHERE user_id = auth.uid())
            OR is_supervisor_or_admin()
        )
    );

-- Only admins can delete posts
CREATE POLICY "posts_delete"
    ON moderation_posts FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- RESPONSES POLICIES
-- ============================================================================

-- Agents can view all responses (public)
-- Internal notes visible only to agents/supervisors
CREATE POLICY "responses_select"
    ON responses FOR SELECT
    TO authenticated
    USING (
        has_role('agent')
        AND (
            is_internal_note = false
            OR is_internal_note = true -- All agents can see internal notes
        )
    );

-- Agents can create responses
CREATE POLICY "responses_insert"
    ON responses FOR INSERT
    TO authenticated
    WITH CHECK (
        has_role('agent')
        AND agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
    );

-- Agents can update their own responses
CREATE POLICY "responses_update"
    ON responses FOR UPDATE
    TO authenticated
    USING (
        agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_supervisor_or_admin()
    )
    WITH CHECK (
        agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_supervisor_or_admin()
    );

-- Agents can delete their own responses, supervisors can delete any
CREATE POLICY "responses_delete"
    ON responses FOR DELETE
    TO authenticated
    USING (
        agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_supervisor_or_admin()
    );

-- ============================================================================
-- RESPONSE TEMPLATES POLICIES
-- ============================================================================

-- All agents can view templates
CREATE POLICY "templates_select"
    ON response_templates FOR SELECT
    TO authenticated
    USING (has_role('agent'));

-- Agents can create templates
CREATE POLICY "templates_insert"
    ON response_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        has_role('agent')
        AND created_by = (SELECT id FROM agents WHERE user_id = auth.uid())
    );

-- Creators can update their templates, admins can update any
CREATE POLICY "templates_update"
    ON response_templates FOR UPDATE
    TO authenticated
    USING (
        created_by = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_admin()
    )
    WITH CHECK (
        created_by = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_admin()
    );

-- Creators can delete their templates, admins can delete any
CREATE POLICY "templates_delete"
    ON response_templates FOR DELETE
    TO authenticated
    USING (
        created_by = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_admin()
    );

-- ============================================================================
-- PRIORITY RULES POLICIES
-- ============================================================================

-- All agents can view active rules
CREATE POLICY "rules_select"
    ON priority_rules FOR SELECT
    TO authenticated
    USING (has_role('agent'));

-- Only admins can create rules
CREATE POLICY "rules_insert"
    ON priority_rules FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Only admins can update rules
CREATE POLICY "rules_update"
    ON priority_rules FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Only admins can delete rules
CREATE POLICY "rules_delete"
    ON priority_rules FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Supervisors and admins can view all audit logs
-- Agents can view their own actions
CREATE POLICY "audit_select"
    ON audit_log FOR SELECT
    TO authenticated
    USING (
        agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
        OR is_supervisor_or_admin()
    );

-- System inserts audit logs (via triggers), agents insert via functions
CREATE POLICY "audit_insert"
    ON audit_log FOR INSERT
    TO authenticated
    WITH CHECK (has_role('agent'));

-- Audit logs are immutable - no updates
-- No update policy

-- Only admins can delete audit logs (for data retention)
CREATE POLICY "audit_delete"
    ON audit_log FOR DELETE
    TO authenticated
    USING (is_admin());
