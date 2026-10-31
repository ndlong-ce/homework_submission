// File này dùng được cả ở server lẫn trình duyệt (không import module Node).

// ===== CẤU HÌNH NỘP BÀI: sửa tại đây =====
export const ALLOWED_EXT = ['.cpp', '.c', '.h', '.py'];
export const MAX_SIZE = 5 * 1024 * 1024; // 5MB / file
export const MAX_FILES = 10; // số file tối đa mỗi lần nộp
export const LATE_MS = 24 * 60 * 60 * 1000; // được nộp trễ tối đa 24h
// =========================================

export const STATEMENT_EXT = ['.docx', '.doc'];

export function extOf(name) {
  const s = String(name || '');
  const i = s.lastIndexOf('.');
  return i < 0 ? '' : s.slice(i).toLowerCase();
}

// tên an toàn dùng trong đường dẫn blob
export function safe(s) {
  return String(s).replace(/[^A-Za-z0-9._-]/g, '_').slice(-100);
}

// open: còn hạn | late: quá hạn nhưng trong 24h (đánh dấu trễ) | closed: đã đóng
export function submissionState(deadline, now = Date.now()) {
  const d = new Date(deadline).getTime();
  if (now <= d) return { state: 'open', late: false };
  if (now <= d + LATE_MS) return { state: 'late', late: true };
  return { state: 'closed', late: true };
}

export function fmtVN(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// "YYYY-MM-DDTHH:mm" theo giờ Việt Nam, dùng cho <input type="datetime-local">
export function toInputVN(d) {
  return new Date(new Date(d).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 16);
}

export function fmtSize(n) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function isBlobUrl(u, pathPrefix) {
  try {
    const x = new URL(u);
    return (
      x.protocol === 'https:' &&
      x.hostname.endsWith('.public.blob.vercel-storage.com') &&
      x.pathname.startsWith(pathPrefix)
    );
  } catch {
    return false;
  }
}

// ===== TRẮC NGHIỆM =====
export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
export const LETTERS = ['A', 'B', 'C', 'D'];

// Điểm trên thang 100 = số câu đúng / tổng số câu * 100 (làm tròn 1 chữ số thập phân)
export function calcScore(correct, total) {
  return total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
}
