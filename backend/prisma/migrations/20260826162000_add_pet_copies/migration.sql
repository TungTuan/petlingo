ALTER TABLE "progress"
ADD COLUMN "petCopies" JSONB NOT NULL DEFAULT '{}';

UPDATE "progress"
SET "petCopies" = COALESCE(
  (
    SELECT jsonb_object_agg(pet_key, 1)
    FROM jsonb_array_elements_text("unlockedPets") AS pets(pet_key)
  ),
  '{}'::jsonb
);
