-- ============================================================
-- TRANSFER MARKET — Supabase Schema Setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create enums
CREATE TYPE position_enum AS ENUM ('GK', 'DEF', 'MID', 'ATT');
CREATE TYPE player_status_enum AS ENUM ('AVAILABLE', 'SOLD', 'UNAVAILABLE');

-- 2. Create teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  initial_budget NUMERIC NOT NULL DEFAULT 100,
  remaining_budget NUMERIC NOT NULL DEFAULT 100
);

-- 3. Create players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enum_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  position position_enum NOT NULL,
  ovr INT NOT NULL,
  base_price NUMERIC NOT NULL,
  status player_status_enum NOT NULL DEFAULT 'AVAILABLE',
  sold_price NUMERIC,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL
);

-- 4. Enable RLS with permissive allow-all policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (no auth)
CREATE POLICY "Allow all on teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA — Initial teams and players
-- ============================================================

TRUNCATE TABLE players RESTART IDENTITY CASCADE;
TRUNCATE TABLE teams RESTART IDENTITY CASCADE;

-- Teams
INSERT INTO teams (name, initial_budget, remaining_budget) VALUES
  ('Varcelona', 100.0, 100.0),
  ('Hala Barca', 100.0, 100.0),
  ('Thenga FC', 100.0, 100.0),
  ('Team Morph', 100.0, 100.0),
  ('Padayapas', 100.0, 100.0),
  ('Madridistas', 100.0, 100.0),
  ('Real United FC', 100.0, 100.0);

