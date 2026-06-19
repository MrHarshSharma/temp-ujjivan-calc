import Anthropic from '@anthropic-ai/sdk'
import type { PlanChange } from '@/types'

// F-11: AI-native change summary. Given the previous/next plan and the detected
// changes, produce a 3-5 sentence human-readable summary. Falls back to a
// deterministic summary when the API key is absent.
const MODEL = 'claude-sonnet-4-6'

function fallbackSummary(changes: PlanChange[]): string {
  if (changes.length === 0) return 'No material changes since the last plan.'
  const top = changes.slice(0, 4).map(c => `${c.label} changed from ${c.oldValue} to ${c.newValue}`)
  return `This revision has ${changes.length} change${changes.length === 1 ? '' : 's'} since the last visit: ${top.join('; ')}.`
}

export async function POST(req: Request) {
  let body: { changes?: PlanChange[]; clientName?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const changes = body.changes ?? []
  const apiKey = process.env.ANTHROPIC_API_KEY

  // No key → deterministic fallback (still useful, no failure).
  if (!apiKey) {
    return Response.json({ summary: fallbackSummary(changes), source: 'fallback' })
  }

  if (changes.length === 0) {
    return Response.json({ summary: 'No material changes since the last plan.', source: 'fallback' })
  }

  const client = new Anthropic({ apiKey })
  const changeList = changes.map(c => `- ${c.label}: ${c.oldValue} → ${c.newValue}`).join('\n')

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: `You summarise what changed in a client's financial plan since their last review, for a Relationship Manager to read. Write 3-5 plain sentences, reference the actual numbers, and do not invent changes beyond those listed. No preamble, no bullet points.`,
      messages: [{
        role: 'user',
        content: `Client: ${body.clientName ?? 'the client'}. Changes since last plan:\n${changeList}`,
      }],
    })
    const summary = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
    return Response.json({ summary: summary || fallbackSummary(changes), source: 'ai' })
  } catch {
    return Response.json({ summary: fallbackSummary(changes), source: 'fallback' })
  }
}
