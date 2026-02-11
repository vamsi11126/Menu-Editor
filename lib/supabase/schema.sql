-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Menu',
  slug TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  qr_code_url TEXT,
  canvas_size JSONB DEFAULT '{"width": 600, "height": 800}'::jsonb,
  background_url TEXT,
  background_color TEXT DEFAULT '#f8f9fa',
  sections JSONB DEFAULT '[]'::jsonb,
  individual_items JSONB DEFAULT '[]'::jsonb,
  lines JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  item_spacing INTEGER DEFAULT 50,
  uniform_section_size JSONB DEFAULT '{"width": 400, "height": 300}'::jsonb,
  price_memory JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own menus" ON menus;
DROP POLICY IF EXISTS "Public menus are viewable by everyone" ON menus;
DROP POLICY IF EXISTS "Users can create their own menus" ON menus;
DROP POLICY IF EXISTS "Users can update their own menus" ON menus;
DROP POLICY IF EXISTS "Users can delete their own menus" ON menus;

-- Policies for SELECT (viewing)
CREATE POLICY "Users can view their own menus"
  ON menus FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public menus are viewable by everyone"
  ON menus FOR SELECT
  USING (is_public = true);

-- Policy for INSERT (creating)
CREATE POLICY "Users can create their own menus"
  ON menus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (editing)
CREATE POLICY "Users can update their own menus"
  ON menus FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing)
CREATE POLICY "Users can delete their own menus"
  ON menus FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_menus_user_id ON menus(user_id);
CREATE INDEX IF NOT EXISTS idx_menus_slug ON menus(slug);
CREATE INDEX IF NOT EXISTS idx_menus_is_public ON menus(is_public);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;

CREATE TRIGGER update_menus_updated_at
    BEFORE UPDATE ON menus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for menu images (run this in Supabase Dashboard > Storage)
-- 1. Create a bucket named 'menu-images'
-- 2. Make it public
-- 3. Add the following RLS policies:

-- Policy for uploading images (authenticated users only)
-- CREATE POLICY "Authenticated users can upload images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'menu-images');

-- Policy for viewing images (public access)
-- CREATE POLICY "Public images are viewable by everyone"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'menu-images');

-- Policy for deleting images (only owner)
-- CREATE POLICY "Users can delete their own images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]);
