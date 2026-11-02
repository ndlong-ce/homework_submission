import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseAssignment } from '@/lib/assignment';

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const p = parseAssignment(await req.json().catch(() => ({})));
  if (p.error) return NextResponse.json({ error: p.error }, { status: 400 });

  const sql = await db();
  const cur = (await sql`SELECT (image_data IS NOT NULL) AS has_image FROM assignments WHERE id = ${id}`)[0];
  if (!cur) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  const willHaveImage = p.image ? true : p.removeImage ? false : cur.has_image;
  if (!p.note && !willHaveImage) return NextResponse.json({ error: 'Đề bài cần có chữ hoặc ảnh' }, { status: 400 });

  await sql`UPDATE assignments SET title = ${p.title}, note = ${p.note}, deadline = ${p.deadline} WHERE id = ${id}`;
  if (p.image) await sql`UPDATE assignments SET image_data = ${p.image} WHERE id = ${id}`;
  else if (p.removeImage) await sql`UPDATE assignments SET image_data = NULL WHERE id = ${id}`;
  return NextResponse.json({ id });
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const sql = await db();
  await sql`DELETE FROM assignments WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
