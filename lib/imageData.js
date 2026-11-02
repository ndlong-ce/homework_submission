import { MAX_IMAGE_B64 } from '@/lib/util';

// Chỉ nhận JPEG (trình duyệt đã nén sang JPEG), nên luôn phục vụ lại với image/jpeg.
export function parseImage(data) {
  if (data == null || data === '') return { image: null };
  const s = String(data);
  if (!s.startsWith('/9j/') || s.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) {
    return { error: 'Ảnh không hợp lệ hoặc quá lớn' };
  }
  return { image: s };
}