-- Players
INSERT INTO players (enum_name, display_name, position, ovr, base_price, status) VALUES
  ('KYLIAN_MBAPPE', 'Mbappé', 'ATT', 91, 25.0, 'AVAILABLE'),
  ('MOHAMED_SALAH', 'Salah', 'ATT', 91, 24.0, 'AVAILABLE'),
  ('OUSMANE_DEMBELE', 'Dembélé', 'ATT', 90, 22.0, 'AVAILABLE'),
  ('ERLING_HAALAND', 'Haaland', 'ATT', 90, 22.0, 'AVAILABLE'),
  ('HARRY_KANE', 'Kane', 'ATT', 89, 20.0, 'AVAILABLE'),
  ('VINICIUS_JR', 'Vini Jr.', 'ATT', 89, 20.0, 'AVAILABLE'),
  ('LAMINE_YAMAL', 'Lamine Yamal', 'ATT', 89, 19.0, 'AVAILABLE'),
  ('RAPHINHA', 'Raphinha', 'ATT', 89, 18.0, 'AVAILABLE'),
  ('BUKAYO_SAKA', 'Saka', 'ATT', 88, 17.0, 'AVAILABLE'),
  ('COLE_PALMER', 'Palmer', 'ATT', 87, 16.0, 'AVAILABLE'),
  ('JULIAN_ALVAREZ', 'Álvarez', 'ATT', 87, 16.0, 'AVAILABLE'),
  ('KHVICHA_KVARATSKHELIA', 'Kvaratskhelia', 'ATT', 87, 15.0, 'AVAILABLE'),
  ('KARIM_BENZEMA', 'Benzema', 'ATT', 85, 12.0, 'AVAILABLE'),
  ('RODRYGO', 'Rodrygo', 'ATT', 85, 12.0, 'AVAILABLE'),
  ('HEUNG_MIN_SON', 'Son', 'ATT', 85, 12.0, 'AVAILABLE'),
  ('DESIRE_DOUE', 'Doué', 'ATT', 85, 11.0, 'AVAILABLE'),
  ('ANTOINE_GRIEZMANN', 'Griezmann', 'ATT', 85, 11.0, 'AVAILABLE'),
  ('RAFAEL_LEAO', 'Rafael Leão', 'ATT', 84, 10.0, 'AVAILABLE'),
  ('ANTONY', 'Antony', 'ATT', 81, 4.0, 'AVAILABLE'),
  ('RAYAN_CHERKI', 'Cherki', 'ATT', 81, 4.0, 'AVAILABLE'),
  ('MARCUS_RASHFORD', 'Rashford', 'ATT', 80, 2.0, 'AVAILABLE'),
  ('JUDE_BELLINGHAM', 'Bellingham', 'MID', 90, 23.0, 'AVAILABLE'),
  ('RODRI', 'Rodri', 'MID', 90, 22.0, 'AVAILABLE'),
  ('VITINHA', 'Vitinha', 'MID', 89, 19.0, 'AVAILABLE'),
  ('PEDRI', 'Pedri', 'MID', 89, 19.0, 'AVAILABLE'),
  ('FEDERICO_VALVERDE', 'Valverde', 'MID', 89, 18.0, 'AVAILABLE'),
  ('JAMAL_MUSIALA', 'Musiala', 'MID', 88, 17.0, 'AVAILABLE'),
  ('KEVIN_DE_BRUYNE', 'De Bruyne', 'MID', 87, 16.0, 'AVAILABLE'),
  ('DECLAN_RICE', 'Rice', 'MID', 87, 15.0, 'AVAILABLE'),
  ('BRUNO_FERNANDES', 'Bruno Fernandes', 'MID', 87, 15.0, 'AVAILABLE'),
  ('MARTIN_ODEGAARD', 'Odegaard', 'MID', 87, 15.0, 'AVAILABLE'),
  ('PHIL_FODEN', 'Foden', 'MID', 85, 13.0, 'AVAILABLE'),
  ('RODRIGO_DE_PAUL', 'De Paul', 'MID', 84, 10.0, 'AVAILABLE'),
  ('BERNARDO_SILVA', 'Bernardo Silva', 'MID', 84, 10.0, 'AVAILABLE'),
  ('GAVI', 'Gavi', 'MID', 83, 8.0, 'AVAILABLE'),
  ('LUKA_MODRIC', 'Modrić', 'MID', 83, 8.0, 'AVAILABLE'),
  ('BRAHIM_DIAZ', 'Brahim', 'MID', 82, 6.0, 'AVAILABLE'),
  ('FERMIN_LOPEZ', 'Fermín', 'MID', 80, 2.0, 'AVAILABLE'),
  ('CASEMIRO', 'Casemiro', 'MID', 80, 2.0, 'AVAILABLE'),
  ('VIRGIL_VAN_DIJK', 'van Dijk', 'DEF', 90, 22.0, 'AVAILABLE'),
  ('ACHRAF_HAKIMI', 'Hakimi', 'DEF', 89, 20.0, 'AVAILABLE'),
  ('JOSHUA_KIMMICH', 'Kimmich', 'DEF', 89, 19.0, 'AVAILABLE'),
  ('GABRIEL_MAGALHAES', 'Gabriel', 'DEF', 88, 17.0, 'AVAILABLE'),
  ('MARQUINHOS', 'Marquinhos', 'DEF', 87, 15.0, 'AVAILABLE'),
  ('ALESSANDRO_BASTONI', 'Bastoni', 'DEF', 87, 15.0, 'AVAILABLE'),
  ('RUBEN_DIAS', 'Ruben Dias', 'DEF', 86, 14.0, 'AVAILABLE'),
  ('NUNO_MENDES', 'Nuno Mendes', 'DEF', 86, 13.0, 'AVAILABLE'),
  ('ANTONIO_RUDIGER', 'Rüdiger', 'DEF', 86, 13.0, 'AVAILABLE'),
  ('TRENT_ALEXANDER_ARNOLD', 'Alexander-Arnold', 'DEF', 86, 13.0, 'AVAILABLE'),
  ('WILLIAN_PACHO', 'Pacho', 'DEF', 86, 12.0, 'AVAILABLE'),
  ('JOSKO_GVARDIOL', 'Gvardiol', 'DEF', 84, 10.0, 'AVAILABLE'),
  ('ALEJANDRO_BALDE', 'Balde', 'DEF', 83, 8.0, 'AVAILABLE'),
  ('RONALD_ARAUJO', 'Araujo', 'DEF', 83, 8.0, 'AVAILABLE'),
  ('JOHN_STONES', 'Stones', 'DEF', 82, 6.0, 'AVAILABLE'),
  ('DEAN_HUIJSEN', 'Huijsen', 'DEF', 82, 6.0, 'AVAILABLE'),
  ('GIANLUIGI_DONNARUMMA', 'Donnarumma', 'GK', 89, 19.0, 'AVAILABLE'),
  ('THIBAUT_COURTOIS', 'Courtois', 'GK', 89, 19.0, 'AVAILABLE'),
  ('ALISSON_BECKER', 'Alisson', 'GK', 89, 18.0, 'AVAILABLE'),
  ('JAN_OBLAK', 'Oblak', 'GK', 88, 16.0, 'AVAILABLE'),
  ('DAVID_RAYA', 'David Raya', 'GK', 87, 14.0, 'AVAILABLE'),
  ('MARC_ANDRE_TER_STEGEN', 'ter Stegen', 'GK', 86, 13.0, 'AVAILABLE'),
  ('EMILIANO_MARTINEZ', 'Martínez', 'GK', 85, 11.0, 'AVAILABLE'),
  ('DAVID_DE_GEA', 'De Gea', 'GK', 85, 10.0, 'AVAILABLE'),
  ('DIOGO_COSTA', 'Diogo Costa', 'GK', 84, 9.0, 'AVAILABLE'),
  ('ANDRE_ONANA', 'Onana', 'GK', 80, 2.0, 'AVAILABLE');
