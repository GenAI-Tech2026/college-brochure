-- 0003_receipts.sql — persist uploaded evidence ("receipts") through the
-- moderation pipeline.
--
-- Students attach proof on /submit; admins see it in the inbox and, when a
-- submission is published, the paths carry over onto the public review row.
-- Files live under /public/uploads/receipts and we store their public paths.

ALTER TABLE uf_submissions
  ADD COLUMN IF NOT EXISTS receipt_paths TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE uf_reviews
  ADD COLUMN IF NOT EXISTS receipt_paths TEXT[] NOT NULL DEFAULT '{}';

-- Link a published review back to the submission it came from (audit trail,
-- and lets us avoid double-publishing the same submission).
ALTER TABLE uf_reviews
  ADD COLUMN IF NOT EXISTS source_submission_id INTEGER
    REFERENCES uf_submissions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS uf_reviews_source_submission_idx
  ON uf_reviews(source_submission_id)
  WHERE source_submission_id IS NOT NULL;
