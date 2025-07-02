-- Add contract file path to hotel_rooms table
ALTER TABLE public.hotel_rooms 
ADD COLUMN contract_file_path text null;

-- Add comment for documentation
COMMENT ON COLUMN public.hotel_rooms.contract_file_path IS 'Path or URL to the uploaded contract PDF file'; 