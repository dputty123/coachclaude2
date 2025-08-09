// Session Analysis Prompts

export const SUMMARY_PROMPT = `
Provide a concise summary (150-200 words) of this coaching session including:
- Main topics discussed
- Key insights and breakthroughs
- Client's current challenges
- Progress made
`;

export const FOLLOWUP_EMAIL_PROMPT = `
Generate a professional follow-up email for the client including:
- Warm appreciation for their time and engagement
- 2-3 key takeaways from today's session
- Specific action items with clear next steps
- Encouragement and support for their journey
- Closing with next session reminder if applicable

Keep the tone warm, professional, and supportive.
`;

export const RESOURCE_DISCOVERY_PROMPT = `
Based on this session, suggest 0-3 highly relevant resources.
Only suggest resources if they directly address topics discussed.
For each resource provide:
- Title
- Type (article/framework/tool/book/video)
- URL (if publicly available) or where to find it
- One-sentence description of why it's relevant
- 2-3 relevant tags from our predefined list

Return as JSON array. Return empty array if no relevant resources found.
Format: [{"title": "...", "type": "...", "url": "...", "description": "...", "tags": ["tag1", "tag2"]}]
`;

export const SESSION_TAGS_PROMPT = `
Based on this coaching session transcript and analysis, select the most relevant tags.
Choose 3-5 tags from this predefined list that best capture the session's themes:

Available tags: leadership, strategy, team management, career, goals, planning,
communication, presence, confidence, decision making, analysis, conflict, 
relationships, development, delegation, performance, promotion, feedback,
work-life-balance, stress-management, mindset, vision, change-management

Return only the tag names that apply, as a comma-separated list.
Example: leadership, team management, delegation, feedback
`;

// Default Claude model
export const DEFAULT_CLAUDE_MODEL = 'claude-opus-4-20250514';