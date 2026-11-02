import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { MAX_TEXT, submissionState } from '@/lib/util';

// Sinh viên dán bài làm dạng text. Nộp lại = thay nội dung cũ (chỉ khi còn hạn / trong 24h nộp trễ).
export async function POST(req) {
  const session = await getSession();
  if (!session || session.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const aid = Number(b.assignmentId);
  const content = String(b.content ?? '').replace(/\r\n/g, '\n');
  if (!Number.isInteger(aid)) return NextResponse.json({ error: 'Bài tập không hợp lệ' }, { status: 400 });
  if (!content.trim()) return NextResponse.json({ error: 'Chưa nhập nội dung bài làm' }, { status: 400 });
  if (content.length > MAX_TEXT) {
    return NextResponse.json({ error: `Bài làm quá dài (tối đa ${MAX_TEXT.toLocaleString('vi-VN')} ký tự)` }, { status: 400 });
  }

  const sql = await db();
  const a = (await sql`SELECT deadline FROM assignments WHERE id = ${aid}`)[0];
  if (!a) return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
  const st = submissionState(a.deadline);
  if (st.state === 'closed') return NextResponse.json({ error: 'Đã hết hạn nộp bài' }, { status: 403 });

  await sql`
    INSERT INTO submissions (assignment_id, username, content, submitted_at, is_late)
    VALUES (${aid}, ${session.username}, ${content}, now(), ${st.late})
    ON CONFLICT (assignment_id, username)
    DO UPDATE SET content = EXCLUDED.content, submitted_at = now(), is_late = EXCLUDED.is_late`;

  return NextResponse.json({ ok: true, late: st.late });
}
