import { neon } from '@neondatabase/serverless';

let _sql = null;
let ready = null;

async function init(sql) {
  await sql`CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    deadline TIMESTAMPTZ NOT NULL,
    doc_name TEXT,
    doc_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    grade INTEGER,
    feedback TEXT NOT NULL DEFAULT '',
    graded_at TIMESTAMPTZ,
    UNIQUE (assignment_id, username)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS submission_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    opt_a TEXT NOT NULL DEFAULT '',
    opt_b TEXT NOT NULL DEFAULT '',
    opt_c TEXT NOT NULL DEFAULT '',
    opt_d TEXT NOT NULL DEFAULT '',
    correct TEXT NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    correct INTEGER NOT NULL,
    total INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (quiz_id, username)
  )`;
  // Nâng cấp bảng cũ (chạy an toàn nhiều lần)
  await sql`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS image_data TEXT`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_data TEXT`;
  await sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 1`;
  await sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS attempt_no INTEGER NOT NULL DEFAULT 1`;
  await sql`ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_username_key`;
}

// Trả về hàm sql (tagged template). Tự tạo bảng ở lần gọi đầu tiên.
export async function db() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  if (!ready) {
    ready = init(_sql).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return _sql;
}
