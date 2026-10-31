import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const id = Number(b.submissionId);
  const grade = b.grade === '' || b.grade == null ? null : Number(b.grade);
  const feedback = String(b.feedback || '').slice(0, 5000);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Bài nộp không hợp lệ' }, { status: 400 });
  if (grade !== null && (!Number.isInteger(grade) || grade < 0 || grade > 100)) {
    return NextResponse.json({ error: 'Điểm phải là số nguyên từ 0 đến 100' }, { status: 400 });
  }
  const sql = await db();
  await sql`UPDATE submissions SET grade = ${grade}::int, feedback = ${feedback}, graded_at = now() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
