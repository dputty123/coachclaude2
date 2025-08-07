'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getClients, 
  getClient, 
  createClient, 
  updateClient, 
  deleteClient,
  addTeamMember,
  removeTeamMember,
  createClientNote,
  updateClientNote,
  deleteClientNote
} from '@/app/actions/clients'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Type for client form data
export type ClientFormData = {
  name: string
  role?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  birthday?: string | null
  coachingSince?: string | null
  careerGoal?: string | null
  keyChallenge?: string | null
  keyStakeholders?: string | null
  reportsToId?: string | null
}

// Hook to fetch all clients
export function useClients(userId: string) {
  return useQuery({
    queryKey: ['clients', userId],
    queryFn: async () => {
      const result = await getClients(userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a single client
export function useClient(id: string, userId: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const result = await getClient(id, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (keep in cache)
    enabled: !!id && !!userId,
  })
}

// Hook to create a new client
export function useCreateClient() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ data, userId }: { data: ClientFormData, userId: string }) => {
      const result = await createClient(data, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (client, variables) => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: ['clients', variables.userId] })
      toast.success('Client created successfully')
      // Navigate to the new client's page
      if (client) {
        router.push(`/clients/${client.id}`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create client')
    },
  })
}

// Hook to update a client
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data, 
      userId 
    }: { 
      id: string, 
      data: ClientFormData, 
      userId: string 
    }) => {
      const result = await updateClient(id, data, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['client', id] })

      // Snapshot the previous value
      const previousClient = queryClient.getQueryData(['client', id])

      // Optimistically update to the new value
      queryClient.setQueryData(['client', id], (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        return {
          ...old,
          ...data,
        }
      })

      // Return a context object with the snapshotted value
      return { previousClient }
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousClient) {
        queryClient.setQueryData(['client', variables.id], context.previousClient)
      }
      toast.error(error.message || 'Failed to update client')
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.userId] })
      toast.success('Client updated successfully')
    },
  })
}

// Hook to delete a client
export function useDeleteClient() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
      const result = await deleteClient(id, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', variables.userId] })
      toast.success('Client deleted successfully')
      router.push('/clients')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete client')
    },
  })
}

// Hook to add a team member
export function useAddTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      memberId, 
      userId 
    }: { 
      clientId: string, 
      memberId: string, 
      userId: string 
    }) => {
      const result = await addTeamMember(clientId, memberId, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] })
      queryClient.invalidateQueries({ queryKey: ['client', variables.memberId] })
      toast.success('Team member added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add team member')
    },
  })
}

// Hook to remove a team member
export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      memberId, 
      userId 
    }: { 
      clientId: string, 
      memberId: string, 
      userId: string 
    }) => {
      const result = await removeTeamMember(clientId, memberId, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] })
      queryClient.invalidateQueries({ queryKey: ['client', variables.memberId] })
      toast.success('Team member removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove team member')
    },
  })
}

// Hook to create a client note
export function useCreateClientNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      content, 
      userId 
    }: { 
      clientId: string, 
      content: string, 
      userId: string 
    }) => {
      const result = await createClientNote(clientId, content, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] })
      toast.success('Note added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add note')
    },
  })
}

// Hook to update a client note
export function useUpdateClientNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      noteId, 
      content, 
      userId,
      clientId // eslint-disable-line @typescript-eslint/no-unused-vars
    }: { 
      noteId: string, 
      content: string, 
      userId: string,
      clientId: string 
    }) => {
      const result = await updateClientNote(noteId, content, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] })
      toast.success('Note updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update note')
    },
  })
}

// Hook to delete a client note
export function useDeleteClientNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      noteId, 
      userId,
      clientId // eslint-disable-line @typescript-eslint/no-unused-vars
    }: { 
      noteId: string, 
      userId: string,
      clientId: string 
    }) => {
      const result = await deleteClientNote(noteId, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] })
      toast.success('Note deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete note')
    },
  })
}