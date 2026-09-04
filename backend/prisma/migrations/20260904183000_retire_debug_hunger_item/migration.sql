-- Retire the internal hunger-state shortcut in every previously seeded
-- environment without deleting historical ChildItem/Gift references.
UPDATE "items"
SET "isActive" = false,
    "defaultQty" = 0,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'test-lam-doi';
