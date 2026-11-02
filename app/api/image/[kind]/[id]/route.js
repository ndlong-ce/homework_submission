import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Trả ảnh (lưu dạng base64 trong database). Cần đăng nhập.
export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return new Response('Chưa đăng nhập', { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return new Response('Không hợp lệ', { status: 400 });
  const sql = await db();

  let data = null;
  if (params.kind === 'assignment') {
    data = (await sql`SELECT image_data FROM assignments WHERE id = ${id}`)[0]?.image_data;
  } else if (params.kind === 'question') {
    const r = (
      await sql`SELECT q.image_data, z.is_open FROM quiz_questions q JOIN quizzes z ON z.id = q.quiz_id WHERE q.id = ${id}`
    )[0];
    if (r && (session.isAdmin || r.is_open)) data = r.image_data;
  }
  if (!data) return new Response('Không tìm thấy', { status: 404 });

  const etag = `"${crypto.createHash('md5').update(data).digest('hex')}"`;
  const headers = { ETag: etag, 'Cache-Control': 'private, no-cache', 'X-Content-Type-Options': 'nosniff' };
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return new Response(Buffer.from(data, 'base64'), { headers: { ...headers, 'Content-Type': 'image/jpeg' } });
}
