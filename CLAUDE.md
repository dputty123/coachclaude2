# Coach Claude Insights - Development Guidelines

## Product Specification

For complete product specifications, features, and user workflows, please refer to:
**[Coach Claude: Product Specification Document](./Coach%20Claude_%20Product%20Specification%20Document.md)**

This document contains:
- Problem statement and solution overview
- Detailed feature specifications
- User journey and workflows
- Technical implementation details
- Success criteria and investment information

## Implementation Roadmap

**IMPORTANT**: This roadmap should be updated whenever we deviate from the plan or make implementation decisions that differ from what's outlined below.

### Phase 1: Foundation (Week 1)

**1. Database Schema & Prisma Setup**
- Install Prisma and configure with Supabase PostgreSQL
- Create comprehensive schema (see details below)

**2. Supabase Configuration**
- Set up Supabase project
- Configure authentication (email/password)
- Set up Row Level Security (RLS) policies
- Configure storage buckets for file uploads

**3. Authentication Implementation**
- Create auth context and providers
- Build login/signup pages
- Implement protected route middleware
- Add user session management

### Phase 2: Core Features (Week 2)

**4. Settings Page (Start Here!)**
- This is the logical first page since users need API keys
- Implement API key management (Claude, Google Calendar)
- Add coaching philosophy prompt configuration
- Create prompt templates management

**5. Clients Module**
- `/clients` - List view with client cards
- `/clients/new` - Add new client form
- `/clients/[id]` - Client detail page
- CRUD operations with Prisma/Supabase

**6. Sessions Foundation**
- `/sessions` - Sessions list view
- `/sessions/new` - Create session (select client)
- `/sessions/[id]` - Session detail view
- Basic CRUD without AI features yet

### Phase 3: AI Integration (Week 3)

**7. Google Calendar Integration**
- OAuth flow for Google Calendar
- Sync upcoming sessions
- Filter by coaching keywords
- Auto-create session records

**8. AI Analysis Features**
- Claude API integration
- Session preparation insights
- Post-session analysis
- Action items extraction
- Follow-up email generation
- Resource recommendations

### Phase 4: Advanced Features (Week 4)

**9. Resources Management**
- `/resources` - Resource library
- Upload and categorize resources
- Client-specific resource assignment
- AI-powered resource discovery

**10. Dashboard Completion**
- Wire up real data to dashboard cards
- Client metrics calculations
- Recent activity feed
- Upcoming sessions widget

### Technical Implementation Order

```
1. Backend Setup
   ├── Prisma schema
   ├── Supabase config
   └── tRPC routes setup

2. Auth Flow
   ├── Login/Signup pages
   ├── Auth context
   └── Protected routes

3. Settings (First functional page!)
   ├── API keys CRUD
   └── Prompt management

4. Clients
   ├── List → Add → Edit → Delete
   └── Client profiles

5. Sessions
   ├── Basic CRUD
   ├── Calendar sync
   └── AI analysis

6. Resources
   └── Complete the loop
```

### Why This Order?

1. **Foundation First**: Database and auth are prerequisites
2. **Settings Before Features**: Users need API keys configured
3. **Clients Before Sessions**: Sessions belong to clients
4. **Basic CRUD Before AI**: Get data flow working first
5. **AI Features Together**: Better to implement all AI at once
6. **Dashboard Last**: Needs all data to be meaningful

### Next Immediate Steps

1. **Install Prisma**: `npm install prisma @prisma/client`
2. **Initialize Prisma**: `npx prisma init`
3. **Create schema.prisma** with all models
4. **Set up Supabase** project and get connection string
5. **Run migrations**: `npx prisma migrate dev`

## Database Schema Design

### Client Schema Key Features

The Client schema has been carefully designed to handle the complex relationships between coaches and their clients:

1. **Basic Information**
   - Standard fields: name, role, company, email, phone, birthday
   - `coachingSince` is optional - coaches may not remember exact start dates
   - All clients belong to a specific coach (userId)

2. **Custom Fields**
   - `careerGoal` - Client's career aspirations
   - `keyChallenge` - Main challenge they're working on
   - `keyStakeholders` - Text field for roles like "CEO, CTO, Sales Director"

3. **Organizational Relationships**
   - **Reports To**: Unidirectional relationship using simple foreign key
     - `reportsToId` links to another client who is their manager
     - `directReports` automatically gives you all subordinates
   - **Team Members**: Bidirectional relationship using join table
     - Uses `TeamMembership` table to handle many-to-many relationships
     - When A adds B as team member, B automatically sees A in their team

4. **Related Data**
   - **Notes**: Multiple timestamped notes per client (ClientNote table)
   - **Resources**: AI-suggested or manually added resources linked to clients
   - **Sessions**: All coaching sessions with this client

