import Anthropic from '@anthropic-ai/sdk'

// F-10: AI chat assistant. Server-side route so the API key never reaches the browser.
// Model + token cap are fixed by the product spec.
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 800

type ChatMode = 'RM' | 'CLIENT'
interface ChatTurn { role: 'user' | 'assistant'; content: string }

function buildSystemPrompt(mode: ChatMode, context: string): string {
  const sharedRules = `You are an assistant embedded in Ujjivan Small Finance Bank's RM (Relationship Manager) financial-planning tool. You help the RM during a live client planning session.

Use the client's specific numbers from the session context below in your answers — never give generic answers when a specific one is available.

You must NOT give personalised investment advice in the SEBI-regulated sense. Whenever your answer involves a product or investment recommendation, end with this exact line on its own:
"This is based on the planning parameters entered and is for guidance only."

Keep answers concise (this tool caps responses).`

  const modeRules = mode === 'CLIENT'
    ? `RESPONSE MODE: CLIENT. Write warm, simple, jargon-free language the RM can read aloud or show to the client. Use everyday analogies. Avoid technical terms; if you must use one, explain it in plain words.`
    : `RESPONSE MODE: RM. Write direct, technical, concise answers for the Relationship Manager's own understanding. Financial terminology is fine.`

  return `${sharedRules}\n\n${modeRules}\n\n--- CURRENT SESSION CONTEXT ---\n${context || 'No client session data has been entered yet.'}`
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'AI assistant not configured. Set ANTHROPIC_API_KEY in the environment to enable it.' },
      { status: 503 }
    )
  }

  let body: { messages?: ChatTurn[]; mode?: ChatMode; context?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const messages = (body.messages ?? []).filter(m => m.content?.trim())
  if (messages.length === 0) {
    return Response.json({ error: 'No message provided.' }, { status: 400 })
  }
  const mode: ChatMode = body.mode === 'CLIENT' ? 'CLIENT' : 'RM'

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(mode, body.context ?? ''),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    return Response.json({ text })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json({ error: `Assistant error (${err.status}): ${err.message}` }, { status: 502 })
    }
    return Response.json({ error: 'The assistant could not respond. Please try again.' }, { status: 502 })
  }
}
