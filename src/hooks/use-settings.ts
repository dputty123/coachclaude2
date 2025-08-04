import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getUserSettings, 
  updateApiConfiguration, 
  updateSystemPrompt 
} from '@/app/actions/settings'
import { toast } from 'sonner'

export function useUserSettings() {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const result = await getUserSettings()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch settings')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateApiConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ apiKey, model }: { apiKey: string | null; model: string }) => {
      const result = await updateApiConfiguration(apiKey, model)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update API configuration')
      }
      return result
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch user settings
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      
      if (variables.apiKey) {
        toast.success('API configuration saved successfully')
      } else {
        toast.success('Model preference saved')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update configuration')
    },
  })
}

export function useUpdateSystemPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ type, prompt }: { type: 'analysis' | 'preparation'; prompt: string }) => {
      const result = await updateSystemPrompt(type, prompt)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update prompt')
      }
      return result
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch user settings
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      
      const promptType = variables.type === 'analysis' ? 'Analysis' : 'Preparation'
      toast.success(`${promptType} prompt saved successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update prompt')
    },
  })
}