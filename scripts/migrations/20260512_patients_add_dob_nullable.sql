-- Optional date of birth (nullable). Entity maps column "dob"; safe if column already exists.
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob date NULL;
