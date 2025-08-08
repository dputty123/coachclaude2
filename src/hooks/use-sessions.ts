'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getSessions, 
  getSession,
  getClientSessions,
  createSession, 
  updateSession, 
  deleteSession,
  updateSessionTags,
  getSessionTags
} from '@/app/actions/sessions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Type for session form data
export type SessionFormData = {
  title: string
  clientId: string
  date: string
  transcript?: string | null
}

// Type for session with includes (matching what getSessions returns)
type SessionWithIncludes = {
  id: string
  title: string
  clientId: string
  date: Date | null
  transcript: string | null
  client: {
    id: string
    name: string
  }
  tags?: Array<{
    tag: {
      id: string
      name: string
    }
  }>
  _count?: {
    resources: number
  }
}

// Hook to fetch all sessions
export function useSessions(userId: string) {
  return useQuery({
    queryKey: ['sessions', userId],
    queryFn: async () => {
      const result = await getSessions(userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch sessions for a specific client
export function useClientSessions(clientId: string, userId: string) {
  return useQuery({
    queryKey: ['sessions', 'client', clientId],
    queryFn: async () => {
      const result = await getClientSessions(clientId, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!clientId && !!userId,
  })
}

// Hook to fetch a single session
export function useSession(id: string, userId: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const result = await getSession(id, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id && !!userId,
  })
}

// Hook to create a new session
export function useCreateSession() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ data, userId }: { data: SessionFormData, userId: string }) => {
      const result = await createSession(data, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (session, variables) => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.userId] })
      // Invalidate client sessions if this session belongs to a client
      if (session?.clientId) {
        queryClient.invalidateQueries({ queryKey: ['sessions', 'client', session.clientId] })
        queryClient.invalidateQueries({ queryKey: ['client', session.clientId] })
      }
      toast.success('Session created successfully')
      // Navigate to session detail
      if (session?.id) {
        router.push(`/sessions/${session.id}`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create session')
    }
  })
}

// Hook to update a session
export function useUpdateSession() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data, 
      userId 
    }: { 
      id: string
      data: Partial<SessionFormData & {
        summary?: string | null
        followUpEmail?: string | null
        analysis?: string | null
        preparationNotes?: string | null
      }>
      userId: string 
    }) => {
      const result = await updateSession(id, data, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['session', id] })
      
      // Snapshot the previous value
      const previousSession = queryClient.getQueryData(['session', id])
      
      // Optimistically update
      queryClient.setQueryData(['session', id], (old) => 
        old ? { ...old, ...data } : old
      )
      
      return { previousSession }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(['session', variables.id], context.previousSession)
      }
      toast.error(error.message || 'Failed to update session')
    },
    onSuccess: (session, variables) => {
      if (session?.id) {
        queryClient.invalidateQueries({ queryKey: ['session', session.id] })
      }
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.userId] })
      if (session?.clientId) {
        queryClient.invalidateQueries({ queryKey: ['sessions', 'client', session.clientId] })
        queryClient.invalidateQueries({ queryKey: ['client', session.clientId] })
      }
      toast.success('Session updated successfully')
      // Navigate back to session detail
      if (session?.id) {
        router.push(`/sessions/${session.id}`)
      }
    }
  })
}

// Hook to delete a session
export function useDeleteSession() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
      const result = await deleteSession(id, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async ({ id, userId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions', userId] })
      
      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData<SessionWithIncludes[]>(['sessions', userId])
      
      // Optimistically remove the session
      queryClient.setQueryData(['sessions', userId], (old: SessionWithIncludes[] | undefined) => 
        old ? old.filter((session) => session.id !== id) : []
      )
      
      return { previousSessions }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions', variables.userId], context.previousSessions)
      }
      toast.error(error.message || 'Failed to delete session')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['session', variables.id] })
      toast.success('Session deleted successfully')
      router.push('/sessions')
    }
  })
}

// Hook to update session tags
export function useUpdateSessionTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      tagNames, 
      userId 
    }: { 
      sessionId: string
      tagNames: string[]
      userId: string 
    }) => {
      const result = await updateSessionTags(sessionId, tagNames, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['session', session?.id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Tags updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update tags')
    }
  })
}

// Hook to fetch all session tags
export function useSessionTags() {
  return useQuery({
    queryKey: ['session-tags'],
    queryFn: async () => {
      const result = await getSessionTags()
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - tags don't change often
  })
}