-- Run this in the Supabase SQL editor to set up the schema.

-- day_presets
CREATE TABLE IF NOT EXISTS day_presets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blocks
CREATE TABLE IF NOT EXISTS blocks (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  day_preset_id  UUID    NOT NULL REFERENCES day_presets(id) ON DELETE CASCADE,
  title          TEXT    NOT NULL,
  start_time     TEXT    NOT NULL,
  end_time       TEXT    NOT NULL,
  colour         TEXT    NOT NULL,
  is_variable    BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT,
  "order"        INTEGER NOT NULL DEFAULT 0
);

-- week_presets
CREATE TABLE IF NOT EXISTS week_presets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- week_preset_days
CREATE TABLE IF NOT EXISTS week_preset_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_preset_id  UUID NOT NULL REFERENCES week_presets(id) ON DELETE CASCADE,
  day_of_week     TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  day_preset_id   UUID REFERENCES day_presets(id) ON DELETE SET NULL,
  UNIQUE(week_preset_id, day_of_week)
);

-- user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_week_preset_id UUID REFERENCES week_presets(id) ON DELETE SET NULL,
  preferred_view         TEXT NOT NULL DEFAULT 'week' CHECK (preferred_view IN ('day','week','list'))
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER day_presets_updated_at
  BEFORE UPDATE ON day_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER week_presets_updated_at
  BEFORE UPDATE ON week_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE day_presets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_presets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_preset_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "day_presets_owner" ON day_presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blocks_owner" ON blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM day_presets dp WHERE dp.id = blocks.day_preset_id AND dp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM day_presets dp WHERE dp.id = blocks.day_preset_id AND dp.user_id = auth.uid())
  );

CREATE POLICY "week_presets_owner" ON week_presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "week_preset_days_owner" ON week_preset_days
  FOR ALL USING (
    EXISTS (SELECT 1 FROM week_presets wp WHERE wp.id = week_preset_days.week_preset_id AND wp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM week_presets wp WHERE wp.id = week_preset_days.week_preset_id AND wp.user_id = auth.uid())
  );

CREATE POLICY "user_settings_owner" ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
