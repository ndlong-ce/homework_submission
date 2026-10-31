import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { LETTERS } from '@/lib/util';

// Server tự chấm điểm; đáp án đúng không bao giờ được gửi xuống trình duyệt trước khi nộp.
export async function POST(req, { params }) {
  const session = await getSession();
  if (!session || session.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const quizId = Number(params.id);
  if (!Number.isInteger(quizId)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });

  const sql = await db();
  const quiz = (await sql`SELECT is_open FROM quizzes WHERE id = ${quizId}`)[0];
  if (!quiz || !quiz.is_open) return NextResponse.json({ error: 'Bài trắc nghiệm không mở' }, { status: 404 });

  const qs = await sql`SELECT id, correct FROM quiz_questions WHERE quiz_id = ${quizId}`;
  if (!qs.length) return NextResponse.json({ error: 'Bài chưa có câu hỏi' }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const answers = {};
  for (const q of qs) {
    const a = String(b?.answers?.[q.id] || '').toUpperCase();
    if (LETTERS.includes(a)) answers[q.id] = a;
  }
  const correct = qs.filter((q) => answers[q.id] === q.correct).length;

  const r = await sql`
    INSERT INTO quiz_attempts (quiz_id, username, answers, correct, total)
    VALUES (${quizId}, ${session.username}, ${JSON.stringify(answers)}::jsonb, ${correct}, ${qs.length})
    ON CONFLICT (quiz_id, username) DO NOTHING
    RETURNING id`;
  if (!r.length) return NextResponse.json({ error: 'Bạn đã nộp bài này rồi' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
