import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ steps }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '16px 20px', background: 'var(--bg2)',
      border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: 2 }}>
        AGENT FLOW
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
            border: `1.5px solid ${s.status === 'done' ? 'var(--accent)' : s.status === 'running' ? 'var(--accent2)' : 'var(--border)'}`,
            background: s.status === 'done' ? 'rgba(0,255,136,0.1)' : s.status === 'running' ? 'rgba(0,136,255,0.1)' : 'transparent',
            color: s.status === 'done' ? 'var(--accent)' : s.status === 'running' ? 'var(--accent2)' : 'var(--text3)',
            animation: s.status === 'running' ? 'spin 1.2s linear infinite' : 'none'
          }}>
            {s.status === 'done' ? '✓' : s.status === 'running' ? '◌' : i + 1}
          </div>
          <span style={{
            fontSize: 13, fontFamily: 'var(--font-mono)',
            color: s.status === 'done' ? 'var(--accent)' : s.status === 'running' ? 'var(--text)' : 'var(--text3)'
          }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Result Tabs ───────────────────────────────────────────────────────────────
function ResultPanel({ terraform, review, cost, pipeline }) {
  const [tab, setTab] = useState(null)
  useEffect(() => { if (terraform && !tab) setTab('terraform') }, [terraform])
  useEffect(() => { if (pipeline) setTab('pipeline') }, [pipeline])

  const tabs = [
    { id: 'terraform', label: '📁 .tf Files',       available: !!terraform },
    { id: 'review',    label: '🔍 Security Review', available: !!review    },
    { id: 'cost',      label: '💰 Cost Estimate',   available: !!cost      },
    { id: 'pipeline',  label: '🚀 GitLab Pipeline', available: !!pipeline  },
  ]

  const content = { terraform, review, cost, pipeline }[tab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => t.available && setTab(t.id)} style={{
            padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11,
            background: tab === t.id ? 'var(--bg3)' : 'transparent',
            border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: !t.available ? 'var(--text3)' : tab === t.id ? 'var(--accent)' : 'var(--text2)',
            cursor: t.available ? 'pointer' : 'default', transition: 'all 0.15s', marginBottom: -1
          }}>
            {t.label}{!t.available && <span style={{ marginLeft: 4, opacity: 0.4 }}>···</span>}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {content
          ? <MarkdownContent content={content} />
          : <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12, paddingTop: 20 }}>Waiting for agent...</div>
        }
      </div>
    </div>
  )
}

// ── Markdown with syntax highlighting ────────────────────────────────────────
function MarkdownContent({ content }) {
  const [copied, setCopied] = useState(null)
  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const code = String(children).replace(/\n$/, '')
          const id = Math.random().toString(36).slice(2)
          if (!inline && match) {
            return (
              <div style={{ position: 'relative', margin: '12px 0' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 12px', background: '#1e1e2e',
                  borderRadius: '6px 6px 0 0', borderBottom: '1px solid var(--border)'
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>{match[1].toUpperCase()}</span>
                  <button onClick={() => copyCode(code, id)} style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                    color: copied === id ? 'var(--accent)' : 'var(--text3)',
                    padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, transition: 'all 0.15s'
                  }}>
                    {copied === id ? '✓ copied' : '⎘ copy'}
                  </button>
                </div>
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div"
                  customStyle={{ margin: 0, borderRadius: '0 0 6px 6px', fontSize: 12, lineHeight: 1.6 }} {...props}>
                  {code}
                </SyntaxHighlighter>
              </div>
            )
          }
          return <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: '0.9em' }} {...props}>{children}</code>
        },
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '16px 0', borderRadius: 8, border: '1px solid var(--border)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead style={{ background: 'var(--bg3)' }}>{children}</thead>,
        th: ({ children }) => <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--accent)', fontWeight: 700, letterSpacing: 1, fontSize: 11, whiteSpace: 'nowrap', borderBottom: '2px solid var(--border)' }}>{children}</th>,
        td: ({ children }) => <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{children}</td>,
        tr: ({ children, node }) => {
          const isLast = !node?.position
          return <tr style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{children}</tr>
        },
        h2: ({ children }) => <h2 style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 2, marginTop: 24, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: 'var(--text)', fontSize: 13, marginTop: 16, marginBottom: 8 }}>{children}</h3>,
        p: ({ children }) => <p style={{ color: 'var(--text2)', marginBottom: 10 }}>{children}</p>,
        li: ({ children }) => <li style={{ color: 'var(--text2)', marginBottom: 4 }}>{children}</li>,
        ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ol>,
        strong: ({ children }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 12, margin: '8px 0', color: 'var(--text2)' }}>{children}</blockquote>,
      }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ── Chat Message ──────────────────────────────────────────────────────────────
