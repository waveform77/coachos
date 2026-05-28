DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'coach_profiles'::regclass AND conname = 'uni_coach_profiles_user_id'
  ) THEN
    ALTER TABLE coach_profiles RENAME CONSTRAINT uni_coach_profiles_user_id TO coach_profiles_user_id_key;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
