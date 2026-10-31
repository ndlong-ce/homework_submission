import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { ALLOWED_EXT, IMAGE_EXT, MAX_SIZE, STATEMENT_EXT, extOf, safe, submissionState } from '@/lib/util';

// Cấp token để trình duyệt upload thẳng lên Vercel Blob (tránh giới hạn body 4.5MB của Vercel).
export async function POST(request) {
  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession();
        if (!session) throw new Error('Chưa đăng nhập');
        const p = JSON.parse(clientPayload || '{}');
        const ext = extOf(pathname);

        if (p.kind === 'statement') {
          if (!session.isAdmin) throw new Error('Không có quyền');
          if (!STATEMENT_EXT.includes(ext) || !pathname.startsWith('statements/')) {
            throw new Error('Đề bài phải là file Word (.docx)');
          }
          return { maximumSizeInBytes: 20 * 1024 * 1024 };
        }

        if (p.kind === 'question') {
          if (!session.isAdmin) throw new Error('Không có quyền');
          if (!IMAGE_EXT.includes(ext) || !pathname.startsWith('questions/')) {
            throw new Error('Ảnh câu hỏi phải là png, jpg, webp hoặc gif');
          }
          return { maximumSizeInBytes: MAX_SIZE };
        }

        if (session.isAdmin) throw new Error('Tài khoản admin không nộp bài');
        const aid = Number(p.assignmentId);
        if (!Number.isInteger(aid)) throw new Error('Bài tập không hợp lệ');
        if (!ALLOWED_EXT.includes(ext)) throw new Error('Định dạng file không được phép');
        if (!pathname.startsWith(`submissions/${aid}/${safe(session.username)}/`)) {
          throw new Error('Đường dẫn không hợp lệ');
        }
        const sql = await db();
        const rows = await sql`SELECT deadline FROM assignments WHERE id = ${aid}`;
        if (!rows.length) throw new Error('Không tìm thấy bài tập');
        if (submissionState(rows[0].deadline).state === 'closed') throw new Error('Đã hết hạn nộp bài');
        return { maximumSizeInBytes: MAX_SIZE };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
