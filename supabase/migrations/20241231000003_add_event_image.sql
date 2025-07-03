-- Add image column to events table
ALTER TABLE public.events 
ADD COLUMN event_image jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.events.event_image IS 'Event image stored as JSONB with image_url, thumbnail_url, and description fields'; 