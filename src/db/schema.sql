CREATE TABLE IF NOT EXISTS competitions (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  type TEXT
);

CREATE TABLE IF NOT EXISTS seasons (
  id BIGINT PRIMARY KEY,
  competition_id BIGINT REFERENCES competitions(id),
  name TEXT,
  starting_at TIMESTAMPTZ,
  ending_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS teams (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT,
  logo TEXT,
  country TEXT
);

CREATE TABLE IF NOT EXISTS players (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  image TEXT,
  team_id BIGINT REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGINT PRIMARY KEY,
  competition_id BIGINT REFERENCES competitions(id),
  season_id BIGINT REFERENCES seasons(id),
  home_team_id BIGINT REFERENCES teams(id),
  away_team_id BIGINT REFERENCES teams(id),
  status TEXT,
  starting_at TIMESTAMPTZ,
  home_score NUMERIC,
  away_score NUMERIC,
  venue TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_events (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  minute INT,
  extra_minute INT,
  team_id BIGINT,
  player_id BIGINT,
  payload JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS match_statistics (
  match_id BIGINT PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home JSONB NOT NULL DEFAULT '{}',
  away JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_statistics (
  team_id BIGINT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_statistics (
  player_id BIGINT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lineups (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  player_id BIGINT REFERENCES players(id),
  starter BOOLEAN DEFAULT FALSE,
  position TEXT,
  minutes INT,
  payload JSONB DEFAULT '{}',
  UNIQUE(match_id, team_id, player_id)
);

CREATE TABLE IF NOT EXISTS injuries (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  player_id BIGINT REFERENCES players(id),
  status TEXT,
  reason TEXT,
  payload JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS bookmakers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS markets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS odds (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  bookmaker_id BIGINT REFERENCES bookmakers(id),
  market TEXT NOT NULL,
  selection TEXT NOT NULL,
  line NUMERIC,
  odd NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  selection TEXT NOT NULL,
  line NUMERIC,
  probability NUMERIC,
  odd NUMERIC,
  edge NUMERIC,
  expected_value NUMERIC,
  confidence TEXT,
  decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS value_opportunities (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  selection TEXT NOT NULL,
  line NUMERIC,
  odd NUMERIC NOT NULL,
  model_probability NUMERIC NOT NULL,
  implied_probability NUMERIC NOT NULL,
  edge NUMERIC NOT NULL,
  expected_value NUMERIC NOT NULL,
  confidence TEXT NOT NULL,
  reasons JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_history (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT,
  market TEXT,
  input JSONB,
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_results (
  id BIGSERIAL PRIMARY KEY,
  prediction_id BIGINT REFERENCES predictions(id),
  predicted_probability NUMERIC,
  odd NUMERIC,
  edge NUMERIC,
  decision TEXT,
  actual_result JSONB,
  model_error NUMERIC,
  roi NUMERIC,
  clv NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_starting_at ON matches(starting_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_odds_match_id ON odds(match_id);
CREATE INDEX IF NOT EXISTS idx_value_match_id ON value_opportunities(match_id);
