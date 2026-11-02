import { parseImage } from '@/lib/imageData';

export function parseAssignment(b) {
  const title = String(b?.title || '').trim().slice(0, 200);
  const note = String(b?.note || '').trim().slice(0, 20000);
  const t = new Date(b?.deadline);
  if (!title) return { error: 'Thiếu tiêu đề' };
  if (isNaN(t.getTime())) return { error: 'Deadline không hợp lệ' };
  const img = parseImage(b?.image);
  if (img.error) return { error: img.error };
  return { title, note, deadline: t.toISOString(), image: img.image, removeImage: !!b?.removeImage };
}
