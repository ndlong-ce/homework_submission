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
