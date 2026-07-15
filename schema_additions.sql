-- schema_additions.sql
-- Run these in your Supabase/PostgreSQL SQL editor to add RBAC + intern management tables.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).

-- ─── 1. Extend users table ─────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_seen  TIMESTAMP,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Set username = email for existing users (admin only)
UPDATE users SET username = email WHERE username IS NULL;

-- Update role check to allow 'intern'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'student', 'intern'));

-- ─── 2. Intern Permissions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intern_permissions (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,     -- 'resources' | 'past_papers' | 'subjects' | 'categories'
  can_read      BOOLEAN DEFAULT TRUE,
  can_write     BOOLEAN DEFAULT FALSE,
  can_edit      BOOLEAN DEFAULT FALSE,
  can_delete    BOOLEAN DEFAULT FALSE,   -- always FALSE for interns, enforced server-side
  updated_by    INT REFERENCES users(id),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, resource_type)
);

-- ─── 3. Activity Logs ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id),
  action       VARCHAR(30)  NOT NULL,    -- 'created' | 'updated' | 'uploaded' | 'attempted_delete' | 'deleted'
  entity_type  VARCHAR(50)  NOT NULL,    -- 'resource' | 'past_paper' | 'subject' | 'intern_account'
  entity_id    INT,
  entity_title VARCHAR(255),            -- snapshot at time of action
  metadata     JSONB,                   -- before/after values, changed fields, etc.
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx   ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);

-- ─── 4. Admin user: set username ───────────────────────────────────────────
-- Run this to give the admin a proper username for login:
-- UPDATE users SET username = 'admin' WHERE email = 'admin@noto.com';

-- Added for expanded user profile on signup
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

-- Ensure tutor and intern roles are allowed
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'student', 'intern', 'tutor'));
CREATE TABLE IF NOT EXISTS tutor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    subjects TEXT,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    profile_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_courses (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_enrollments (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES tutor_courses(id) ON DELETE SET NULL,
  fee_paid BOOLEAN DEFAULT FALSE,
  payment_ref TEXT,
  payment_method TEXT DEFAULT 'jazzcash',
  payment_status TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tutor_id, student_id, course_id)
);

CREATE TABLE IF NOT EXISTS tutor_videos (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES tutor_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_readings (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES tutor_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_classes (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES tutor_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'zoom',
  meeting_link TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_announcements (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES tutor_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_last_online (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
