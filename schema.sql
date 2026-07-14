-- schema.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK(role IN ('admin', 'student')) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK(type IN ('book', 'video', 'notes')) NOT NULL,
  google_drive_url VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(255),
  category_id INTEGER,
  subject_id INTEGER,
  ai_summary TEXT,
  topic_tags TEXT[] DEFAULT '{}',
  difficulty_level VARCHAR(20),
  embedding VECTOR(768),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS resources_embedding_idx ON resources USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (resource_id, tag_id),
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ─── Section 1: RAG Chat ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_session_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attached_file_uri TEXT,
  attached_file_mime VARCHAR(100),
  cited_resource_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Section 2: Past Papers ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS past_papers (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id),
  year INTEGER NOT NULL,
  session VARCHAR(20),
  paper_number INTEGER DEFAULT 1,
  question_paper_url TEXT,
  mark_scheme_url TEXT,
  compiled_bundle_url TEXT,
  source VARCHAR(50) DEFAULT 'admin_upload',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Section 3: Topic Frequency ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS paper_questions (
  id SERIAL PRIMARY KEY,
  paper_id INTEGER REFERENCES past_papers(id) ON DELETE CASCADE,
  question_number INTEGER,
  topic_tags TEXT[] DEFAULT '{}',
  marks INTEGER,
  extracted_text TEXT
);

-- ─── Section 4: Roadmap / Study Plans ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_session_id VARCHAR(64) NOT NULL,
  exam_date DATE NOT NULL,
  subjects INTEGER[] NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_plan_tasks (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES study_plans(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  subject_id INTEGER REFERENCES subjects(id),
  topic VARCHAR(255),
  resource_ids INTEGER[] DEFAULT '{}',
  estimated_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'done', 'skipped')),
  is_weak_topic BOOLEAN DEFAULT FALSE
);

-- ─── Section 5: Mock Exams & Readiness ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS mock_exams (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id),
  question_ids INTEGER[] DEFAULT '{}',
  total_marks INTEGER DEFAULT 100,
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_session_id VARCHAR(64) NOT NULL,
  mock_exam_id INTEGER REFERENCES mock_exams(id),
  topic VARCHAR(255),
  score_pct FLOAT,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- ─── Section 6: Flashcards ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  topic VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id SERIAL PRIMARY KEY,
  flashcard_id INTEGER REFERENCES flashcards(id) ON DELETE CASCADE,
  user_session_id VARCHAR(64) NOT NULL,
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(flashcard_id, user_session_id)
);

-- ─── Section 8: Crowdsourced Submission ──────────────────────────────────────

ALTER TABLE resources ADD COLUMN IF NOT EXISTS submission_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS submitted_by_session VARCHAR(64);

-- ─── Section 9: Study Groups ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  created_by_session VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
  group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
  user_session_id VARCHAR(64) NOT NULL,
  points INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, user_session_id)
);

-- ─── Seed Data ────────────────────────────────────────────────────────────────

-- Insert default admin (password: noto-admin)
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@noto.com', '$2y$12$uqpJEqnGQbA3O17Mrq6of.KQLTCLKK98Acu9P2dUhAuLpSvj2U3Ju', 'admin') 
ON CONFLICT DO NOTHING;

INSERT INTO categories (name) VALUES ('O Level'), ('A Level'), ('SAT') ON CONFLICT DO NOTHING;

DO $$
DECLARE
  o_level_id INTEGER;
  a_level_id INTEGER;
  sat_id INTEGER;
BEGIN
  SELECT id INTO o_level_id FROM categories WHERE name = 'O Level';
  SELECT id INTO a_level_id FROM categories WHERE name = 'A Level';
  SELECT id INTO sat_id FROM categories WHERE name = 'SAT';

  INSERT INTO subjects (name, category_id) VALUES ('Mathematics', o_level_id) ON CONFLICT DO NOTHING;
  INSERT INTO subjects (name, category_id) VALUES ('Physics', o_level_id) ON CONFLICT DO NOTHING;
  INSERT INTO subjects (name, category_id) VALUES ('Chemistry', o_level_id) ON CONFLICT DO NOTHING;
  INSERT INTO subjects (name, category_id) VALUES ('Further Mathematics', a_level_id) ON CONFLICT DO NOTHING;
  INSERT INTO subjects (name, category_id) VALUES ('Biology', a_level_id) ON CONFLICT DO NOTHING;
  INSERT INTO subjects (name, category_id) VALUES ('Math', sat_id) ON CONFLICT DO NOTHING;
  INSERT INTO subjects (name, category_id) VALUES ('Reading & Writing', sat_id) ON CONFLICT DO NOTHING;
END $$;

