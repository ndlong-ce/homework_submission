import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { removeBlobs } from '@/lib/blob';
import { ALLOWED_EXT, MAX_FILES, MAX_SIZE, extOf, isBlobUrl, safe, submissionState } from '@/lib/util';

// Ghi nhận bài nộp sau khi các file đã upload xong lên Blob. Nộp lại = thay toàn bộ file cũ.
export async function POST(req) {
  const session = await getSession();
  if (!session || session.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const aid = Number(b.assignmentId);
  const files = Array.isArray(b.files) ? b.files : [];
  if (!Number.isInteger(aid)) return NextResponse.json({ error: 'Bài tập không hợp lệ' }, { status: 400 });
  if (files.length < 1 || files.length > MAX_FILES) {
    return NextResponse.json({ error: `Cần nộp từ 1 đến ${MAX_FILES} file` }, { status: 400 });
  }
  const prefix = `/submissions/${aid}/${safe(session.username)}/`;
  for (const f of files) {
    const size = Number(f.size);
    if (
      !ALLOWED_EXT.includes(extOf(f.name)) ||
      !(size > 0 && size <= MAX_SIZE) ||
      !isBlobUrl(f.url, prefix)
    ) {
      return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
    }
  }

  const sql = await db();
  const a = (await sql`SELECT deadline FROM assignments WHERE id = ${aid}`)[0];
  if (!a) return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
  const st = submissionState(a.deadline);
  if (st.state === 'closed') return NextResponse.json({ error: 'Đã hết hạn nộp bài' }, { status: 403 });

  const old = await sql`
    SELECT f.url FROM submission_files f
    JOIN submissions s ON s.id = f.submission_id
    WHERE s.assignment_id = ${aid} AND s.username = ${session.username}`;

  const sub = (
    await sql`
      INSERT INTO submissions (assignment_id, username, submitted_at, is_late)
      VALUES (${aid}, ${session.username}, now(), ${st.late})
      ON CONFLICT (assignment_id, username)
      DO UPDATE SET submitted_at = now(), is_late = EXCLUDED.is_late
      RETURNING id`
  )[0];

  await sql`DELETE FROM submission_files WHERE submission_id = ${sub.id}`;
  for (const f of files) {
    await sql`INSERT INTO submission_files (submission_id, name, url, size)
              VALUES (${sub.id}, ${String(f.name).slice(0, 200)}, ${f.url}, ${Math.round(Number(f.size))})`;
  }
  await removeBlobs(old.map((r) => r.url));

  return NextResponse.json({ ok: true, late: st.late });
}
