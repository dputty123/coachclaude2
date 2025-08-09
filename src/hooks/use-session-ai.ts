'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  analyzeSession, 
  prepareForSession, 
  discoverSessionResources,
  reanalyzeSession 
} from '@/app/actions/session-ai'
import { toast } from 'sonner'

// Hook to analyze a session
export function useAnalyzeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const result = await analyzeSession(sessionId, userId)
      return result
    },
    onMutate: () => {
      toast.loading('Analyzing session...', { id: 'analyze-session' })
    },
    onSuccess: (result, variables) => {
      toast.dismiss('analyze-session')
      
      if (!result.success) {
        // Handle error without throwing
        if (result.error?.includes('API key')) {
          toast.error(result.error, {
            action: {
              label: 'Go to Settings',
              onClick: () => window.location.href = '/settings'
            }
          })
        } else {
          toast.error(result.error || 'Failed to analyze session')
        }
        return
      }
      
      toast.success('Session analyzed successfully')
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

// Hook to re-analyze a session
export function useReanalyzeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const result = await reanalyzeSession(sessionId, userId)
      return result
    },
    onMutate: () => {
      toast.loading('Re-analyzing session...', { id: 'reanalyze-session' })
    },
    onSuccess: (result, variables) => {
      toast.dismiss('reanalyze-session')
      
      if (!result.success) {
        // Handle error without throwing
        if (result.error?.includes('API key')) {
          toast.error(result.error, {
            action: {
              label: 'Go to Settings',
              onClick: () => window.location.href = '/settings'
            }
          })
        } else {
          toast.error(result.error || 'Failed to re-analyze session')
        }
        return
      }
      
      toast.success('Session re-analyzed successfully')
      
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

// Hook to prepare for a session
export function usePrepareForSession() {
  return useMutation({
    mutationFn: async ({ clientId, userId }: { clientId: string; userId: string }) => {
      const result = await prepareForSession(clientId, userId)
      return result
    },
    onMutate: () => {
      toast.loading('Generating preparation notes...', { id: 'prepare-session' })
    },
    onSuccess: (result) => {
      toast.dismiss('prepare-session')
      
      if (!result.success) {
        // Handle error without throwing
        if (result.error?.includes('API key')) {
          toast.error(result.error, {
            action: {
              label: 'Go to Settings',
              onClick: () => window.location.href = '/settings'
            }
          })
        } else {
          toast.error(result.error || 'Failed to generate preparation notes')
        }
        return
      }
      
      toast.success('Preparation notes generated')
    }
  })
}

// Hook to discover resources for a session
export function useDiscoverResources() {
  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const result = await discoverSessionResources(sessionId, userId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onMutate: () => {
      toast.loading('Discovering resources...', { id: 'discover-resources' })
    },
    onSuccess: (data) => {
      toast.dismiss('discover-resources')
      if (data?.resources && data.resources.length > 0) {
        toast.success(`Found ${data.resources.length} relevant resources`)
      } else {
        toast.info('No relevant resources found for this session')
      }
    },
    onError: (error) => {
      toast.dismiss('discover-resources')
      toast.error(error.message || 'Failed to discover resources')
    }
  })
}