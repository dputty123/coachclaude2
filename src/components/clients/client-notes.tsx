'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Edit2, Trash2, Plus } from 'lucide-react'
import { useCreateClientNote, useUpdateClientNote, useDeleteClientNote } from '@/hooks/use-clients'
import type { ClientNote } from '@/generated/prisma'

interface ClientNotesProps {
  clientId: string
  userId: string
  notes: ClientNote[]
}

export function ClientNotes({ clientId, userId, notes }: ClientNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null)
  const [noteContent, setNoteContent] = useState('')
  
  const createNoteMutation = useCreateClientNote()
  const updateNoteMutation = useUpdateClientNote()
  const deleteNoteMutation = useDeleteClientNote()

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    
    await createNoteMutation.mutateAsync({
      clientId,
      content: noteContent,
      userId
    })
    
    setNoteContent('')
    setIsAddingNote(false)
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !noteContent.trim()) return
    
    await updateNoteMutation.mutateAsync({
      noteId: editingNote.id,
      content: noteContent,
      userId,
      clientId
    })
    
    setNoteContent('')
    setEditingNote(null)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    await deleteNoteMutation.mutateAsync({
      noteId,
      userId,
      clientId
    })
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Client Notes</h3>
        <Button size="sm" onClick={() => setIsAddingNote(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>
      
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                    {note.updatedAt !== note.createdAt && (
                      <span className="ml-2">(edited)</span>
                    )}
                  </p>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setNoteContent(note.content)
                        setEditingNote(note)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No notes available yet. Click &apos;Add Note&apos; to create one.</p>
      )}

      {/* Add Note Dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[150px]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddingNote(false)
              setNoteContent('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddNote}
              disabled={!noteContent.trim() || createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => {
        if (!open) {
          setEditingNote(null)
          setNoteContent('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[150px]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingNote(null)
              setNoteContent('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateNote}
              disabled={!noteContent.trim() || updateNoteMutation.isPending}
            >
              {updateNoteMutation.isPending ? 'Updating...' : 'Update Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}