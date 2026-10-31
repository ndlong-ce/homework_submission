import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { fmtVN, fmtSize, submissionState, LATE_MS } from '@/lib/util';
import SubmitBox from '@/components/SubmitBox';
import GradeForm from '@/components/GradeForm';

export const dynamic = 'force-dynamic';

export default async function AssignmentPage({ params }) {
  const s = await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const sql = await db();
  const a = (await sql`SELECT id, title, note, deadline, doc_name FROM assignments WHERE id = ${id}`)[0];
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
      {a.doc_name && (
        <p>
          Đề bài: <a href={`/api/download/statement/${a.id}`}>{a.doc_name}</a>
        </p>
      )}
    </>
  );

  // ===== Admin =====
  if (s.isAdmin) {
    const subs = await sql`
      SELECT id, username, submitted_at, is_late, grade, feedback
      FROM submissions WHERE assignment_id = ${id} ORDER BY submitted_at DESC`;
    const files = await sql`
      SELECT f.id, f.submission_id, f.name, f.size
      FROM submission_files f JOIN submissions x ON x.id = f.submission_id
      WHERE x.assignment_id = ${id} ORDER BY f.id`;

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
                <th>File</th>
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
                  <td>
                    <ul className="files">
                      {files.filter((f) => f.submission_id === x.id).map((f) => (
                        <li key={f.id}>
                          <a href={`/api/download/file/${f.id}`}>{f.name}</a>{' '}
                          <span className="muted">({fmtSize(f.size)})</span>
                        </li>
                      ))}
                    </ul>
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
    await sql`SELECT id, submitted_at, is_late, grade, feedback FROM submissions
              WHERE assignment_id = ${id} AND username = ${s.username}`
  )[0];
  const myFiles = mine
    ? await sql`SELECT id, name, size FROM submission_files WHERE submission_id = ${mine.id} ORDER BY id`
    : [];

  return (
    <>
      {header}
      <h2>Bài nộp của bạn</h2>
      {mine ? (
        <div>
          <p className="muted">
            Nộp lúc {fmtVN(mine.submitted_at)} {mine.is_late && <span className="tag late">Nộp trễ</span>}
          </p>
          <ul className="files">
            {myFiles.map((f) => (
              <li key={f.id}>
                <a href={`/api/download/file/${f.id}`}>{f.name}</a> <span className="muted">({fmtSize(f.size)})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">Bạn chưa nộp bài.</p>
      )}

      {st.state !== 'closed' && (
        <SubmitBox assignmentId={a.id} username={s.username} willBeLate={st.late} hasSubmission={!!mine} />
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
