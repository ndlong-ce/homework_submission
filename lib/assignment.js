import { isBlobUrl, extOf, STATEMENT_EXT } from '@/lib/util';

export function parseAssignment(b) {
  const title = String(b?.title || '').trim().slice(0, 200);
  const note = String(b?.note || '').slice(0, 5000);
  const t = new Date(b?.deadline);
  if (!title) return { error: 'Thiếu tiêu đề' };
  if (isNaN(t.getTime())) return { error: 'Deadline không hợp lệ' };
  let docName = null;
  let docUrl = null;
  if (b?.docUrl) {
    const okName = STATEMENT_EXT.includes(extOf(String(b.docName || '')));
    if (!okName || !isBlobUrl(b.docUrl, '/statements/')) return { error: 'File đề bài không hợp lệ' };
    docName = String(b.docName).slice(0, 200);
    docUrl = b.docUrl;
  }
  return { title, note, deadline: t.toISOString(), docName, docUrl };
}
