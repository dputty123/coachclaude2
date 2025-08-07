'use client'

import { useClient } from '@/hooks/use-clients'
import { ClientDetail } from './client-detail'
import ClientDetailsLoading from '@/app/clients/[id]/loading'

interface ClientDetailWrapperProps {
  clientId: string
  userId: string
}

export function ClientDetailWrapper({ clientId, userId }: ClientDetailWrapperProps) {
  const { data: client, isLoading } = useClient(clientId, userId)
  
  if (isLoading) {
    return <ClientDetailsLoading />
  }
  
  if (!client) {
    return <div>Client not found</div>
  }
  
  return <ClientDetail client={client} userId={userId} />
}