-- 0002_submissions.sql — user submissions from /submit.
--
-- Separate from uf_reviews because raw submissions need a moderation
-- pipeline: pending → verified → published (or rejected). Reviews are
-- the curated public output; submissions are the raw inbox.

CREATE TABLE IF NOT EXISTS uf_submissions (
  id                 SERIAL PRIMARY KEY,
  case_no            TEXT NOT NULL UNIQUE,
  college_name       TEXT NOT NULL,
  college_slug       TEXT,
  brochure_claim     TEXT NOT NULL,
  reality            TEXT NOT NULL,
  has_receipts       BOOLEAN NOT NULL DEFAULT false,
  email              TEXT NOT NULL,
  email_domain       TEXT NOT NULL,
  identity           TEXT NOT NULL
    CHECK (identity IN ('anonymous', 'named')),
  pseudonym          TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'published')),
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at        TIMESTAMPTZ,
  reviewer_user_id   INTEGER REFERENCES uf_users(id) ON DELETE SET NULL,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uf_submissions_status_idx ON uf_submissions(status);
CREATE INDEX IF NOT EXISTS uf_submissions_submitted_at_idx ON uf_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS uf_submissions_college_slug_idx ON uf_submissions(college_slug)
  WHERE college_slug IS NOT NULL;
