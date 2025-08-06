import { getUserServer } from '@/app/actions/user'
import { notFound } from 'next/navigation'
import { ClientForm } from '@/components/clients/client-form'

export default async function NewClientPage() {
  const user = await getUserServer()
  
  if (!user) {
    notFound()
  }

  return (
    <div className="animate-in">
      <ClientForm userId={user.id} mode="create" />
    </div>
  )
}