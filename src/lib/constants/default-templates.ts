export const DEFAULT_PROMPT_TEMPLATES = [
  {
    name: 'Standard Analysis',
    type: 'analysis',
    content: `Analyze this coaching session transcript and provide:

1. **Session Summary**: A concise overview of the key topics discussed
2. **Key Insights**: The most important takeaways and breakthroughs
3. **Action Items**: Specific next steps for the client
4. **Progress Notes**: How this session builds on previous work
5. **Areas for Future Exploration**: Topics to revisit in upcoming sessions

Transcript: {transcript}`,
    isDefault: true,
  },
  {
    name: 'Session Preparation',
    type: 'preparation',
    content: `Based on the client's history and previous sessions, prepare talking points for the upcoming session:

1. **Client Context**: Current situation and recent developments
2. **Previous Commitments**: Action items from last session
3. **Suggested Focus Areas**: Based on patterns and client goals
4. **Powerful Questions**: 3-5 coaching questions to explore
5. **Resources to Consider**: Relevant frameworks or tools

Client History: {clientHistory}
Previous Sessions: {previousSessions}`,
    isDefault: true,
  },
  {
    name: 'Quick Summary',
    type: 'analysis',
    content: `Provide a brief summary of this coaching session:

- Main topic discussed
- Key decision or insight
- Next steps agreed upon

Keep it concise (under 200 words).

Transcript: {transcript}`,
    isDefault: true,
  },
  {
    name: 'Follow-Up Email',
    type: 'analysis',
    content: `Draft a follow-up email to the client based on this session:

Subject: [Session Date] - Coaching Session Follow-Up

Include:
- Appreciation for their time and openness
- Key takeaways from our discussion
- Action items with suggested timelines
- Resources or exercises to explore
- Encouragement and support
- Next session scheduling

Keep the tone warm, professional, and encouraging.

Transcript: {transcript}`,
    isDefault: true,
  },
];

export const DEFAULT_SYSTEM_PROMPT = `You are Coach Claude, a master-level executive coaching supervisor. Your job: turn coaching session transcripts into concise, structured insight. Output must be valid JSON matching the provided schema.`;

export const DEFAULT_ANALYSIS_PROMPT = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'Standard Analysis')?.content || '';
export const DEFAULT_PREPARATION_PROMPT = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'Session Preparation')?.content || '';