### Implementation Notes

- All relationships stay within a coach's client roster (enforced by userId)
- Cascade deletes ensure data integrity when removing clients
- Timestamp fields track when records are created and updated
- The schema avoids complex self-referencing many-to-many relations in favor of cleaner join tables

### Example Usage

```typescript
// Adding a team member relationship
await prisma.teamMembership.create({
  data: {
    teamId: clientA.id,
    memberId: clientB.id
  }
});

// Finding all team members for a client
const client = await prisma.client.findUnique({
  where: { id: clientId },
  include: {
    teamMembers: { include: { member: true } },
    memberOf: { include: { team: true } }
  }
});
```
### Calendar Integration Approach (MVP)

**Phase 1 - Read-Only Integration:**
1. Coach connects Google Calendar via OAuth
2. System displays all upcoming calendar events
3. Auto-detection: Events containing existing client names are flagged
4. Coach manually confirms which events are coaching sessions
5. Confirmed sessions pre-populate: date, title, client link

**Why This Approach:**
- Simple MVP implementation
- No complex filtering logic needed initially
- Coaches maintain control over session identification
- Supports gradual adoption (can work without calendar)

**Future Enhancements:**
- Event filtering by keywords/labels
- Two-way sync (create calendar events)
- Automatic session creation rules

## Tag System Architecture

### Implementation Strategy

1. **Single Tag Table**: One table for all tag types with category field
2. **Pre-defined Tags Only**: ~20-30 curated coaching-relevant tags
3. **AI Selection Only**: AI selects from existing tags, cannot create new ones

### Example Tags

```typescript
const COACHING_TAGS = [
  // Leadership & Management
  "leadership", "delegation", "team-building", "decision-making",
  
  // Career Development
  "career-growth", "goal-setting", "performance", "promotion",
  
  // Communication
  "communication", "presentation", "conflict-resolution", "feedback",
  
  // Personal Development
  "confidence", "work-life-balance", "stress-management", "mindset",
  
  // Strategy & Planning
  "strategy", "planning", "vision", "change-management"
];
```

### Benefits
- Prevents tag explosion and inconsistency
- Enables meaningful filtering and analytics
- Maintains quality of AI categorization

## Session Workflow

### Pre-Session Flow (Preparation)

1. **Trigger**: Coach views upcoming session (calendar or manual)
2. **Action**: Clicks "Prepare" button
3. **AI Process**:
   - Analyzes all previous sessions with client
   - Reviews client profile and notes
   - Generates preparation insights
4. **Output**: Preparation notes with context and suggested talking points

### Post-Session Flow (Analysis)

1. **Create/Select Session**: Coach creates new session or selects from calendar
2. **Upload Transcript**: Paste or upload session notes/transcript
3. **AI Analysis**:
   - **Always Generated**:
     - Summary: Concise overview of session
     - Follow-up Email: Draft for client
   - **Custom Analysis**: Based on coach's prompts
4. **Resource Discovery**:
   - AI analyzes session content
   - Suggests relevant resources
   - Links resources to both client and session
5. **Tag Assignment**: AI selects relevant tags from predefined list

### Data Flow Example

```typescript
// Post-session processing
async function processSession(sessionId: string, transcript: string) {
  // 1. Generate standard outputs
  const summary = await generateSummary(transcript);
  const followUpEmail = await generateFollowUp(transcript);
  
  // 2. Run custom analysis based on coach's prompts
  const analysis = await runCustomAnalysis(transcript, coach.prompts);
  
  // 3. Assign tags from predefined list
  const tags = await selectRelevantTags(transcript, COACHING_TAGS);
  
  // 4. Discover and suggest resources
  const resources = await discoverResources(transcript);
  
  // 5. Update session with all generated content
  await updateSession(sessionId, {
    summary,
    followUpEmail,
    analysis,
    tags,
    resources
  });
}
```

## Settings Architecture

### API Configuration Strategy

API keys and configuration are stored directly in the User model for MVP simplicity:

1. **Claude API Configuration**
   - `claudeApiKey`: Encrypted API key storage
   - `claudeModel`: User's preferred model (defaults to claude-3-sonnet)
   - Automatic fallback handled by Claude API (Opus → Sonnet)

2. **Google Calendar Integration**
   - `googleRefreshToken`: OAuth refresh token for persistent access
   - Enables calendar sync without repeated authentication

### Prompt Management System

Two-tier prompt system for flexibility:

1. **Active Prompts** (in User model)
   - `analysisPrompt`: Currently active prompt for post-session analysis
   - `preparationPrompt`: Currently active prompt for pre-session preparation
   - Stored as text, can be edited directly

