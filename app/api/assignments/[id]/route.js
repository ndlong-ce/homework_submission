import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { removeBlobs } from '@/lib/blob';
import { parseAssignment } from '@/lib/assignment';

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const p = parseAssignment(await req.json().catch(() => ({})));
  if (p.error) return NextResponse.json({ error: p.error }, { status: 400 });

  const sql = await db();
  const cur = (await sql`SELECT doc_url FROM assignments WHERE id = ${id}`)[0];
  if (!cur) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

  await sql`
    UPDATE assignments SET
      title = ${p.title}, note = ${p.note}, deadline = ${p.deadline},
      doc_name = COALESCE(${p.docName}::text, doc_name),
      doc_url = COALESCE(${p.docUrl}::text, doc_url)
    WHERE id = ${id}`;
  if (p.docUrl && cur.doc_url && cur.doc_url !== p.docUrl) await removeBlobs([cur.doc_url]);
  return NextResponse.json({ id });
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });

  const sql = await db();
  const files = await sql`
    SELECT f.url FROM submission_files f
    JOIN submissions s ON s.id = f.submission_id
    WHERE s.assignment_id = ${id}`;
  const doc = await sql`SELECT doc_url FROM assignments WHERE id = ${id}`;
  await sql`DELETE FROM assignments WHERE id = ${id}`;
  await removeBlobs([...files.map((f) => f.url), ...doc.map((d) => d.doc_url)]);
  return NextResponse.json({ ok: true });
}
