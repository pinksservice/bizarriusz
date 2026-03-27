-- Bizarriusz: tabele repertuaru i ogłoszenia recepcji
-- Uruchom w: Supabase SQL Editor lub `npm run db:push`

-- ── biz_events (imprezy cykliczne) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS biz_events (
  id            SERIAL PRIMARY KEY,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  event_name    TEXT     NOT NULL,
  description   TEXT,
  hours_start   TEXT     NOT NULL,   -- "14:00"
  hours_end     TEXT     NOT NULL,   -- "23:00"
  price_regular INTEGER  NOT NULL,   -- w zł
  price_weekend INTEGER              -- NULL = taka sama cena jak regular
);

-- unikalny rekord na dzień tygodnia
CREATE UNIQUE INDEX IF NOT EXISTS biz_events_day_uq ON biz_events (day_of_week);

-- ── biz_special_events (imprezy na konkretną datę) ────────────────────────────
CREATE TABLE IF NOT EXISTS biz_special_events (
  id          SERIAL      PRIMARY KEY,
  date        DATE        NOT NULL UNIQUE,  -- "2025-04-18"
  event_name  TEXT        NOT NULL,
  description TEXT,
  hours_start TEXT        NOT NULL,
  hours_end   TEXT        NOT NULL,
  price       INTEGER     NOT NULL
);

-- ── biz_pinned_message (ogłoszenie recepcji w chacie) ─────────────────────────
CREATE TABLE IF NOT EXISTS biz_pinned_message (
  id         SERIAL      PRIMARY KEY,
  content    TEXT        NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── seed: repertuar tygodniowy ────────────────────────────────────────────────
INSERT INTO biz_events (day_of_week, event_name, description, hours_start, hours_end, price_regular, price_weekend)
VALUES
  (1, 'Free Sex',          'Wejście dla wszystkich orientacji',   '14:00', '23:00', 40, NULL),
  (2, 'Sex Grupowy',       'Impreza grupowa',                     '14:00', '23:00', 40, NULL),
  (3, 'Naked',             'Impreza nagości',                     '12:00', '23:00', 40, NULL),
  (4, 'Gang Bang',         'Impreza grupowa',                     '14:00', '23:00', 40, NULL),
  (5, 'Sex Party',         'Największa impreza tygodnia. Wszystkie orientacje. Muzyka do rana.', '20:00', '03:00', 70, 70),
  (6, 'Impreza Specjalna', 'Temat zmienia się co tydzień',        '20:00', '03:00', 70, 70),
  (0, 'Darkroom LGBT',     'Nagi męski darkroom. Niedziela dla społeczności LGBT.', '14:00', '23:00', 40, NULL)
ON CONFLICT (day_of_week) DO NOTHING;

-- ── seed: pinned message ──────────────────────────────────────────────────────
INSERT INTO biz_pinned_message (content)
SELECT 'Witamy w Bizarriuszu! Dziś zapraszamy na wieczorną imprezę. 🎉'
WHERE NOT EXISTS (SELECT 1 FROM biz_pinned_message);
