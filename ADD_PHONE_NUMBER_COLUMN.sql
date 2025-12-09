-- Add phone_number column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='phone_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN phone_number TEXT;
    RAISE NOTICE 'phone_number column added successfully';
  ELSE
    RAISE NOTICE 'phone_number column already exists';
  END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
