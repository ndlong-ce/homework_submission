import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { fmtVN, submissionState } from '@/lib/util';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const s = await requireSession();
  const sql = await db();

  const rows = s.isAdmin
    ? await sql`
        SELECT a.id, a.title, a.deadline,
          (SELECT count(*)::int FROM submissions x WHERE x.assignment_id = a.id) AS total,
          (SELECT count(*)::int FROM submissions x WHERE x.assignment_id = a.id AND x.grade IS NOT NULL) AS graded
        FROM assignments a ORDER BY a.deadline DESC`
    : await sql`
        SELECT a.id, a.title, a.deadline, x.submitted_at, x.is_late, x.grade
        FROM assignments a
        LEFT JOIN submissions x ON x.assignment_id = a.id AND x.username = ${s.username}
        ORDER BY a.deadline DESC`;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Bài tập</h1>
        {s.isAdmin && <Link href="/assignments/new" className="btn">Đăng bài tập</Link>}
      </div>

      {rows.length === 0 ? (
        <p className="muted">{s.isAdmin ? 'Chưa có bài tập nào. Bấm "Đăng bài tập" để tạo.' : 'Chưa có bài tập nào.'}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Bài tập</th>
              <th>Hạn nộp</th>
              {s.isAdmin ? (
                <>
                  <th>Đã nộp</th>
                  <th>Đã chấm</th>
                </>
              ) : (
                <>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = submissionState(r.deadline).state;
              return (
                <tr key={r.id}>
                  <td><Link href={`/assignments/${r.id}`}>{r.title}</Link></td>
                  <td>{fmtVN(r.deadline)}</td>
                  {s.isAdmin ? (
                    <>
                      <td>{r.total}</td>
                      <td>{r.graded}</td>
                    </>
                  ) : (
                    <>
                      <td>
                        {r.submitted_at ? (
                          <span className={r.is_late ? 'tag late' : 'tag'}>{r.is_late ? 'Đã nộp (trễ)' : 'Đã nộp'}</span>
                        ) : (
                          <span className="tag">{st === 'closed' ? 'Đã đóng' : 'Chưa nộp'}</span>
                        )}
                      </td>
                      <td>{r.grade != null ? `${r.grade}/100` : '—'}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
