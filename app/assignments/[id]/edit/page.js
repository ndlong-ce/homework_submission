import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { toInputVN } from '@/lib/util';
import AssignmentForm from '@/components/AssignmentForm';

export const dynamic = 'force-dynamic';

export default async function EditAssignment({ params }) {
  await requireAdmin();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const sql = await db();
  const a = (
    await sql`SELECT id, title, note, deadline, (image_data IS NOT NULL) AS has_image FROM assignments WHERE id = ${id}`
  )[0];
  if (!a) notFound();
  return (
    <AssignmentForm
      initial={{ id: a.id, title: a.title, note: a.note, deadline: toInputVN(a.deadline), hasImage: a.has_image }}
    />
  );
}
