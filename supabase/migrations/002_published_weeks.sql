-- Stores one record per published week
CREATE TABLE published_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_preset_id uuid REFERENCES week_presets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Stores the Google Calendar event ID for each published block
CREATE TABLE published_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_week_id uuid NOT NULL REFERENCES published_weeks(id) ON DELETE CASCADE,
  google_calendar_event_id text NOT NULL,
  block_id uuid REFERENCES blocks(id) ON DELETE SET NULL,
  day_date date NOT NULL,
  title text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL
);

ALTER TABLE published_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own published weeks"
  ON published_weeks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own published events"
  ON published_events FOR ALL
  USING (
    published_week_id IN (
      SELECT id FROM published_weeks WHERE user_id = auth.uid()
    )
  );