2. **Prompt Templates** (PromptTemplate model)
   - Library of saved prompts
   - Types: "analysis" or "preparation"
   - `isDefault`: Marks system-provided templates
   - Users can create custom templates

### Workflow Example

```typescript
// Using a template
async function applyTemplate(templateId: string) {
  const template = await prisma.promptTemplate.findUnique({
    where: { id: templateId }
  });
  
  // Copy template content to active prompt
  if (template.type === 'analysis') {
    await prisma.user.update({
      where: { id: userId },
      data: { analysisPrompt: template.content }
    });
  }
}

// Default templates created on signup
const defaultTemplates = [
  {
    name: "Standard Analysis",
    type: "analysis",
    content: "Analyze this coaching session...",
    isDefault: true
  },
  {
    name: "Session Preparation",
    type: "preparation", 
    content: "Prepare for upcoming session...",
    isDefault: true
  }
];
```

### Security Considerations

- API keys must be encrypted before storage
- Use environment variables for encryption keys
- Never expose raw API keys in responses
- Implement proper key rotation mechanisms

## Tech Stack

### Core Framework
- **Next.js 15** - App Router, Server Components, Server Actions
- **React 19** - UI library
- **TypeScript** - Type safety

### UI & Styling
- **shadcn/ui** - Headless UI components built on Radix UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library

### Database & Backend
- **Prisma** - Type-safe ORM for database queries
- **Supabase** - Backend as a Service
  - **Database** - PostgreSQL database
  - **Auth** - Authentication and user management
  - **Storage** - File storage for documents/images
- **tRPC** - End-to-end typesafe APIs
- **Zod** - Schema validation (works with tRPC and React Hook Form)

### State Management & Data Fetching
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Client state management (for UI state, user preferences)

### AI Integration
- **Claude API** - AI-powered coaching insights and analysis

### Form Handling
- **React Hook Form** - Performant forms with Zod validation
- **@hookform/resolvers** - Zod resolver for form validation

## Server Components vs Client Components

### Default to Server Components
- **All components are server components by default** in Next.js 13+ App Router
- Only add `"use client"` when absolutely necessary
- Server components = better performance, smaller JS bundle, direct database access

### When to use Client Components (`"use client"`):

1. **Interactive UI Elements**
   - Components with `onClick`, `onChange`, `onSubmit` handlers
   - Forms with controlled inputs
   - Modals, dropdowns, accordions that users interact with

2. **Browser APIs**
   - Components using `window`, `document`, `localStorage`
   - Components that need to know viewport size, scroll position

3. **React Hooks**
   - Components using `useState`, `useEffect`, `useReducer`
   - Custom hooks that use client-side features
   - Components using `useRouter`, `usePathname` from Next.js

4. **Third-party Libraries**
   - Libraries that require browser environment
   - React Query providers, Context providers
   - Animation libraries that need DOM access

### When to use Server Components (default):

1. **Data Fetching**
   - Pages that fetch data from database
   - Components that display static data
   - Direct Supabase queries

2. **Static Content**
   - Headers, footers (unless they have interactive elements)
   - Text content, blog posts, documentation
   - Lists that just display data

3. **Layout Components**
   - Page layouts that just structure content
   - Wrappers that don't have state

### Current Component Status in Our App:

#### Client Components (correctly using "use client"):
- `providers.tsx` - Uses React Query context
- `sidebar.tsx` - Has useState for collapse/expand
- `header.tsx` - Could be server but has search input (will need interactivity)

#### Components that SHOULD BE Server Components:
- `app/page.tsx` (Dashboard) - Just displays data
- `client-metrics-card.tsx` - Static data display
- `recent-activity-card.tsx` - Static data display  
- `upcoming-sessions-card.tsx` - Static data display (Button is already a client component internally)

### Best Practices:

1. **Start with server components** - Only add "use client" when you get an error
2. **Push "use client" down** - Keep it on the smallest component possible
3. **Split components** - Separate interactive parts into small client components
4. **Data fetching on server** - Use async/await directly in server components

### Example Pattern:

```tsx
// app/clients/page.tsx - Server Component ✅
export default async function ClientsPage() {
  const clients = await getClientsFromSupabase(); // Direct DB access!
  
  return (
    <div>
      <h1>Clients</h1>
      <ClientsList clients={clients} /> {/* Server component displaying data */}
      <AddClientDialog /> {/* Client component for interactivity */}
    </div>
  );
}

// components/clients/clients-list.tsx - Server Component ✅
export function ClientsList({ clients }) {
  return (
    <div>
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}

// components/clients/add-client-dialog.tsx - Client Component ✅
"use client"
export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  // Interactive component needs "use client"
}
```

### Remember:
- A client component can render server components as children
- But a server component cannot import a client component directly (only as children)
- Props passed from server to client components must be serializable (no functions)