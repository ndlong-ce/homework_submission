import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseAssignment } from '@/lib/assignment';

export async function POST(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const p = parseAssignment(await req.json().catch(() => ({})));
  if (p.error) return NextResponse.json({ error: p.error }, { status: 400 });
  if (!p.note && !p.image) return NextResponse.json({ error: 'Đề bài cần có chữ hoặc ảnh' }, { status: 400 });
  const sql = await db();
  const r = await sql`
    INSERT INTO assignments (title, note, deadline, image_data)
    VALUES (${p.title}, ${p.note}, ${p.deadline}, ${p.image})
    RETURNING id`;
  return NextResponse.json({ id: r[0].id });
}
