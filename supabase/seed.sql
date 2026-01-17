-- ============================================================================
-- m - Community Moderation System
-- Seed Data
-- ============================================================================

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO categories (name, slug, description, color, icon, position, is_active) VALUES
    ('General', 'general', 'General community discussions and questions', '#6366f1', 'MessageCircle', 0, true),
    ('Technical Support', 'technical-support', 'Technical issues and troubleshooting', '#f97316', 'Wrench', 1, true),
    ('Feature Requests', 'feature-requests', 'Suggestions for new features', '#8b5cf6', 'Lightbulb', 2, true),
    ('Bug Reports', 'bug-reports', 'Report bugs and issues', '#ef4444', 'Bug', 3, true),
    ('Account Issues', 'account-issues', 'Login, billing, and account-related issues', '#eab308', 'User', 4, true),
    ('Feedback', 'feedback', 'General feedback and reviews', '#22c55e', 'ThumbsUp', 5, true),
    ('Announcements', 'announcements', 'Official announcements and updates', '#3b82f6', 'Megaphone', 6, true);

-- ============================================================================
-- PRIORITY RULES
-- ============================================================================

INSERT INTO priority_rules (name, description, condition_type, condition_value, action_type, action_value, position, is_active) VALUES
    (
        'First-Time Poster Welcome',
        'Automatically prioritize posts from first-time users to ensure a good first impression',
        'first_time_poster',
        '2',
        'set_priority',
        'P2',
        0,
        true
    ),
    (
        'Negative Sentiment Escalation',
        'Escalate posts with negative sentiment to ensure quick response to frustrated users',
        'sentiment_negative',
        '-0.3',
        'set_priority',
        'P2',
        1,
        true
    ),
    (
        'SLA Breach - 2 Hours',
        'Escalate posts that have been open for more than 2 hours without a response',
        'sla_exceeded',
        '2',
        'escalate',
        '',
        2,
        true
    ),
    (
        'SLA Critical - 4 Hours',
        'Mark as critical any post open for more than 4 hours',
        'sla_exceeded',
        '4',
        'set_priority',
        'P1',
        3,
        true
    ),
    (
        'Bug Report Priority',
        'Automatically set bug reports to high priority',
        'category_match',
        (SELECT id::text FROM categories WHERE slug = 'bug-reports'),
        'set_priority',
        'P2',
        4,
        true
    ),
    (
        'Urgent Keyword Detection',
        'Escalate posts containing urgent keywords',
        'keyword_match',
        'urgent,emergency,critical,broken,not working,down',
        'escalate',
        '',
        5,
        true
    );

-- ============================================================================
-- RESPONSE TEMPLATES (will need agent_id, so we'll create a placeholder)
-- Note: These will be populated after first agent is created
-- ============================================================================

-- Placeholder comment for templates
-- Templates will be seeded via application after first admin user signs up

-- ============================================================================
-- SAMPLE POSTS (for development/testing)
-- Uncomment for local development
-- ============================================================================

/*
-- These require an existing author_user_id, so they would be created via the application
-- or with a test user ID

INSERT INTO moderation_posts (title, body_content, category_id, status, priority, sentiment_score, sentiment_label, author_user_id, author_post_count) VALUES
    (
        'Unable to login to my account',
        'I have been trying to login for the past hour but keep getting an error message saying "Invalid credentials". I am sure my password is correct. Please help!',
        (SELECT id FROM categories WHERE slug = 'account-issues'),
        'open',
        'P2',
        -0.6,
        'negative',
        '00000000-0000-0000-0000-000000000001',
        0
    ),
    (
        'Feature suggestion: Dark mode',
        'It would be great if the application had a dark mode option. I often work late at night and the bright interface strains my eyes.',
        (SELECT id FROM categories WHERE slug = 'feature-requests'),
        'open',
        'P4',
        0.4,
        'positive',
        '00000000-0000-0000-0000-000000000002',
        5
    ),
    (
        'App crashes when uploading large files',
        'Every time I try to upload a file larger than 10MB, the application crashes completely. This is very frustrating as I need to upload large documents regularly.',
        (SELECT id FROM categories WHERE slug = 'bug-reports'),
        'open',
        'P1',
        -0.8,
        'negative',
        '00000000-0000-0000-0000-000000000003',
        1
    );
*/
