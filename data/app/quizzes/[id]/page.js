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
  imageUrl: r.image_url,
  opts: [r.opt_a, r.opt_b, r.opt_c, r.opt_d],
});

export default async function QuizPage({ params }) {
  const s = await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const sql = await db();
  const quiz = (await sql`SELECT id, title, is_open FROM quizzes WHERE id = ${id}`)[0];
  if (!quiz) notFound();

  // ===== Admin =====
  if (s.isAdmin) {
    const rows = await sql`
      SELECT id, text, image_url, opt_a, opt_b, opt_c, opt_d, correct
      FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id`;
    const attempts = await sql`
      SELECT id, username, correct, total, submitted_at
      FROM quiz_attempts WHERE quiz_id = ${id} ORDER BY submitted_at DESC`;
    const questions = rows.map((r) => ({ ...toQuestion(r), correct: r.correct }));

    return (
      <>
        <h1>{quiz.title}</h1>
        <QuizSettings quiz={{ id: quiz.id, title: quiz.title, isOpen: quiz.is_open }} />

        <h2>Câu hỏi ({questions.length})</h2>
        <QuestionManager quizId={quiz.id} questions={questions} locked={attempts.length > 0} />

        <h2>Kết quả ({attempts.length})</h2>
        {attempts.length === 0 ? (
          <p className="muted">Chưa có ai làm bài.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Đúng</th>
                <th>Điểm</th>
                <th>Nộp lúc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{a.username}</td>
                  <td>{a.correct}/{a.total}</td>
                  <td>{calcScore(a.correct, a.total)}/100</td>
                  <td>{fmtVN(a.submitted_at)}</td>
                  <td><ResetAttemptButton attemptId={a.id} username={a.username} /></td>
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

  const attempt = (
    await sql`SELECT id, answers, correct, total, submitted_at FROM quiz_attempts
              WHERE quiz_id = ${id} AND username = ${s.username}`
  )[0];

  // Chưa làm: KHÔNG lấy cột correct để đáp án đúng không lọt xuống trình duyệt
  if (!attempt) {
    const rows = await sql`
      SELECT id, text, image_url, opt_a, opt_b, opt_c, opt_d
      FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id`;
    return (
      <>
        <h1>{quiz.title}</h1>
        {rows.length === 0 ? (
          <p className="muted">Bài này chưa có câu hỏi.</p>
        ) : (
          <>
            <p className="muted">Gồm {rows.length} câu. Bạn chỉ được nộp bài một lần; sau khi nộp sẽ thấy đáp án đúng và điểm.</p>
            <QuizTaker quizId={quiz.id} username={s.username} questions={rows.map(toQuestion)} />
          </>
        )}
      </>
    );
  }

  // Đã làm: hiện điểm và đáp án đúng của từng câu
  const rows = await sql`
    SELECT id, text, image_url, opt_a, opt_b, opt_c, opt_d, correct
    FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id`;
  const answers = attempt.answers || {};

  return (
    <>
      <h1>{quiz.title}</h1>
      <div className="card">
        <div>
          Điểm: <strong>{calcScore(attempt.correct, attempt.total)}/100</strong>
          <span className="muted"> (đúng {attempt.correct}/{attempt.total} câu)</span>
        </div>
        <div className="muted">Nộp lúc {fmtVN(attempt.submitted_at)}</div>
      </div>

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
