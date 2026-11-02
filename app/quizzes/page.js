import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { calcScore } from '@/lib/util';
import QuizCreate from '@/components/QuizCreate';

export const dynamic = 'force-dynamic';

export default async function QuizzesPage() {
  const s = await requireSession();
  const sql = await db();

  const rows = s.isAdmin
    ? await sql`
        SELECT q.id, q.title, q.is_open,
          (SELECT count(*)::int FROM quiz_questions x WHERE x.quiz_id = q.id) AS n,
          (SELECT count(*)::int FROM quiz_attempts t WHERE t.quiz_id = q.id) AS attempts
        FROM quizzes q ORDER BY q.id DESC`
    : await sql`
        SELECT q.id, q.title, q.max_attempts,
          (SELECT count(*)::int FROM quiz_questions x WHERE x.quiz_id = q.id) AS n,
          (SELECT count(*)::int FROM quiz_attempts t WHERE t.quiz_id = q.id AND t.username = ${s.username}) AS used,
          (SELECT max(t.correct)::int FROM quiz_attempts t WHERE t.quiz_id = q.id AND t.username = ${s.username}) AS best,
          (SELECT max(t.total)::int FROM quiz_attempts t WHERE t.quiz_id = q.id AND t.username = ${s.username}) AS total
        FROM quizzes q
        WHERE q.is_open ORDER BY q.id DESC`;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Trắc nghiệm</h1>
        {s.isAdmin && <QuizCreate />}
      </div>

      {rows.length === 0 ? (
        <p className="muted">{s.isAdmin ? 'Chưa có bài trắc nghiệm nào. Bấm "Tạo bài trắc nghiệm" để tạo.' : 'Chưa có bài trắc nghiệm nào.'}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Bài</th>
              <th>Số câu</th>
              {s.isAdmin ? (
                <>
                  <th>Trạng thái</th>
                  <th>Lượt làm</th>
                </>
              ) : (
                <th>Kết quả</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/quizzes/${r.id}`}>{r.title}</Link></td>
                <td>{r.n}</td>
                {s.isAdmin ? (
                  <>
                    <td><span className={r.is_open ? 'tag' : 'tag late'}>{r.is_open ? 'Đang mở' : 'Đang ẩn'}</span></td>
                    <td>{r.attempts}</td>
                  </>
                ) : (
                  <td>
                    {r.used > 0 ? (
                      <>
                        {calcScore(r.best, r.total)}/100 <span className="muted">(cao nhất) · đã làm {r.used}/{r.max_attempts} lần</span>
                      </>
                    ) : (
                      <span className="tag">Chưa làm · tối đa {r.max_attempts} lần</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
