import { del } from '@vercel/blob';

export async function removeBlobs(urls) {
  const list = (urls || []).filter(Boolean);
  if (!list.length) return;
  try {
    await del(list);
  } catch (e) {
    console.error('Không xóa được blob:', e);
  }
}
