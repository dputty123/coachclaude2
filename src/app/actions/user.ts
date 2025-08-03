'use server'

import { prisma } from '@/lib/prisma'
import { DEFAULT_PROMPT_TEMPLATES, DEFAULT_ANALYSIS_PROMPT, DEFAULT_PREPARATION_PROMPT } from '@/lib/constants/default-templates'

export async function createNewUser(userId: string, email: string, name?: string) {
  try {
    // First check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (existingUser) {
      console.log('User already exists, skipping setup')
      return { success: true }
    }

    // Create user record in database using Prisma
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        // Set default prompts
        analysisPrompt: DEFAULT_ANALYSIS_PROMPT,
        preparationPrompt: DEFAULT_PREPARATION_PROMPT,
      }
    })

    console.log('User created successfully:', user.email)

    // Create default prompt templates
    const templatesWithUserId = DEFAULT_PROMPT_TEMPLATES.map(template => ({
      ...template,
      userId,
    }))

    try {
      await prisma.promptTemplate.createMany({
        data: templatesWithUserId
      })
      console.log('Default templates created')
    } catch (templateError) {
      console.error('Error creating templates:', templateError)
      // Don't throw here - user is created, templates are just nice to have
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createNewUser:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}