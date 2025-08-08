'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CalendarIcon } from 'lucide-react'
import { useClients } from '@/hooks/use-clients'
import { useCreateSession, useUpdateSession } from '@/hooks/use-sessions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const sessionFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().min(1, 'Client is required'),
  date: z.date().refine((date) => date instanceof Date, {
    message: 'Session date is required',
  }),
  transcript: z.string().optional(),
})

type SessionFormValues = z.infer<typeof sessionFormSchema>

interface SessionFormProps {
  userId: string
  mode: 'create' | 'edit'
  session?: {
    id: string
    title: string
    clientId: string
    date: Date | null
    transcript: string | null
  }
  defaultClientId?: string // For pre-selecting client
}

export function SessionForm({ userId, mode, session, defaultClientId }: SessionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Fetch clients for dropdown
  const { data: clients, isLoading: clientsLoading } = useClients(userId)
  
  // Mutations
  const createSession = useCreateSession()
  const updateSession = useUpdateSession()
  
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: session?.title || '',
      clientId: session?.clientId || defaultClientId || '',
      date: session?.date ? new Date(session.date) : new Date(),
      transcript: session?.transcript || '',
    },
  })
  
  // Update clientId if defaultClientId is provided and form hasn't been touched
  useEffect(() => {
    if (defaultClientId && !form.formState.isDirty) {
      form.setValue('clientId', defaultClientId)
    }
  }, [defaultClientId, form])
  
  async function onSubmit(values: SessionFormValues) {
    setIsSubmitting(true)
    
    try {
      const formData = {
        title: values.title,
        clientId: values.clientId,
        date: values.date.toISOString(),
        transcript: values.transcript || null,
      }
      
      if (mode === 'create') {
        await createSession.mutateAsync({ data: formData, userId })
      } else if (session) {
        await updateSession.mutateAsync({ 
          id: session.id, 
          data: formData, 
          userId 
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Session' : 'Edit Session'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Leadership Strategy Discussion" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                          {client.company && ` - ${client.company}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Session Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="transcript"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Transcript / Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste your session transcript or notes here..."
                      className="min-h-[200px]"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Note: Tags will be automatically assigned during analysis
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Session' : 'Save Changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}