function ChatMessage({ role, content, isTyping }) {
  return (
    <div style={{
      display: 'flex', gap: 12, marginBottom: 16,
      animation: 'fadeUp 0.3s ease both',
      flexDirection: role === 'user' ? 'row-reverse' : 'row'
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: role === 'user' ? 'var(--accent2)' : 'var(--bg3)',
        border: `1px solid ${role === 'user' ? 'var(--accent2)' : 'var(--border)'}`,
        fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: role === 'user' ? '#fff' : 'var(--accent)'
      }}>
        {role === 'user' ? 'U' : '⚙'}
      </div>
      <div style={{
        flex: 1, padding: '12px 16px',
        background: role === 'user' ? 'rgba(0,136,255,0.08)' : 'var(--bg2)',
        border: `1px solid ${role === 'user' ? 'rgba(0,136,255,0.25)' : 'var(--border)'}`,
        borderRadius: role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
        maxWidth: '85%'
      }}>
        {isTyping
          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', animation: 'pulse-accent 1s ease infinite' }}>◌ thinking...</span>
          : <MarkdownContent content={content} />
        }
      </div>
    </div>
  )
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const SESSION_KEY = 'deploymate_session'

const saveSession = (data) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }))
  } catch (e) { console.warn('localStorage save failed:', e) }
}

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY) } catch (e) {}
}

