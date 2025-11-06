/*
  # TripSmart Database Schema

  ## Overview
  Complete database schema for TripSmart travel planning application with user authentication,
  city information, attractions, and itinerary management.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `name` (text) - User display name
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. `cities`
  Travel destination cities with seasonal information
  - `id` (uuid, primary key)
  - `name` (text) - City name
  - `country` (text) - Country name
  - `description` (text) - City overview
  - `best_time_to_visit` (text) - Recommended visiting season
  - `important_instructions` (text) - Travel tips and important notes
  - `image_url` (text) - City image for display
  - `latitude` (numeric) - Geographic coordinates
  - `longitude` (numeric) - Geographic coordinates
  - `created_at` (timestamptz)

  ### 3. `attractions`
  Places to visit within each city
  - `id` (uuid, primary key)
  - `city_id` (uuid) - References cities table
  - `name` (text) - Attraction name
  - `description` (text) - Attraction details
  - `category` (text) - Type of attraction (museum, park, restaurant, etc.)
  - `latitude` (numeric) - Geographic coordinates
  - `longitude` (numeric) - Geographic coordinates
  - `estimated_duration_hours` (numeric) - Time needed to visit
  - `created_at` (timestamptz)

  ### 4. `itineraries`
  User-created travel plans
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles table
  - `city_id` (uuid) - References cities table
  - `title` (text) - Itinerary name
  - `start_date` (date) - Trip start date
  - `end_date` (date) - Trip end date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `itinerary_items`
  Individual attractions within an itinerary
  - `id` (uuid, primary key)
  - `itinerary_id` (uuid) - References itineraries table
  - `attraction_id` (uuid) - References attractions table
  - `visit_date` (date) - Planned visit date
  - `visit_order` (integer) - Order of visit on that day
  - `notes` (text) - User notes
  - `created_at` (timestamptz)

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Profiles: Users can only view/update their own profile
  - Cities & Attractions: Public read access, no write access for users
  - Itineraries: Users can only manage their own itineraries
  - Itinerary Items: Users can only manage items in their own itineraries

  ## Important Notes
  1. Authentication handled by Supabase Auth (auth.users table)
  2. Geographic coordinates stored for mapping functionality
  3. Cascading deletes configured for data integrity
  4. Indexes added for frequently queried columns
  5. All timestamps use timezone-aware types
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  description text NOT NULL,
  best_time_to_visit text NOT NULL,
  important_instructions text NOT NULL,
  image_url text DEFAULT '',
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

-- Create attractions table
CREATE TABLE IF NOT EXISTS attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  estimated_duration_hours numeric(3, 1) DEFAULT 2.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attractions are viewable by everyone"
  ON attractions FOR SELECT
  TO authenticated
  USING (true);

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own itineraries"
  ON itineraries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own itineraries"
  ON itineraries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries"
  ON itineraries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries"
  ON itineraries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  attraction_id uuid NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  visit_order integer DEFAULT 1,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in own itineraries"
  ON itinerary_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items in own itineraries"
  ON itinerary_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own itineraries"
  ON itinerary_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items in own itineraries"
  ON itinerary_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attractions_city_id ON attractions(city_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_city_id ON itineraries(city_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_attraction_id ON itinerary_items(attraction_id);