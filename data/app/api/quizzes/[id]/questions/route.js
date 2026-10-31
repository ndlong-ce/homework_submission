import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseQuestion, hasAttempts, LOCKED_MSG } from '@/lib/quiz';

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const quizId = Number(params.id);
  if (!Number.isInteger(quizId)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });

  const p = parseQuestion(await req.json().catch(() => ({})));
  if (p.error) return NextResponse.json({ error: p.error }, { status: 400 });
  if (!p.text && !p.imageUrl) return NextResponse.json({ error: 'Câu hỏi cần có chữ hoặc ảnh' }, { status: 400 });

  const sql = await db();
  const quiz = (await sql`SELECT id FROM quizzes WHERE id = ${quizId}`)[0];
  if (!quiz) return NextResponse.json({ error: 'Không tìm thấy bài trắc nghiệm' }, { status: 404 });
  if (await hasAttempts(sql, quizId)) return NextResponse.json({ error: LOCKED_MSG }, { status: 409 });

  const r = await sql`
    INSERT INTO quiz_questions (quiz_id, text, image_url, opt_a, opt_b, opt_c, opt_d, correct)
    VALUES (${quizId}, ${p.text}, ${p.imageUrl}, ${p.opts[0]}, ${p.opts[1]}, ${p.opts[2]}, ${p.opts[3]}, ${p.correct})
    RETURNING id`;
  return NextResponse.json({ id: r[0].id });
}