// ── Generate Mode ─────────────────────────────────────────────────────────────
function GenerateMode() {
  const [chatHistory,  setChatHistory]  = useState([])
  const [apiHistory,   setApiHistory]   = useState([])
  const [snapshot,     setSnapshot]     = useState(null)
  const [input,        setInput]        = useState('')
  const [isThinking,   setIsThinking]   = useState(false)
  const [phase,        setPhase]        = useState('chat')
  const [restored,     setRestored]     = useState(false)

  const [steps, setSteps] = useState([
    { label: 'Generate .tf infrastructure files', status: 'waiting' },
    { label: 'Review for security issues',        status: 'waiting' },
    { label: 'Estimate monthly costs',            status: 'waiting' },
    { label: 'Generate .gitlab-ci.yml pipeline',  status: 'waiting' },
  ])

  const [terraform, setTerraform] = useState(null)
  const [review,    setReview]    = useState(null)
  const [cost,      setCost]      = useState(null)
  const [pipeline,  setPipeline]  = useState(null)

  const chatEndRef = useRef(null)
  const inputRef   = useRef(null)

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession()
    if (saved?.chatHistory?.length) {
      setChatHistory(saved.chatHistory)
      setApiHistory(saved.apiHistory || [])
      setSnapshot(saved.snapshot || null)
      setTerraform(saved.terraform || null)
      setReview(saved.review || null)
      setCost(saved.cost || null)
      setPipeline(saved.pipeline || null)
      setPhase(saved.phase || 'chat')
      setRestored(true)
    }
  }, [])

  // ── Auto-save whenever state changes ───────────────────────────────────────
  useEffect(() => {
    if (chatHistory.length > 0) {
      saveSession({ chatHistory, apiHistory, snapshot, terraform, review, cost, pipeline, phase })
    }
  }, [chatHistory, terraform, review, cost, pipeline, phase, snapshot])

  // ── Create snapshot every 8 turns to compress history ──────────────────────
  const maybeCreateSnapshot = async (history) => {
    if (history.length === 0 || history.length % 8 !== 0) return
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history })
      })
      const { snapshot: newSnap } = await res.json()
      setSnapshot(newSnap)
    } catch (e) { console.warn('Snapshot silently failed:', e) }
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, isThinking])

  const sendMessage = async () => {
    if (!input.trim() || isThinking || phase !== 'chat') return
    const userText = input.trim()
    setInput('')

    const newChatHistory = [...chatHistory, { role: 'user', content: userText }]
    const newApiHistory  = [...apiHistory,  { role: 'user', content: userText }]
    setChatHistory(newChatHistory)
    setApiHistory(newApiHistory)
    setIsThinking(true)

    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: apiHistory, snapshot })
      })
      const { reply, isReady } = await res.json()
      const updatedChat = [...newChatHistory, { role: 'assistant', content: reply }]
      const updatedApi  = [...newApiHistory,  { role: 'assistant', content: reply }]
      setChatHistory(updatedChat)
      setApiHistory(updatedApi)
      setIsThinking(false)
      // Every 8 turns, compress history into a snapshot
      maybeCreateSnapshot(updatedApi)
      if (isReady) setTimeout(() => runGenerateFlow(reply), 800)
    } catch (err) {
      console.error(err)
      setIsThinking(false)
    }
  }

  const runGenerateFlow = async (summary) => {
    setPhase('generating')
    setSteps([
      { label: 'Generate .tf infrastructure files', status: 'waiting' },
      { label: 'Review for security issues',        status: 'waiting' },
      { label: 'Estimate monthly costs',            status: 'waiting' },
      { label: 'Generate .gitlab-ci.yml pipeline',  status: 'waiting' },
    ])
    setTerraform(null); setReview(null); setCost(null); setPipeline(null)

    const es = new EventSource(`/api/generate-flow?description=${encodeURIComponent(summary)}`)

    es.addEventListener('step', e => {
      const { step, status, label } = JSON.parse(e.data)
      setSteps(prev => prev.map((s, i) => i === step - 1 ? { ...s, status, label } : s))
    })
    es.addEventListener('result', e => {
      const { type, content } = JSON.parse(e.data)
      if (type === 'terraform') setTerraform(content)
      if (type === 'review')    setReview(content)
      if (type === 'cost')      setCost(content)
      if (type === 'pipeline')  setPipeline(content)
    })
    es.addEventListener('done', () => { setPhase('done'); es.close() })
    es.addEventListener('error', () => { setPhase('chat'); es.close() })
  }

  const reset = () => {
    clearSession()
    setChatHistory([]); setApiHistory([])
    setSnapshot(null); setRestored(false)
    setInput(''); setPhase('chat')
    setTerraform(null); setReview(null); setCost(null); setPipeline(null)
    setSteps([
      { label: 'Generate .tf infrastructure files', status: 'waiting' },
      { label: 'Review for security issues',        status: 'waiting' },
      { label: 'Estimate monthly costs',            status: 'waiting' },
      { label: 'Generate .gitlab-ci.yml pipeline',  status: 'waiting' },
    ])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const panelStyle = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 16, height: '100%' }}>

      {/* Left: Chat */}
      <div style={panelStyle}>
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>
            {phase === 'chat' ? 'AGENT 0 · CLARIFIER' : phase === 'generating' ? 'RUNNING AGENTS...' : 'COMPLETE ✓'}
            {snapshot && <span style={{ marginLeft: 8, color: 'var(--accent2)', fontSize: 9, letterSpacing: 1 }}>· 📸 SNAPSHOT</span>}
          </div>
          {(chatHistory.length > 0 || phase === 'done') && (
            <button onClick={reset} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text3)', padding: '4px 10px', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text3)' }}>
              ↺ NEW
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Restored session banner */}
          {restored && chatHistory.length > 0 && (
            <div style={{
              padding: '8px 12px', marginBottom: 12,
              background: 'rgba(0,136,255,0.08)', border: '1px solid rgba(0,136,255,0.2)',
              borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent2)' }}>
                ⚡ Session restored
                {snapshot?.estimated_cost && ` · ${snapshot.estimated_cost}`}
                {snapshot?.cloud && ` · ${snapshot.cloud}`}
              </span>
              <button onClick={() => setRestored(false)} style={{
                background: 'none', border: 'none', color: 'var(--text3)',
                cursor: 'pointer', fontSize: 12, padding: '0 4px'
              }}>✕</button>
            </div>
          )}

          {chatHistory.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text3)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, opacity: 0.4 }}>💬</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 2 }}>
                Describe what you want to deploy<br />
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  "deploy a node.js app"<br />
                  "postgres database on AWS"<br />
                  "kubernetes cluster on GCP"
                </span>
              </div>
            </div>
          )}

          {chatHistory.map((msg, i) => <ChatMessage key={i} role={msg.role} content={msg.content} />)}
          {isThinking && <ChatMessage role="assistant" content="" isTyping />}

          {phase === 'generating' && (
            <div style={{ marginTop: 8 }}>
              <StepIndicator steps={steps} />
            </div>
          )}

          {phase === 'done' && (
            <div style={{ padding: '12px 16px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>
                ✅ All done! Check the results →
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={
                phase === 'chat'
                  ? chatHistory.length === 0 ? 'Describe your infrastructure...' : 'Answer above...'
                  : phase === 'generating' ? 'Agents running...'
                  : 'Done! Click ↺ NEW to start over'
              }
              disabled={phase !== 'chat' || isThinking}
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
                fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
                opacity: phase !== 'chat' ? 0.5 : 1, transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              autoFocus
            />
            <button onClick={sendMessage} disabled={phase !== 'chat' || isThinking || !input.trim()} style={{
              padding: '10px 16px',
              background: phase === 'chat' && input.trim() ? 'var(--accent)' : 'var(--bg3)',
              border: `1px solid ${phase === 'chat' && input.trim() ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
              color: phase === 'chat' && input.trim() ? '#000' : 'var(--text3)',
              cursor: phase === 'chat' && input.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, transition: 'all 0.15s'
            }}>›</button>
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
            Enter to send · Agent 0 asks questions if needed
          </div>
        </div>
      </div>

      {/* Right: Results */}
      <div style={panelStyle}>
        {terraform || review || cost || pipeline
          ? <ResultPanel terraform={terraform} review={review} cost={cost} pipeline={pipeline} />
          : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text3)' }}>
              <div style={{ fontSize: 48, opacity: 0.2 }}>🏗️</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', lineHeight: 2.2 }}>
                Results appear here after agents run<br />
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  📁 .tf Files · 🔍 Security · 💰 Cost · 🚀 Pipeline
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {[
                  { icon: '🤖', label: 'Agent 0', desc: 'Clarifies'  },
                  { icon: '⚙️', label: 'Agent 1', desc: 'Generates'  },
                  { icon: '🔍', label: 'Agent 2', desc: 'Reviews'    },
                  { icon: '💰', label: 'Agent 3', desc: 'Costs'      },
                  { icon: '🚀', label: 'Agent 4', desc: 'Pipelines'  },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20, opacity: 0.4 }}>{item.icon}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', opacity: 0.6 }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

// ── Review Mode ───────────────────────────────────────────────────────────────
function ReviewMode() {
  const [tfInput,     setTfInput]     = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput,   setChatInput]   = useState('')
  const [isChatting,  setIsChatting]  = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])

  const startReview = async () => {
    if (!tfInput.trim()) return
    const userMsg = { role: 'user', content: `Review these files:\n\`\`\`hcl\n${tfInput}\n\`\`\`` }
    setChatHistory([userMsg])
    setIsChatting(true)
    const res = await fetch('/api/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tfCode: tfInput })
    })
    const { review } = await res.json()
    setChatHistory([userMsg, { role: 'assistant', content: review }])
    setIsChatting(false)
  }

  const sendChat = async () => {
    if (!chatInput.trim() || isChatting) return
    const newHistory = [...chatHistory, { role: 'user', content: chatInput }]
    setChatHistory(newHistory)
    setChatInput('')
    setIsChatting(true)
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatInput, history: newHistory, mode: 'review' })
    })
    const { reply } = await res.json()
    setChatHistory([...newHistory, { role: 'assistant', content: reply }])
    setIsChatting(false)
  }

  const panelStyle = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: '100%' }}>
      <div style={{ ...panelStyle, padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 2, marginBottom: 16 }}>
          PASTE YOUR .TF FILES
        </div>
        <textarea
          value={tfInput}
          onChange={e => setTfInput(e.target.value)}
          placeholder={'# Paste your OpenTofu / Terraform code here\n\nresource "google_compute_instance" "vm" {\n  name         = "my-server"\n  machine_type = "e2-medium"\n  ...\n}'}
          style={{
            flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 14, color: 'var(--accent)', resize: 'none',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
            outline: 'none', transition: 'border-color 0.15s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={startReview}
          disabled={isChatting || !tfInput.trim()}
          style={{
            marginTop: 12, padding: '12px 20px', borderRadius: 8,
            background: isChatting ? 'var(--bg3)' : 'var(--accent2)',
            border: `1px solid ${isChatting ? 'var(--border)' : 'var(--accent2)'}`,
            color: isChatting ? 'var(--text3)' : '#fff',
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
            cursor: isChatting ? 'not-allowed' : 'pointer', letterSpacing: 1, transition: 'all 0.15s'
          }}
        >
          {isChatting ? '◌ REVIEWING...' : '🔍 REVIEW SECURITY'}
        </button>
      </div>

      <div style={panelStyle}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>SECURITY AGENT</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {chatHistory.length === 0
            ? <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12, paddingTop: 20, textAlign: 'center' }}>
                Paste your .tf code and click Review →
              </div>
            : chatHistory.map((msg, i) => <ChatMessage key={i} {...msg} />)
          }
          {isChatting && <ChatMessage role="assistant" content="" isTyping />}
          <div ref={chatEndRef} />
        </div>
        {chatHistory.length > 0 && (
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask a follow-up question..."
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
                fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none'
              }}
            />
            <button onClick={sendChat} disabled={isChatting || !chatInput.trim()} style={{
              padding: '8px 16px', background: 'var(--accent2)', border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700
            }}>›</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('generate')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>🚀</div>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>
              Deploy<span style={{ color: 'var(--accent)' }}>Mate</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 2 }}>
              IaC AGENT · OPENTOFU + GITLAB CI
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {[
            { id: 'generate', label: '⚙️ Generate Flow' },
            { id: 'review',   label: '🔍 Review .tf'   },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              background: mode === m.id ? 'var(--accent)' : 'transparent',
              color: mode === m.id ? '#000' : 'var(--text3)', transition: 'all 0.15s'
            }}>{m.label}</button>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
          <span style={{ color: 'var(--accent)', animation: 'pulse-accent 2s ease infinite' }}>●</span>
          {' '}In Development
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'hidden', padding: 20 }}>
        {mode === 'generate' ? <GenerateMode /> : <ReviewMode />}
      </div>
    </div>
  )
}
