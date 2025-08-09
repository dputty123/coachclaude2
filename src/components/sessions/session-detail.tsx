'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  User, 
  FileText, 
  Mail, 
  BookOpen, 
  MessageSquare,
  Edit,
  Trash2,
  Sparkles,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useDeleteSession } from '@/hooks/use-sessions'
import { useAnalyzeSession, useReanalyzeSession } from '@/hooks/use-session-ai'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { toast } from 'sonner'

// Type for session with relations
interface SessionWithRelations {
  id: string
  title: string
  clientId: string
  date: Date | null
  transcript: string | null
  summary: string | null
  followUpEmail: string | null
  analysis: string | null
  client: {
    name: string
  }
  tags?: Array<{
    tag: {
      id: string
      name: string
    }
  }>
  resources?: Array<{
    id: string
    suggestedBy: string
    resource: {
      title: string
      description: string | null
      type: string
      url: string | null
    }
  }>
}

interface SessionDetailProps {
  session: SessionWithRelations
  userId: string
}

export function SessionDetail({ session, userId }: SessionDetailProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const deleteSession = useDeleteSession()
  const analyzeSession = useAnalyzeSession()
  const reanalyzeSession = useReanalyzeSession()
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSession.mutateAsync({ id: session.id, userId })
      setDeleteDialogOpen(false)
    } catch {
      setIsDeleting(false)
    }
  }
  
  const handleAnalyze = async () => {
    await analyzeSession.mutateAsync({ sessionId: session.id, userId })
  }
  
  const handleReanalyze = async () => {
    await reanalyzeSession.mutateAsync({ sessionId: session.id, userId })
  }
  
  const handleCopyEmail = () => {
    if (session.followUpEmail) {
      navigator.clipboard.writeText(session.followUpEmail)
      setCopiedEmail(true)
      toast.success('Email copied to clipboard')
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }
  
  const hasAnalysis = session.summary || session.followUpEmail || session.analysis
  const isAnalyzing = analyzeSession.isPending || reanalyzeSession.isPending
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <Link 
                href={`/clients/${session.clientId}`}
                className="hover:text-foreground hover:underline"
              >
                {session.client.name}
              </Link>
            </div>
            {session.date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/sessions/${session.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Tags Section */}
      {session.tags && session.tags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tags:</span>
          <div className="flex flex-wrap gap-1">
            {session.tags.map((st) => (
              <Badge key={st.tag.id} variant="secondary">
                {st.tag.name}
              </Badge>
            ))}
          </div>
          {!hasAnalysis && session.transcript && (
            <Badge variant="outline" className="text-xs">
              Tags will be assigned during analysis
            </Badge>
          )}
        </div>
      )}
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasAnalysis && <TabsTrigger value="analysis">Analysis</TabsTrigger>}
          {session.resources && session.resources.length > 0 && (
            <TabsTrigger value="resources">
              Resources ({session.resources.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="chat" disabled>Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Transcript */}
          {session.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Session Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{session.transcript}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Summary */}
          {session.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{session.summary}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Follow-up Email */}
          {session.followUpEmail && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Follow-up Email
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmail}
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap font-mono text-sm">
                    {session.followUpEmail}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Analysis Prompt */}
          {!hasAnalysis && session.transcript && (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  This session has a transcript and can be analyzed to generate insights, 
                  summary, and follow-up email.
                </p>
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {!session.transcript && !hasAnalysis && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Content Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add a transcript to this session to enable AI analysis and insights.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/sessions/${session.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Add Transcript
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {hasAnalysis && (
          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Session Analysis</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReanalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Re-analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Re-analyze
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {session.analysis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{session.analysis}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No custom analysis available. View the Overview tab for summary and insights.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {session.resources && session.resources.length > 0 && (
          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Session Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.resources.map((cr) => (
                    <div key={cr.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{cr.resource.title}</h4>
                        {cr.resource.description && (
                          <p className="text-sm text-muted-foreground">
                            {cr.resource.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {cr.resource.type}
                          </Badge>
                          {cr.suggestedBy === 'ai' && (
                            <Badge variant="secondary" className="text-xs">
                              AI Suggested
                            </Badge>
                          )}
                        </div>
                      </div>
                      {cr.resource.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={cr.resource.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Chat Coming Soon</h3>
              <p className="text-muted-foreground">
                Soon you&apos;ll be able to discuss this session with AI to gain deeper insights.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={`Delete "${session.title}"?`}
        description="This will permanently delete this session and all associated data. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  )
}