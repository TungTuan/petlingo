ALTER TABLE "progress"
ADD COLUMN "petEggs" JSONB NOT NULL DEFAULT '{}';

UPDATE "progress"
SET "petEggs" = COALESCE(
  (
    SELECT jsonb_object_agg(entry.key, GREATEST((entry.value #>> '{}')::int - 1, 0))
    FROM jsonb_each("petCopies") AS entry(key, value)
  ),
  '{}'::jsonb
);
