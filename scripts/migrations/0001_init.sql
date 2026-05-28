-- 0001_init.sql — base schema for UNFILTERED.
-- Idempotent: all CREATE statements use IF NOT EXISTS.
-- All tables namespaced with `uf_` so they live alongside Payload's tables
-- during the migration window; Payload's tables get dropped at the end.

-- ─── Auth ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uf_users (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uf_sessions (
  id              TEXT PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES uf_users(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uf_sessions_user_id_idx ON uf_sessions(user_id);
CREATE INDEX IF NOT EXISTS uf_sessions_expires_at_idx ON uf_sessions(expires_at);

-- ─── Content ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uf_colleges (
  id                    SERIAL PRIMARY KEY,
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  short_name            TEXT NOT NULL,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  founded               INTEGER NOT NULL,
  category              TEXT NOT NULL
    CHECK (category IN ('engineering', 'private-deemed', 'arts', 'business', 'regional')),
  tier                  TEXT NOT NULL
    CHECK (tier IN ('tier-1', 'tier-2', 'tier-3')),
  case_file_number      TEXT NOT NULL,
  primary_accent        TEXT NOT NULL,
  fingerprint_seed      TEXT NOT NULL,
  truth_score           INTEGER NOT NULL CHECK (truth_score BETWEEN 0 AND 100),
  review_count          INTEGER NOT NULL DEFAULT 0,
  verified_count        INTEGER NOT NULL DEFAULT 0,
  tagline               TEXT NOT NULL,
  brochure_blurb        TEXT NOT NULL,
  long_read_deck        TEXT NOT NULL DEFAULT '',
  long_read_paragraphs  TEXT[] NOT NULL DEFAULT '{}',
  long_read_pull_quote  TEXT NOT NULL DEFAULT '',
  long_read_byline      TEXT NOT NULL DEFAULT '',
  fee_claimed           INTEGER NOT NULL DEFAULT 0,
  fee_actual            INTEGER NOT NULL DEFAULT 0,
  fee_note              TEXT NOT NULL DEFAULT '',
  placement_data        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uf_brochure_claims (
  id              SERIAL PRIMARY KEY,
  college_id      INTEGER NOT NULL REFERENCES uf_colleges(id) ON DELETE CASCADE,
  claim           TEXT NOT NULL,
  truth           TEXT NOT NULL,
  category        TEXT NOT NULL
    CHECK (category IN ('placements', 'infrastructure', 'faculty', 'campus-life', 'fees')),
  delta           INTEGER NOT NULL CHECK (delta BETWEEN 0 AND 100),
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uf_brochure_claims_college_idx ON uf_brochure_claims(college_id);

CREATE TABLE IF NOT EXISTS uf_reviews (
  id                    SERIAL PRIMARY KEY,
  ext_id                TEXT UNIQUE,
  college_slug          TEXT NOT NULL,
  author_pseudonym      TEXT NOT NULL,
  author_year           INTEGER NOT NULL CHECK (author_year BETWEEN 1 AND 5),
  author_branch         TEXT NOT NULL,
  rating                INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  truth_score           INTEGER NOT NULL CHECK (truth_score BETWEEN 0 AND 100),
  title                 TEXT NOT NULL,
  body                  TEXT NOT NULL,
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  vibe                  TEXT NOT NULL
    CHECK (vibe IN ('rage', 'warm', 'deadpan', 'warning', 'redeemed')),
  has_video             BOOLEAN NOT NULL DEFAULT false,
  verification_method   TEXT NOT NULL
    CHECK (verification_method IN ('id-card', 'email-domain', 'alumni-roster', 'video-selfie')),
  verified_at           TIMESTAMPTZ NOT NULL,
  published_at          TIMESTAMPTZ NOT NULL,
  upvotes               INTEGER NOT NULL DEFAULT 0,
  receipts              INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uf_reviews_college_slug_idx ON uf_reviews(college_slug);
CREATE INDEX IF NOT EXISTS uf_reviews_vibe_idx ON uf_reviews(vibe);
CREATE INDEX IF NOT EXISTS uf_reviews_published_at_idx ON uf_reviews(published_at DESC);

CREATE TABLE IF NOT EXISTS uf_verified_students (
  id                        SERIAL PRIMARY KEY,
  pseudonym                 TEXT NOT NULL UNIQUE,
  verification_method       TEXT NOT NULL
    CHECK (verification_method IN ('id-card', 'email-domain', 'alumni-roster', 'video-selfie')),
  verified_at               TIMESTAMPTZ NOT NULL,
  college_id                INTEGER REFERENCES uf_colleges(id) ON DELETE SET NULL,
  submitted_review_count    INTEGER NOT NULL DEFAULT 0,
  trust_score               INTEGER NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uf_truth_revelations (
  id                  SERIAL PRIMARY KEY,
  headline            TEXT NOT NULL,
  dek                 TEXT NOT NULL,
  college_id          INTEGER NOT NULL REFERENCES uf_colleges(id) ON DELETE CASCADE,
  featured_at         TIMESTAMPTZ,
  weight              INTEGER NOT NULL DEFAULT 0,
  linked_review_ids   INTEGER[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uf_truth_revelations_college_idx ON uf_truth_revelations(college_id);
CREATE INDEX IF NOT EXISTS uf_truth_revelations_weight_idx ON uf_truth_revelations(weight DESC);

-- ─── Migration bookkeeping ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uf_migrations (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
