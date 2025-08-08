import { SessionList } from "@/components/sessions/session-list";
import { getUserServer } from '@/app/actions/user';
import { notFound } from 'next/navigation';

export default async function SessionsPage() {
  const user = await getUserServer();
  
  if (!user) {
    notFound();
  }
  
  return (
    <div className="animate-in">
      <SessionList userId={user.id} />
    </div>
  );
}