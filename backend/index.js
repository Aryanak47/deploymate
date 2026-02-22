import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Load all skills
const SKILL_CLARIFY  = fs.readFileSync(path.join(__dirname, 'skills/clarify_requirements.md'),  'utf-8')
const SKILL_GENERATE = fs.readFileSync(path.join(__dirname, 'skills/generate_infrastructure.md'),'utf-8')
const SKILL_REVIEW   = fs.readFileSync(path.join(__dirname, 'skills/review_security.md'),        'utf-8')
const SKILL_PIPELINE = fs.readFileSync(path.join(__dirname, 'skills/generate_pipeline.md'),      'utf-8')
const SKILL_COST     = fs.readFileSync(path.join(__dirname, 'skills/estimate_cost.md'),          'utf-8')


app.use(cors())
app.use(express.json())

// ── Helper: fix message array to ensure strict user/assistant alternation ────
function sanitizeMessages(messages) {
  // Filter empty content
  const filtered = messages.filter(m => m.content && String(m.content).trim() !== '')
  if (filtered.length === 0) return []

  const result = []
  for (const msg of filtered) {
    if (result.length === 0) {
      // First message must be user
      if (msg.role === 'user') result.push(msg)
      // Skip if assistant tries to go first
    } else {
      const lastRole = result[result.length - 1].role
      if (msg.role !== lastRole) {
        // Roles alternate correctly
        result.push(msg)
      } else if (msg.role === 'user') {
        // Two consecutive user messages — merge them
        result[result.length - 1] = {
          role: 'user',
          content: result[result.length - 1].content + '\n\n' + msg.content
        }
      }
      // Two consecutive assistant messages — keep the last one
      else {
        result[result.length - 1] = msg
      }
    }
  }

  // Must end with user message (runAgent adds the final user message)
  return result
}

// ── Helper: single Claude call ────────────────────────────────────────────────
async function runAgent(skill, userMessage, history = []) {
  const raw = [...history, { role: 'user', content: userMessage }]
  const messages = sanitizeMessages(raw)

  console.log(`runAgent: ${messages.length} messages, last role: ${messages[messages.length - 1]?.role}`)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: skill,
    messages
  })

  if (!response.content?.length) throw new Error('Claude returned empty response')

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('No text block in Claude response')

  return textBlock.text
}

// ── Route 1: Clarify (Agent 0) ────────────────────────────────────────────────
app.post('/api/clarify', async (req, res) => {
  const { message, history } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

  try {
    const reply = await runAgent(SKILL_CLARIFY, message, history || [])
    // Detect readiness with multiple signals — Claude may word it differently each time
    const readySignals = [
      'generating your infrastructure now',
      'generating infrastructure now',
      'generating your infrastructure',
      'generate your infrastructure',
      'will now generate',
      'ready to generate',
      'proceeding to generate',
      'creating your infrastructure',
      'let me generate',
      "i'll generate",
      "i'll now generate",
      'starting generation',
      'infrastructure now'
    ]
    const replyLower = reply.toLowerCase()
    const isReady = readySignals.some(signal => replyLower.includes(signal))
    res.json({ reply, isReady })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ── Route 2: Full 4-agent flow (Generate → Review → Cost → Pipeline) ─────────
app.get('/api/generate-flow', async (req, res) => {
  const description = req.query.description
  if (!description) return res.status(400).json({ error: 'description is required' })

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    // ── AGENT 1: Generate Infrastructure ──────────────────────────────────
    send('step', { step: 1, status: 'running', label: 'Generating infrastructure...' })

    const tfFiles = await runAgent(
      SKILL_GENERATE,
      `Generate OpenTofu infrastructure for: ${description}`
    )

    send('step',   { step: 1, status: 'done', label: 'Infrastructure generated ✅' })
    send('result', { type: 'terraform', content: tfFiles })

    // ── AGENT 2: Review Security ───────────────────────────────────────────
    send('step', { step: 2, status: 'running', label: 'Reviewing for security issues...' })

    const reviewReport = await runAgent(
      SKILL_REVIEW,
      `Review these OpenTofu files for security issues:\n\n${tfFiles}`
    )

    send('step',   { step: 2, status: 'done', label: 'Security review complete ✅' })
    send('result', { type: 'review', content: reviewReport })

    // ── AGENT 3: Estimate Cost ─────────────────────────────────────────────
    send('step', { step: 3, status: 'running', label: 'Estimating monthly costs...' })

    const costReport = await runAgent(
      SKILL_COST,
      `Estimate the monthly cost for this OpenTofu infrastructure:\n\n${tfFiles}`
    )

    send('step',   { step: 3, status: 'done', label: 'Cost estimate ready ✅' })
    send('result', { type: 'cost', content: costReport })

    // ── AGENT 4: Generate Pipeline ─────────────────────────────────────────
    send('step', { step: 4, status: 'running', label: 'Generating GitLab CI pipeline...' })

    const pipeline = await runAgent(
      SKILL_PIPELINE,
      `Generate a GitLab CI pipeline for this OpenTofu infrastructure:\n\n${tfFiles}\n\nSecurity review context:\n${reviewReport}`
    )

    send('step',   { step: 4, status: 'done', label: 'Pipeline generated ✅' })
    send('result', { type: 'pipeline', content: pipeline })

    send('done', { message: 'All done! Your infrastructure is ready to deploy.' })
    res.end()

  } catch (err) {
    console.error(err)
    send('error', { message: err.message })
    res.end()
  }
})

// ── Route 3: Review only (user pastes existing .tf files) ────────────────────
app.post('/api/review', async (req, res) => {
  const { tfCode } = req.body
  if (!tfCode) return res.status(400).json({ error: 'tfCode is required' })

  try {
    const review = await runAgent(
      SKILL_REVIEW,
      `Review these OpenTofu files for security issues:\n\n${tfCode}`
    )
    res.json({ review })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ── Route 4: Follow-up chat ───────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history, mode } = req.body
  const skill = mode === 'review' ? SKILL_REVIEW : SKILL_CLARIFY

  try {
    const reply = await runAgent(skill, message, history || [])
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 DeployMate backend running on http://localhost:${PORT}`))
