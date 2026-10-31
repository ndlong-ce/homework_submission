import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { removeBlobs } from '@/lib/blob';
import { parseQuestion, hasAttempts, LOCKED_MSG } from '@/lib/quiz';

async function guard(params) {
  const session = await getSession();
  if (!session?.isAdmin) return { res: NextResponse.json({ error: 'Không có quyền' }, { status: 403 }) };
  const quizId = Number(params.id);
  const qid = Number(params.qid);
  if (!Number.isInteger(quizId) || !Number.isInteger(qid)) {
    return { res: NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 }) };
  }
  const sql = await db();
  const cur = (await sql`SELECT image_url FROM quiz_questions WHERE id = ${qid} AND quiz_id = ${quizId}`)[0];
  if (!cur) return { res: NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 }) };
  if (await hasAttempts(sql, quizId)) return { res: NextResponse.json({ error: LOCKED_MSG }, { status: 409 }) };
  return { sql, quizId, qid, cur };
}

export async function PUT(req, { params }) {
  const g = await guard(params);
  if (g.res) return g.res;
  const p = parseQuestion(await req.json().catch(() => ({})));
  if (p.error) return NextResponse.json({ error: p.error }, { status: 400 });
  const finalImage = p.imageUrl || (p.removeImage ? null : g.cur.image_url);
  if (!p.text && !finalImage) return NextResponse.json({ error: 'Câu hỏi cần có chữ hoặc ảnh' }, { status: 400 });

  await g.sql`
    UPDATE quiz_questions SET
      text = ${p.text}, image_url = ${finalImage}::text,
      opt_a = ${p.opts[0]}, opt_b = ${p.opts[1]}, opt_c = ${p.opts[2]}, opt_d = ${p.opts[3]},
      correct = ${p.correct}
    WHERE id = ${g.qid}`;
  if (g.cur.image_url && g.cur.image_url !== finalImage) await removeBlobs([g.cur.image_url]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const g = await guard(params);
  if (g.res) return g.res;
  await g.sql`DELETE FROM quiz_questions WHERE id = ${g.qid}`;
  await removeBlobs([g.cur.image_url]);
  return NextResponse.json({ ok: true });
}
