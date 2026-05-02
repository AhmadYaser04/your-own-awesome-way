-- ============================================================
-- AUT Equivalency System - Local PostgreSQL schema
-- ============================================================
-- Usage:
--   psql -U postgres -d aut_equivalency -f db/init.sql
--
-- This script drops any old conflicting tables and rebuilds the
-- clean schema. It will erase any existing test requests. Run it
-- once on first setup or whenever you want to start from scratch.
--
-- All comments are in English to avoid encoding issues on Windows
-- editors that sometimes save files as Windows-1252 instead of
-- UTF-8. The only non-ASCII text lives inside SQL string literals
-- which Postgres handles safely.
-- ============================================================

-- 1) extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) drop old conflicting tables (CASCADE removes dangling FKs)
DROP TABLE IF EXISTS public.equivalency_matches       CASCADE;
DROP TABLE IF EXISTS public.equivalency_request_items CASCADE;
DROP TABLE IF EXISTS public.equivalency_requests      CASCADE;
DROP TABLE IF EXISTS public.profiles                  CASCADE;
DROP TABLE IF EXISTS public.users                     CASCADE;

-- NOTE: aut_courses is NOT dropped (it holds the AUT course catalog).
-- If it does not exist yet, create it:
CREATE TABLE IF NOT EXISTS public.aut_courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code     TEXT NOT NULL UNIQUE,
  course_name_ar  TEXT NOT NULL,
  course_name_en  TEXT,
  credits         INTEGER NOT NULL DEFAULT 3,
  category        TEXT NOT NULL,
  description_ar  TEXT,
  description_en  TEXT,
  prerequisites   TEXT[] DEFAULT '{}',
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3) users (local auth - bcrypt hashed passwords)
-- ============================================================
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_username ON public.users(username);

-- ============================================================
-- 4) profiles (extra student information)
-- ============================================================
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  email            TEXT,
  saudi_university TEXT,  -- previous university / college (legacy column name)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5) equivalency_requests (student equivalency requests)
-- ============================================================
CREATE TABLE public.equivalency_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- official student info
  student_full_name        TEXT,
  student_id               TEXT,
  student_college          TEXT,
  student_major            TEXT,

  -- previous source institution
  previous_diploma_source  TEXT,
  previous_university      TEXT,
  previous_major_name      TEXT,
  saudi_course_name        TEXT,         -- legacy: single-course name
  saudi_course_description TEXT,

  -- transfer info
  transfer_type            TEXT,
  transfer_semester        TEXT,
  academic_year            TEXT,
  semester                 TEXT,
  cumulative_gpa           NUMERIC,
  diploma_gpa              NUMERIC,

  -- student type and credit caps
  student_type             TEXT NOT NULL DEFAULT 'different_major',
  credits_cap              INTEGER NOT NULL DEFAULT 132,

  -- transcript file
  uploaded_file_url        TEXT,
  extraction_status        TEXT NOT NULL DEFAULT 'pending',
  extraction_raw_text      TEXT,
  input_mode               TEXT NOT NULL DEFAULT 'text',

  -- preliminary AI result (JSON)
  ai_result                JSONB NOT NULL DEFAULT '{}'::jsonb,
  matched_aut_code         TEXT,
  matched_aut_name         TEXT,
  similarity               NUMERIC,
  verdict                  TEXT,

  -- review workflow
  status                   TEXT NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  admin_notes              TEXT,
  reviewer_name            TEXT,
  reviewed_by              UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at              TIMESTAMPTZ,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_requests_user    ON public.equivalency_requests(user_id);
CREATE INDEX idx_requests_status  ON public.equivalency_requests(status);
CREATE INDEX idx_requests_created ON public.equivalency_requests(created_at DESC);

-- ============================================================
-- 6) equivalency_request_items (student courses from transcript)
-- ============================================================
CREATE TABLE public.equivalency_request_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID NOT NULL REFERENCES public.equivalency_requests(id) ON DELETE CASCADE,
  source_course_name  TEXT NOT NULL,
  source_course_code  TEXT,
  source_credits      NUMERIC NOT NULL DEFAULT 3,
  source_grade        TEXT,
  source_grade_letter TEXT,
  source_semester     TEXT,
  display_order       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_request ON public.equivalency_request_items(request_id);

-- ============================================================
-- 7) equivalency_matches (final equivalencies set by the admin)
-- ============================================================
CREATE TABLE public.equivalency_matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id           UUID NOT NULL REFERENCES public.equivalency_requests(id) ON DELETE CASCADE,
  aut_course_id        UUID REFERENCES public.aut_courses(id) ON DELETE SET NULL,
  source_item_ids      UUID[] NOT NULL DEFAULT '{}',
  total_source_credits NUMERIC NOT NULL DEFAULT 0,
  aut_credits          INTEGER NOT NULL DEFAULT 0,
  similarity           NUMERIC,
  verdict              TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  is_manual            BOOLEAN NOT NULL DEFAULT false,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_matches_request ON public.equivalency_matches(request_id);
CREATE INDEX idx_matches_aut     ON public.equivalency_matches(aut_course_id);

-- ============================================================
-- 8) trigger to keep updated_at in sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','profiles','equivalency_requests',
                               'equivalency_matches','aut_courses'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();', t, t);
  END LOOP;
END $$;

-- ============================================================
-- 9) Seed: default admin account
--    Password: admin123 (bcrypt hash, 10 rounds)
-- ============================================================
INSERT INTO public.users (username, password_hash, full_name, role)
VALUES (
  'admin',
  '$2b$10$dViCoTGDNKZs4FERhQ1zzulB0GOF4BpxBaQ158nuHU0TEEvCTWPOG',
  'System Administrator',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Done. Next step: seed the AUT courses catalog by running:
--   node db/seed-aut-courses.cjs
-- ============================================================
SELECT 'Database initialized successfully. Next: node db/seed-aut-courses.cjs' AS result;
