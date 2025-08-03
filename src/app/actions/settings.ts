'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { encrypt, safeDecrypt } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

export async function getUserSettings() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        claudeApiKey: true,
        claudeModel: true,
        analysisPrompt: true,
        preparationPrompt: true,
      }
    })

    if (!settings) {
      return { success: false, error: 'User not found' }
    }

    // Decrypt API key for display (masked)
    const decryptedApiKey = safeDecrypt(settings.claudeApiKey)
    let maskedApiKey = null
    
    if (decryptedApiKey) {
      // For short keys, just show partial
      if (decryptedApiKey.length <= 10) {
        maskedApiKey = `${decryptedApiKey.slice(0, 3)}...`
      } else {
        // For longer keys, show beginning and end
        maskedApiKey = `${decryptedApiKey.slice(0, 7)}...${decryptedApiKey.slice(-4)}`
      }
    }

    return {
      success: true,
      data: {
        ...settings,
        claudeApiKey: maskedApiKey,
        hasApiKey: !!settings.claudeApiKey
      }
    }
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return { success: false, error: 'Failed to fetch settings' }
  }
}

export async function updateApiConfiguration(apiKey: string, model: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        claudeApiKey: encryptedApiKey,
        claudeModel: model,
      }
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating API configuration:', error)
    return { success: false, error: 'Failed to update API configuration' }
  }
}

export async function updateSystemPrompt(type: 'analysis' | 'preparation', prompt: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const field = type === 'analysis' ? 'analysisPrompt' : 'preparationPrompt'
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        [field]: prompt
      }
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating system prompt:', error)
    return { success: false, error: 'Failed to update system prompt' }
  }
}

export async function getPromptTemplates() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const templates = await prisma.promptTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Cast the type field to the union type
    const typedTemplates = templates.map(t => ({
      ...t,
      type: t.type as 'analysis' | 'preparation'
    }))

    return { success: true, data: typedTemplates }
  } catch (error) {
    console.error('Error fetching prompt templates:', error)
    return { success: false, error: 'Failed to fetch templates' }
  }
}

export async function createPromptTemplate(name: string, type: 'analysis' | 'preparation', content: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const template = await prisma.promptTemplate.create({
      data: {
        userId: user.id,
        name,
        type,
        content,
        isDefault: false
      }
    })

    // Cast the type field to the union type
    const typedTemplate = {
      ...template,
      type: template.type as 'analysis' | 'preparation'
    }

    revalidatePath('/settings')
    return { success: true, data: typedTemplate }
  } catch (error) {
    console.error('Error creating prompt template:', error)
    return { success: false, error: 'Failed to create template' }
  }
}

export async function updatePromptTemplate(id: string, name: string, content: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const template = await prisma.promptTemplate.update({
      where: { 
        id,
        userId: user.id // Ensure user owns this template
      },
      data: {
        name,
        content
      }
    })

    revalidatePath('/settings')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error updating prompt template:', error)
    return { success: false, error: 'Failed to update template' }
  }
}

export async function deletePromptTemplate(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if this is the active template
    const userSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        analysisPrompt: true,
        preparationPrompt: true
      }
    })

    const template = await prisma.promptTemplate.findUnique({
      where: { id, userId: user.id }
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    // Check if this template's content matches the active prompt
    const isActiveAnalysis = userSettings?.analysisPrompt === template.content
    const isActivePreparation = userSettings?.preparationPrompt === template.content

    if (isActiveAnalysis || isActivePreparation) {
      return { 
        success: false, 
        error: 'Cannot delete active template. Please set a different template as default first.' 
      }
    }

    await prisma.promptTemplate.delete({
      where: { 
        id,
        userId: user.id
      }
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error deleting prompt template:', error)
    return { success: false, error: 'Failed to delete template' }
  }
}

export async function setTemplateAsDefault(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const template = await prisma.promptTemplate.findUnique({
      where: { 
        id,
        userId: user.id
      }
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    // Update the user's active prompt based on template type
    const field = template.type === 'analysis' ? 'analysisPrompt' : 'preparationPrompt'
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        [field]: template.content
      }
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error setting template as default:', error)
    return { success: false, error: 'Failed to set template as default' }
  }
}