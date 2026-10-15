-- ====================================================================
-- Haven Startup - Supabase PostgreSQL Schema ($0 Free Tier)
-- ====================================================================

-- 1. Businesses / GBP Listings
CREATE TABLE IF NOT EXISTS haven_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    target_location TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    escalation_phone TEXT,
    website_url TEXT,
    approved_master_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Customer Reviews & Reputation Tracking
CREATE TABLE IF NOT EXISTS haven_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES haven_businesses(id) ON DELETE CASCADE,
    google_review_id TEXT UNIQUE,
    reviewer_name TEXT NOT NULL,
    star_rating INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    sentiment_category TEXT NOT NULL CHECK (sentiment_category IN ('POSITIVE', 'NEUTRAL', 'COMPLAINT', 'SPAM')),
    generated_reply TEXT NOT NULL,
    seo_keyword_injected TEXT,
    safe_to_auto_publish BOOLEAN NOT NULL DEFAULT false,
    owner_alert_summary TEXT,
    published_to_gbp BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Weekly GBP Freshness Posts
CREATE TABLE IF NOT EXISTS haven_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES haven_businesses(id) ON DELETE CASCADE,
    neighborhood_or_landmark TEXT NOT NULL,
    service_vector TEXT NOT NULL,
    post_content TEXT NOT NULL,
    word_count INT NOT NULL,
    call_to_action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. GEO & AI Search Q&A Seeding
CREATE TABLE IF NOT EXISTS haven_qna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES haven_businesses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    factual_entity_answer TEXT NOT NULL,
    target_engine TEXT NOT NULL DEFAULT 'UNIVERSAL_GEO',
    is_seeded_to_gbp BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Profile Drift & Competitor Map Audits
CREATE TABLE IF NOT EXISTS haven_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES haven_businesses(id) ON DELETE CASCADE,
    has_critical_drift BOOLEAN NOT NULL DEFAULT false,
    drift_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    competitor_snapshots JSONB NOT NULL DEFAULT '[]'::jsonb,
    audit_report_text TEXT NOT NULL,
    owner_alert_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for ultra-fast query execution on free tier
CREATE INDEX IF NOT EXISTS idx_haven_reviews_business_id ON haven_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_haven_posts_business_id ON haven_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_haven_audits_business_id ON haven_audits(business_id);
