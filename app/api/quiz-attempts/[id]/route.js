import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Admin xóa TOÀN BỘ lượt làm của tài khoản đó trong bài trắc nghiệm (để làm lại từ đầu).
// id = id của một lượt làm bất kỳ thuộc tài khoản đó.
export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const sql = await db();
  await sql`
    DELETE FROM quiz_attempts a USING quiz_attempts b
    WHERE b.id = ${id} AND a.quiz_id = b.quiz_id AND a.username = b.username`;
  return NextResponse.json({ ok: true });
}
