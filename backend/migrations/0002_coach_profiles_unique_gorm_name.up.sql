-- GORM AutoMigrate ожидает имя UNIQUE constraint `uni_coach_profiles_user_id`.
-- PostgreSQL при `UNIQUE` в колонке создаёт `coach_profiles_user_id_key`.
-- Лишний индекс idx_coach_profiles_user_id дублирует UNIQUE.

DROP INDEX IF EXISTS idx_coach_profiles_user_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'coach_profiles'::regclass AND conname = 'coach_profiles_user_id_key'
  ) THEN
    ALTER TABLE coach_profiles RENAME CONSTRAINT coach_profiles_user_id_key TO uni_coach_profiles_user_id;
  END IF;
END $$;
