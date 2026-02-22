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
const SKILL_CLARIFY  = fs.readFileSync(path.join(__dirname, 'skills/clarify_requirements.md'), 'utf-8')
const SKILL_GENERATE = fs.readFileSync(path.join(__dirname, 'skills/generate_infrastructure.md'), 'utf-8')
const SKILL_REVIEW   = fs.readFileSync(path.join(__dirname, 'skills/review_security.md'), 'utf-8')
const SKILL_PIPELINE = fs.readFileSync(path.join(__dirname, 'skills/generate_pipeline.md'), 'utf-8')

app.use(cors())
app.use(express.json())

// ── Helper: single Claude call ────────────────────────────────────────────────
async function runAgent(skill, userMessage, history = []) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: skill,
    messages: [...history, { role: 'user', content: userMessage }]
  })
  return response.content[0].text
}

// ── Route 1: Clarify (Agent 0) ────────────────────────────────────────────────
// First message always goes here — agent decides if it needs to ask questions
// or if description is already detailed enough to proceed
app.post('/api/clarify', async (req, res) => {
  const { message, history } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

  try {
    const reply = await runAgent(SKILL_CLARIFY, message, history || [])

    // Detect if agent has enough info and is ready to generate
    // Agent signals readiness by including "Generating your infrastructure now..."
    const isReady = reply.includes('Generating your infrastructure now')

    res.json({ reply, isReady })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ── Route 2: Full 3-agent flow (Generate → Review → Pipeline) ────────────────
// Called after clarification is complete, receives the full conversation summary
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

    // ── AGENT 3: Generate Pipeline ─────────────────────────────────────────
    send('step', { step: 3, status: 'running', label: 'Generating GitLab CI pipeline...' })

    const pipeline = await runAgent(
      SKILL_PIPELINE,
      `Generate a GitLab CI pipeline for this OpenTofu infrastructure:\n\n${tfFiles}\n\nSecurity review context:\n${reviewReport}`
    )

    send('step',   { step: 3, status: 'done', label: 'Pipeline generated ✅' })
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

// ── Route 4: Follow-up chat in review mode ───────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history, mode } = req.body
  const skill = mode === 'review' ? SKILL_REVIEW : SKILL_CLARIFY

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: skill,
      messages: [...(history || []), { role: 'user', content: message }]
    })
    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 DeployMate backend running on http://localhost:${PORT}`))
