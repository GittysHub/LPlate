-- Add languages field to instructors table
-- This allows instructors to specify up to 3 languages they can teach in

-- Add the languages column as JSON array
ALTER TABLE instructors 
ADD COLUMN languages JSONB DEFAULT '["English"]'::jsonb;

-- Add a check constraint to ensure max 3 languages
ALTER TABLE instructors 
ADD CONSTRAINT check_languages_count 
CHECK (jsonb_array_length(languages) <= 3);

-- Add a check constraint to ensure valid language values
-- Common languages for UK driving instruction
ALTER TABLE instructors 
ADD CONSTRAINT check_languages_values 
CHECK (
  jsonb_array_length(languages) = 0 OR
  languages <@ '["English", "Welsh", "French", "German", "Spanish", "Italian", "Portuguese", "Polish", "Romanian", "Bulgarian", "Lithuanian", "Latvian", "Estonian", "Czech", "Slovak", "Hungarian", "Slovenian", "Croatian", "Serbian", "Bosnian", "Macedonian", "Albanian", "Turkish", "Arabic", "Urdu", "Hindi", "Punjabi", "Bengali", "Gujarati", "Tamil", "Telugu", "Malayalam", "Kannada", "Marathi", "Chinese", "Japanese", "Korean", "Thai", "Vietnamese", "Russian", "Ukrainian", "Belarusian", "Moldovan", "Georgian", "Armenian", "Azerbaijani", "Kazakh", "Kyrgyz", "Tajik", "Turkmen", "Uzbek", "Mongolian", "Hebrew", "Persian", "Dari", "Pashto", "Kurdish", "Amharic", "Swahili", "Yoruba", "Igbo", "Hausa", "Zulu", "Afrikaans", "Dutch", "Flemish", "Danish", "Norwegian", "Swedish", "Finnish", "Icelandic", "Greek", "Maltese", "Irish", "Scottish Gaelic", "Cornish", "Manx"]'::jsonb
);

-- Update existing instructors with default English language
UPDATE instructors 
SET languages = '["English"]'::jsonb 
WHERE languages IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN instructors.languages IS 'Array of languages (max 3) the instructor can teach in. Defaults to English.';

-- Create a GIN index for efficient JSON queries
CREATE INDEX idx_instructors_languages ON instructors USING GIN (languages);

-- Example queries for language filtering:
/*
-- Find instructors who speak English
SELECT * FROM instructors WHERE languages @> '["English"]';

-- Find instructors who speak French
SELECT * FROM instructors WHERE languages @> '["French"]';

-- Find instructors who speak either English or French
SELECT * FROM instructors WHERE languages ?| ARRAY['English', 'French'];

-- Find instructors who speak both English and French
SELECT * FROM instructors WHERE languages @> '["English", "French"]';
*/
