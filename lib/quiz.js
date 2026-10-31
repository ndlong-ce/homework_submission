import { isBlobUrl, extOf, IMAGE_EXT, LETTERS } from '@/lib/util';

export function parseQuestion(b) {
  const text = String(b?.text || '').trim().slice(0, 3000);
  const opts = [0, 1, 2, 3].map((i) => String(b?.opts?.[i] || '').trim().slice(0, 500));
  const correct = String(b?.correct || '').toUpperCase();
  if (!LETTERS.includes(correct)) return { error: 'Chưa chọn đáp án đúng' };
  let imageUrl = null;
  if (b?.imageUrl) {
    let ext = '';
    try {
      ext = extOf(new URL(b.imageUrl).pathname);
    } catch {}
    if (!IMAGE_EXT.includes(ext) || !isBlobUrl(b.imageUrl, '/questions/')) return { error: 'Ảnh không hợp lệ' };
    imageUrl = b.imageUrl;
  }
  return { text, opts, correct, imageUrl, removeImage: !!b?.removeImage };
}

export async function hasAttempts(sql, quizId) {
  const r = await sql`SELECT 1 FROM quiz_attempts WHERE quiz_id = ${quizId} LIMIT 1`;
  return r.length > 0;
}

export const LOCKED_MSG = 'Đã có người nộp bài nên không thể thêm, sửa hoặc xóa câu hỏi. Hãy xóa lượt làm bài trong bảng kết quả trước.';
