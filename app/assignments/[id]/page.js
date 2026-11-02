import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { fmtVN, submissionState, LATE_MS } from '@/lib/util';
import SubmitText from '@/components/SubmitText';
import GradeForm from '@/components/GradeForm';

export const dynamic = 'force-dynamic';

const lineCount = (t) => (t ? t.split('\n').length : 0);

export default async function AssignmentPage({ params }) {
  const s = await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const sql = await db();
  const a = (
    await sql`SELECT id, title, note, deadline, (image_data IS NOT NULL) AS has_image FROM assignments WHERE id = ${id}`
  )[0];
  if (!a) notFound();

  const st = submissionState(a.deadline);
  const stateMsg =
    st.state === 'open'
      ? 'Còn hạn nộp.'
      : st.state === 'late'
        ? `Đã quá hạn. Vẫn nhận bài đến ${fmtVN(new Date(a.deadline).getTime() + LATE_MS)}, bài nộp sẽ bị đánh dấu trễ.`
        : 'Đã đóng nộp bài.';

  const header = (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>{a.title}</h1>
        {s.isAdmin && <Link href={`/assignments/${a.id}/edit`} className="btn ghost">Sửa</Link>}
      </div>
      <p className="muted">Hạn nộp: {fmtVN(a.deadline)}. {stateMsg}</p>
      {a.note && <p className="note">{a.note}</p>}
      {a.has_image && <img className="qimg" src={`/api/image/assignment/${a.id}`} alt="Hình đề bài" />}
    </>
  );

  // ===== Admin =====
  if (s.isAdmin) {
    const subs = await sql`
      SELECT id, username, content, submitted_at, is_late, grade, feedback
      FROM submissions WHERE assignment_id = ${id} ORDER BY submitted_at DESC`;

    return (
      <>
        {header}
        <h2>Bài nộp ({subs.length})</h2>
        {subs.length === 0 ? (
          <p className="muted">Chưa có ai nộp bài.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Bài làm</th>
                <th>Điểm và nhận xét</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((x) => (
                <tr key={x.id}>
                  <td>
                    {x.username}
                    <div className="muted">{fmtVN(x.submitted_at)}</div>
                    {x.is_late && <span className="tag late">Nộp trễ</span>}
                  </td>
                  <td style={{ maxWidth: 420 }}>
                    {x.content ? (
                      <details>
                        <summary>Xem bài làm ({lineCount(x.content)} dòng)</summary>
                        <pre className="code">{x.content}</pre>
                      </details>
                    ) : (
                      <span className="muted">(không có nội dung)</span>
                    )}
                    {x.content && <a href={`/api/download/text/${x.id}`}>Tải về (.txt)</a>}
                  </td>
                  <td style={{ minWidth: 260 }}>
                    <GradeForm submissionId={x.id} initialGrade={x.grade} initialFeedback={x.feedback} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }

  // ===== Sinh viên =====
  const mine = (
    await sql`SELECT id, content, submitted_at, is_late, grade, feedback FROM submissions
              WHERE assignment_id = ${id} AND username = ${s.username}`
  )[0];

  return (
    <>
      {header}
      <h2>Bài làm của bạn</h2>
      {mine && (
        <p className="muted">
          Nộp lúc {fmtVN(mine.submitted_at)} {mine.is_late && <span className="tag late">Nộp trễ</span>}
        </p>
      )}

      {st.state !== 'closed' ? (
        <SubmitText assignmentId={a.id} initialContent={mine?.content || ''} willBeLate={st.late} hasSubmission={!!mine} />
      ) : mine?.content ? (
        <pre className="code">{mine.content}</pre>
      ) : (
        <p className="muted">Bạn chưa nộp bài.</p>
      )}

      {mine && (mine.grade != null || mine.feedback) && (
        <>
          <h2>Kết quả</h2>
          <div className="card">
            <div>Điểm: <strong>{mine.grade != null ? `${mine.grade}/100` : 'Chưa chấm'}</strong></div>
            {mine.feedback && <p className="note">{mine.feedback}</p>}
          </div>
        </>
      )}
    </>
  );
}
