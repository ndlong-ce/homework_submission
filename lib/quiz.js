import { LETTERS } from '@/lib/util';
import { parseImage } from '@/lib/imageData';

export function parseQuestion(b) {
  const text = String(b?.text || '').trim().slice(0, 3000);
  const opts = [0, 1, 2, 3].map((i) => String(b?.opts?.[i] || '').trim().slice(0, 500));
  const correct = String(b?.correct || '').toUpperCase();
  if (!LETTERS.includes(correct)) return { error: 'Chưa chọn đáp án đúng' };
  const img = parseImage(b?.image);
  if (img.error) return { error: img.error };
  return { text, opts, correct, image: img.image, removeImage: !!b?.removeImage };
}

export async function hasAttempts(sql, quizId) {
  const r = await sql`SELECT 1 FROM quiz_attempts WHERE quiz_id = ${quizId} LIMIT 1`;
  return r.length > 0;
}

export const LOCKED_MSG = 'Đã có người nộp bài nên không thể thêm, sửa hoặc xóa câu hỏi. Hãy xóa kết quả của các tài khoản trong bảng kết quả trước.';
