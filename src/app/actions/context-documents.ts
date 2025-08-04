'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function getContextDocuments() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const documents = await prisma.contextDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: documents }
  } catch (error) {
    console.error('Error fetching context documents:', error)
    return { success: false, error: 'Failed to fetch documents' }
  }
}

export async function uploadContextDocument(
  formData: FormData
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'text/x-markdown']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !['txt', 'md', 'pdf'].includes(fileExtension || '')) {
      return { success: false, error: 'Invalid file type. Only PDF, TXT, and MD files are allowed.' }
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${user.id}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('context-documents')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Failed to upload file' }
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('context-documents')
      .getPublicUrl(filePath)

    // Extract text content based on file type
    let content = ''
    const buffer = Buffer.from(await file.arrayBuffer())
    
    if (file.type === 'application/pdf' || fileExtension === 'pdf') {
      // Extract text from PDF
      try {
        // Use dynamic import to avoid ESLint error
        const { default: pdfParse } = await import('pdf-parse-new')
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        return { success: false, error: 'Failed to parse PDF content' }
      }
    } else {
      // Text or markdown file
      content = buffer.toString('utf-8')
    }

    // Save to database
    const document = await prisma.contextDocument.create({
      data: {
        userId: user.id,
        name: file.name,
        fileUrl: publicUrl,
        fileType: fileExtension || 'txt',
        content
      }
    })

    return { success: true, data: document }
  } catch (error) {
    console.error('Error uploading context document:', error)
    return { success: false, error: 'Failed to upload document' }
  }
}

export async function deleteContextDocument(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get the document to find the file path
    const document = await prisma.contextDocument.findUnique({
      where: { id, userId: user.id }
    })

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Extract file path from URL
    const urlParts = document.fileUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${user.id}/${fileName}`

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('context-documents')
      .remove([filePath])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    await prisma.contextDocument.delete({
      where: { id, userId: user.id }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting context document:', error)
    return { success: false, error: 'Failed to delete document' }
  }
}

export async function getAllUserContextDocuments() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated', data: null }
    }

    const documents = await prisma.contextDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Combine all document contents with clear formatting
    const combinedContent = documents.map(doc => 
      `--- CONTEXT DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END: ${doc.name} ---`
    ).join('\n\n')

    return { 
      success: true, 
      data: {
        documents,
        combinedContent
      }
    }
  } catch (error) {
    console.error('Error fetching all context documents:', error)
    return { success: false, error: 'Failed to fetch documents', data: null }
  }
}