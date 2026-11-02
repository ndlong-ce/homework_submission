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
  const quiz = (await sql`SELECT is_open, max_attempts FROM quizzes WHERE id = ${quizId}`)[0];
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

  // Chỉ ghi nếu số lần đã làm còn nhỏ hơn giới hạn (kiểm tra và ghi trong cùng một câu lệnh)
  const r = await sql`
    INSERT INTO quiz_attempts (quiz_id, username, answers, correct, total, attempt_no)
    SELECT ${quizId}::int, ${session.username}::text, ${JSON.stringify(answers)}::jsonb,
           ${correct}::int, ${qs.length}::int, c.n + 1
    FROM (SELECT count(*)::int AS n FROM quiz_attempts WHERE quiz_id = ${quizId}::int AND username = ${session.username}::text) c
    WHERE c.n < ${quiz.max_attempts}::int
    RETURNING id`;
  if (!r.length) return NextResponse.json({ error: 'Bạn đã hết lượt làm bài này' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
