import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { fmtVN, calcScore, LETTERS } from '@/lib/util';
import QuizSettings from '@/components/QuizSettings';
import QuestionManager from '@/components/QuestionManager';
import ResetAttemptButton from '@/components/ResetAttemptButton';
import QuizTaker from '@/components/QuizTaker';

export const dynamic = 'force-dynamic';

const toQuestion = (r) => ({
  id: r.id,
  text: r.text,
  imageUrl: r.has_image ? `/api/image/question/${r.id}` : null,
  opts: [r.opt_a, r.opt_b, r.opt_c, r.opt_d],
});

// lần làm có điểm cao nhất (hòa điểm thì lấy lần làm sớm hơn)
const bestOf = (list) => list.reduce((b, a) => (!b || a.correct > b.correct ? a : b), null);

export default async function QuizPage({ params }) {
  const s = await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const sql = await db();
  const quiz = (await sql`SELECT id, title, is_open, max_attempts FROM quizzes WHERE id = ${id}`)[0];
  if (!quiz) notFound();

  // ===== Admin =====
  if (s.isAdmin) {
    const rows = await sql`
      SELECT id, text, (image_data IS NOT NULL) AS has_image, opt_a, opt_b, opt_c, opt_d, correct
      FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id`;
    const attempts = await sql`
      SELECT id, username, correct, total, submitted_at
      FROM quiz_attempts WHERE quiz_id = ${id} ORDER BY submitted_at ASC`;
    const questions = rows.map((r) => ({ ...toQuestion(r), correct: r.correct }));

    const byUser = new Map();
    for (const a of attempts) {
      if (!byUser.has(a.username)) byUser.set(a.username, []);
      byUser.get(a.username).push(a);
    }
    const students = [...byUser.entries()].map(([username, list]) => ({ username, list, best: bestOf(list) }));

    return (
      <>
        <h1>{quiz.title}</h1>
        <QuizSettings quiz={{ id: quiz.id, title: quiz.title, isOpen: quiz.is_open, maxAttempts: quiz.max_attempts }} />

        <h2>Câu hỏi ({questions.length})</h2>
        <QuestionManager quizId={quiz.id} questions={questions} locked={attempts.length > 0} />

        <h2>Kết quả ({students.length} tài khoản)</h2>
        {students.length === 0 ? (
          <p className="muted">Chưa có ai làm bài.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Số lần làm</th>
                <th>Điểm cao nhất</th>
                <th>Điểm từng lần</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((u) => (
                <tr key={u.username}>
                  <td>
                    {u.username}
                    <div className="muted">Lần cuối: {fmtVN(u.list[u.list.length - 1].submitted_at)}</div>
                  </td>
                  <td>{u.list.length}/{quiz.max_attempts}</td>
                  <td>
                    <strong>{calcScore(u.best.correct, u.best.total)}/100</strong>
                    <div className="muted">đúng {u.best.correct}/{u.best.total}</div>
                  </td>
                  <td>{u.list.map((a) => calcScore(a.correct, a.total)).join(' · ')}</td>
                  <td><ResetAttemptButton attemptId={u.best.id} username={u.username} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }

  // ===== Sinh viên =====
  if (!quiz.is_open) notFound();

  const attempts = await sql`
    SELECT id, answers, correct, total, attempt_no, submitted_at FROM quiz_attempts
    WHERE quiz_id = ${id} AND username = ${s.username} ORDER BY attempt_no`;
  const used = attempts.length;
  const remaining = Math.max(0, quiz.max_attempts - used);
  const best = bestOf(attempts);

  const summary =
    used > 0 ? (
      <>
        <div className="card">
          <div>
            Điểm cao nhất: <strong>{calcScore(best.correct, best.total)}/100</strong>
            <span className="muted"> (đúng {best.correct}/{best.total} câu)</span>
          </div>
          <div className="muted">
            Đã làm {used}/{quiz.max_attempts} lần. Điểm của bạn được tính theo lần làm cao nhất.
          </div>
          <table style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Lần</th>
                <th>Đúng</th>
                <th>Điểm</th>
                <th>Nộp lúc</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{a.attempt_no}</td>
                  <td>{a.correct}/{a.total}</td>
                  <td>{calcScore(a.correct, a.total)}/100</td>
                  <td>{fmtVN(a.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ) : null;

  // Còn lượt: KHÔNG lấy cột correct để đáp án đúng không lọt xuống trình duyệt
  if (remaining > 0) {
    const rows = await sql`
      SELECT id, text, (image_data IS NOT NULL) AS has_image, opt_a, opt_b, opt_c, opt_d
      FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id`;
    return (
      <>
        <h1>{quiz.title}</h1>
        {summary}
        {rows.length === 0 ? (
          <p className="muted">Bài này chưa có câu hỏi.</p>
        ) : (
          <>
            <p className="muted">
              Gồm {rows.length} câu. Bạn được làm tối đa {quiz.max_attempts} lần (còn {remaining} lần).
              {used > 0 ? ' Đáp án đúng sẽ hiển thị khi bạn dùng hết lượt làm bài.' : ' Sau khi hết lượt làm bài, bạn sẽ thấy đáp án đúng của từng câu.'}
            </p>
            <QuizTaker
              key={used}
              quizId={quiz.id}
              username={s.username}
              questions={rows.map(toQuestion)}
              previousCount={used}
              maxAttempts={quiz.max_attempts}
            />
          </>
        )}
      </>
    );
  }

  // Hết lượt: hiện đáp án đúng, đối chiếu với lần làm có điểm cao nhất
  const rows = await sql`
    SELECT id, text, (image_data IS NOT NULL) AS has_image, opt_a, opt_b, opt_c, opt_d, correct
    FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id`;
  const answers = best.answers || {};

  return (
    <>
      <h1>{quiz.title}</h1>
      {summary}
      <h2>Đáp án (đối chiếu với lần làm {best.attempt_no}, lần có điểm cao nhất)</h2>
      {rows.map((r, i) => {
        const q = toQuestion(r);
        const mine = answers[r.id];
        const ok = mine === r.correct;
        return (
          <div className="card" key={r.id}>
            <div className="row">
              <strong>Câu {i + 1}</strong>
              <span className={ok ? 'tag' : 'tag late'}>{ok ? 'Đúng' : mine ? 'Sai' : 'Chưa chọn'}</span>
            </div>
            {q.text && <p className="note">{q.text}</p>}
            {q.imageUrl && <img className="qimg" src={q.imageUrl} alt={`Hình câu ${i + 1}`} loading="lazy" />}
            <ul className="plain">
              {LETTERS.map((L, k) => (
                <li key={L} className={L === r.correct ? 'right' : L === mine ? 'wrong' : ''}>
                  {L}. {q.opts[k]}
                  {L === r.correct && ' (đáp án đúng)'}
                  {L === mine && ' (bạn chọn)'}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
