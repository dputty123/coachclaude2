import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

// Predefined session tags based on UI and coaching best practices
const SESSION_TAGS = [
  // From existing UI
  'leadership',
  'strategy', 
  'team management',
  'career',
  'goals',
  'planning',
  'communication',
  'presence',
  'confidence',
  'decision making',
  'analysis',
  'conflict',
  'relationships',
  'development',
  // Additional coaching tags
  'delegation',
  'performance',
  'promotion',
  'feedback',
  'work-life-balance',
  'stress-management',
  'mindset',
  'vision',
  'change-management'
]

// Predefined resource tags
const RESOURCE_TAGS = [
  // From existing UI
  'leadership',
  'framework',
  'executive',
  'emotional-intelligence',
  'assessment',
  'development',
  'strategy',
  'decision-making',
  'communication',
  'feedback',
  'goals',
  'planning',
  'teams',
  'organizational',
  // Resource types
  'article',
  'tool',
  'book',
  'video',
  'template',
  'worksheet',
  'guide',
  'pdf'
]

async function seedTags() {
  console.log('🌱 Seeding tags...')
  
  // Seed session tags
  for (const tagName of SESSION_TAGS) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        category: 'session'
      }
    })
  }
  
  console.log(`✅ Seeded ${SESSION_TAGS.length} session tags`)
  
  // Seed resource tags
  for (const tagName of RESOURCE_TAGS) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: { category: 'resource' },
      create: {
        name: tagName,
        category: 'resource'
      }
    })
  }
  
  console.log(`✅ Seeded ${RESOURCE_TAGS.length} resource tags`)
}

seedTags()
  .catch(e => {
    console.error('Error seeding tags:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })