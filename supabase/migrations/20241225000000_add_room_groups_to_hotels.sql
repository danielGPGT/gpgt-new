-- Add room_groups column to hotels table
-- This column will store JSONB data containing room groups with images and metadata

ALTER TABLE public.hotels 
ADD COLUMN room_groups JSONB NULL;

-- Add an index on room_groups for better query performance
CREATE INDEX IF NOT EXISTS idx_hotels_room_groups 
ON public.hotels USING GIN (room_groups);

-- Add a comment to document the column
COMMENT ON COLUMN public.hotels.room_groups IS 'JSONB array containing room group data with images, amenities, and metadata from the static hotel dump';

-- Example structure of room_groups data:
-- [
--   {
--     "room_group_id": 6,
--     "name": "Bed in Dorm",
--     "images": ["https://cdn.worldota.net/t/240x240/extranet/...", ...],
--     "images_ext": [{"category_slug": "unspecified", "url": "..."}, ...],
--     "room_amenities": ["shared-bathroom", "towels"],
--     "name_struct": {
--       "bathroom": "shared bathroom",
--       "bedding_type": null,
--       "main_name": "Bed in Dorm"
--     },
--     "rg_ext": {
--       "balcony": 0,
--       "bathroom": 1,
--       "bedding": 0,
--       "bedrooms": 0,
--       "capacity": 0,
--       "class": 1,
--       "club": 0,
--       "family": 0,
--       "floor": 0,
--       "quality": 0,
--       "sex": 0,
--       "view": 0
--     }
--   }
-- ] 