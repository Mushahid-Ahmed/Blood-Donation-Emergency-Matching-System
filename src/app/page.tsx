import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

export default async function IndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Redirect to respective dashboard depending on role
  const role = session.user.role.toLowerCase();
  redirect(`/${role}`);
}
