import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Admin xóa lượt làm bài để sinh viên làm lại
export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const sql = await db();
  await sql`DELETE FROM quiz_attempts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
