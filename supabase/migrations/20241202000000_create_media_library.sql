-- Create media library table
CREATE TABLE public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  location text,
  image_url text NOT NULL,
  thumbnail_url text,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_media_library_user_id ON public.media_library(user_id);
CREATE INDEX idx_media_library_category ON public.media_library(category);
CREATE INDEX idx_media_library_tags ON public.media_library USING GIN(tags);
CREATE INDEX idx_media_library_created_at ON public.media_library(created_at DESC);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own media" ON public.media_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON public.media_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON public.media_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON public.media_library
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at(); 