-- section_presets
CREATE TABLE IF NOT EXISTS section_presets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- section_preset_blocks
CREATE TABLE IF NOT EXISTS section_preset_blocks (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_preset_id UUID    NOT NULL REFERENCES section_presets(id) ON DELETE CASCADE,
  title             TEXT    NOT NULL,
  start_time        TEXT    NOT NULL,
  end_time          TEXT    NOT NULL,
  colour            TEXT    NOT NULL,
  is_variable       BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT,
  "order"           INTEGER NOT NULL DEFAULT 0
);

CREATE TRIGGER section_presets_updated_at
  BEFORE UPDATE ON section_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE section_presets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_preset_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "section_presets_owner" ON section_presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "section_preset_blocks_owner" ON section_preset_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM section_presets sp WHERE sp.id = section_preset_blocks.section_preset_id AND sp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM section_presets sp WHERE sp.id = section_preset_blocks.section_preset_id AND sp.user_id = auth.uid())
  );
