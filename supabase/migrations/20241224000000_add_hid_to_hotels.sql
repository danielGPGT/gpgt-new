-- Add hid column to hotels table for direct RateHawk matching
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS hid BIGINT;

-- Add index on hid for faster lookups
CREATE INDEX IF NOT EXISTS idx_hotels_hid ON hotels(hid);

-- Add comment explaining the purpose
COMMENT ON COLUMN hotels.hid IS 'RateHawk Hotel ID for direct matching with API responses'; 