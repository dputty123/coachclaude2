import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  setTemplateAsDefault,
} from '@/app/actions/settings'
import { toast } from 'sonner'
import { PromptTemplate } from '@/components/settings/types'

export function usePromptTemplates() {
  return useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const result = await getPromptTemplates()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch templates')
      }
      return result.data as PromptTemplate[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreatePromptTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, type, content }: { name: string; type: 'analysis' | 'preparation'; content: string }) => {
      const result = await createPromptTemplate(name, type, content)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create template')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] })
      toast.success('Template created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template')
    },
  })
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, content }: { id: string; name: string; content: string }) => {
      const result = await updatePromptTemplate(id, name, content)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update template')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] })
      toast.success('Template saved successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save template')
    },
  })
}

export function useDeletePromptTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePromptTemplate(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete template')
      }
      return result
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prompt-templates'] })

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData<PromptTemplate[]>(['prompt-templates'])

      // Optimistically update
      queryClient.setQueryData<PromptTemplate[]>(['prompt-templates'], (old) => 
        old ? old.filter(t => t.id !== deletedId) : []
      )

      return { previousTemplates }
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['prompt-templates'], context.previousTemplates)
      }
      toast.error(error.message || 'Failed to delete template')
    },
    onSuccess: () => {
      toast.success('Template deleted')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] })
    },
  })
}

export function useSetTemplateAsDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await setTemplateAsDefault(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to set as default')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate both templates and settings as this affects both
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] })
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      toast.success('Template set as default')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set as default')
    },
  })
}