import { requireAdmin } from '@/lib/auth';
import AssignmentForm from '@/components/AssignmentForm';

export const dynamic = 'force-dynamic';

export default async function NewAssignment() {
  await requireAdmin();
  return <AssignmentForm initial={null} />;
}
