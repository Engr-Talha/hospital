DO $$
BEGIN
  IF to_regclass('public.patients') IS NOT NULL THEN
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS age integer;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'patients'
        AND column_name = 'dob'
    ) THEN
      UPDATE patients
      SET age = EXTRACT(YEAR FROM age(current_date, dob))::int
      WHERE age IS NULL
        AND dob IS NOT NULL;
    END IF;

    UPDATE patients
    SET age = 0
    WHERE age IS NULL;

    ALTER TABLE patients ALTER COLUMN age SET NOT NULL;
    ALTER TABLE patients DROP COLUMN IF EXISTS dob;
  END IF;
END $$;
