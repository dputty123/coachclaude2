import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContextDocuments,
  uploadContextDocument,
  deleteContextDocument,
} from '@/app/actions/context-documents'
import { toast } from 'sonner'

export interface ContextDocument {
  id: string
  userId: string
  name: string
  fileUrl: string
  fileType: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export function useContextDocuments() {
  return useQuery({
    queryKey: ['context-documents'],
    queryFn: async () => {
      const result = await getContextDocuments()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch documents')
      }
      return result.data as ContextDocument[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await uploadContextDocument(formData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-documents'] })
      toast.success('Document uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload document')
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteContextDocument(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document')
      }
      return result
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['context-documents'] })

      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData<ContextDocument[]>(['context-documents'])

      // Optimistically update
      queryClient.setQueryData<ContextDocument[]>(['context-documents'], (old) => 
        old ? old.filter(doc => doc.id !== deletedId) : []
      )

      return { previousDocuments }
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousDocuments) {
        queryClient.setQueryData(['context-documents'], context.previousDocuments)
      }
      toast.error(error.message || 'Failed to delete document')
    },
    onSuccess: () => {
      toast.success('Document deleted')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['context-documents'] })
    },
  })
}