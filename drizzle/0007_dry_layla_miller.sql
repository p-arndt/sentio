-- Drop old individual preference columns and replace with a single settings JSONB column
-- This allows for flexible, extensible user settings without schema changes

-- Drop the old columns
ALTER TABLE "user_preferences" 
  DROP COLUMN IF EXISTS "theme",
  DROP COLUMN IF EXISTS "default_view",
  DROP COLUMN IF EXISTS "enable_notifications",
  DROP COLUMN IF EXISTS "start_page";

-- Add the new settings JSONB column with default structure
ALTER TABLE "user_preferences"
  ADD COLUMN "settings" jsonb NOT NULL DEFAULT '{"theme":"system","defaultView":"week","enableNotifications":true,"startPage":"/"}';

