import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
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
function ResultPanel({ terraform, review, pipeline }) {
  const [tab, setTab] = useState(null)

  useEffect(() => { if (terraform && !tab) setTab('terraform') }, [terraform])
  useEffect(() => { if (pipeline) setTab('pipeline') }, [pipeline])

  const tabs = [
    { id: 'terraform', label: '📁 .tf Files',       available: !!terraform },
    { id: 'review',    label: '🔍 Security Review', available: !!review    },
    { id: 'pipeline',  label: '🚀 GitLab Pipeline', available: !!pipeline  },
  ]

  const content = { terraform, review, pipeline }[tab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => t.available && setTab(t.id)} style={{
            padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 12,
            background: tab === t.id ? 'var(--bg3)' : 'transparent',
            border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: !t.available ? 'var(--text3)' : tab === t.id ? 'var(--accent)' : 'var(--text2)',
            cursor: t.available ? 'pointer' : 'default', transition: 'all 0.15s', marginBottom: -1
          }}>
            {t.label}{!t.available && <span style={{ marginLeft: 6, opacity: 0.4 }}>···</span>}
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
      <ReactMarkdown components={{
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
        h2: ({ children }) => <h2 style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 2, marginTop: 24, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: 'var(--text)', fontSize: 13, marginTop: 16, marginBottom: 8 }}>{children}</h3>,
        p: ({ children }) => <p style={{ color: 'var(--text2)', marginBottom: 10 }}>{children}</p>,
        li: ({ children }) => <li style={{ color: 'var(--text2)', marginBottom: 4 }}>{children}</li>,
        ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ul>,
        strong: ({ children }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />,
      }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ── Chat Message ──────────────────────────────────────────────────────────────
function ChatMessage({ role, content }) {
  return (
    <div style={{
      display: 'flex', gap: 12, marginBottom: 16,
      animation: 'fadeUp 0.3s ease both',
      flexDirection: role === 'user' ? 'row-reverse' : 'row'
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: role === 'user' ? 'var(--accent2)' : 'var(--bg3)',
        border: `1px solid ${role === 'user' ? 'var(--accent2)' : 'var(--border)'}`,
        fontSize: 12, fontFamily: 'var(--font-mono)'
      }}>
        {role === 'user' ? 'U' : '⚙'}
      </div>
      <div style={{
        flex: 1, padding: '10px 14px',
        background: role === 'user' ? 'rgba(0,136,255,0.08)' : 'var(--bg2)',
        border: `1px solid ${role === 'user' ? 'rgba(0,136,255,0.2)' : 'var(--border)'}`,
        borderRadius: role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
        maxWidth: '85%'
      }}>
        <MarkdownContent content={content} />
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('generate')

  // Generate flow state
  const [description, setDescription] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState([
    { label: 'Generate .tf infrastructure files', status: 'waiting' },
    { label: 'Review for security issues',        status: 'waiting' },
    { label: 'Generate .gitlab-ci.yml pipeline',  status: 'waiting' },
  ])
  const [terraform, setTerraform] = useState(null)
  const [review,    setReview]    = useState(null)
  const [pipeline,  setPipeline]  = useState(null)
  const [hasResult, setHasResult] = useState(false)

  // Review chat state
  const [tfInput,     setTfInput]     = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput,   setChatInput]   = useState('')
  const [isChatting,  setIsChatting]  = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // ── Generate Flow ─────────────────────────────────────────────────────────
  const runGenerateFlow = async () => {
    if (!description.trim() || isRunning) return
    setIsRunning(true)
    setHasResult(false)
    setTerraform(null); setReview(null); setPipeline(null)
    setSteps([
      { label: 'Generate .tf infrastructure files', status: 'waiting' },
      { label: 'Review for security issues',        status: 'waiting' },
      { label: 'Generate .gitlab-ci.yml pipeline',  status: 'waiting' },
    ])

    const es = new EventSource(`/api/generate-flow?description=${encodeURIComponent(description)}`)

    es.addEventListener('step', e => {
      const { step, status, label } = JSON.parse(e.data)
      setSteps(prev => prev.map((s, i) => i === step - 1 ? { ...s, status, label } : s))
    })
    es.addEventListener('result', e => {
      const { type, content } = JSON.parse(e.data)
      if (type === 'terraform') setTerraform(content)
      if (type === 'review')    setReview(content)
      if (type === 'pipeline')  setPipeline(content)
    })
    es.addEventListener('done', () => {
      setHasResult(true)
      setIsRunning(false)
      es.close()
    })
    es.addEventListener('error', () => {
      setIsRunning(false)
      es.close()
    })
  }

  // ── Review Chat ───────────────────────────────────────────────────────────
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
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

        {/* Mode switcher */}
        <div style={{
          display: 'flex', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2
        }}>
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
          {' '}CLAUDE SONNET 4.6
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 20 }}>

        {/* ════ GENERATE MODE ════ */}
        {mode === 'generate' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, height: '100%' }}>

            {/* Left: Input */}
            <div style={{ ...panelStyle, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 2, marginBottom: 16 }}>
                DESCRIBE YOUR INFRASTRUCTURE
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && runGenerateFlow()}
                placeholder={"Examples:\n\n\"A Node.js API on GCP with PostgreSQL and Redis\"\n\n\"An S3 bucket with CloudFront CDN on AWS\"\n\n\"A Kubernetes cluster on GCP for microservices\""}
                style={{
                  flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 14, color: 'var(--text)', resize: 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
                  outline: 'none', minHeight: 200, transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={runGenerateFlow}
                disabled={isRunning || !description.trim()}
                style={{
                  marginTop: 12, padding: '12px 20px', borderRadius: 8,
                  background: isRunning ? 'var(--bg3)' : 'var(--accent)',
                  border: `1px solid ${isRunning ? 'var(--border)' : 'var(--accent)'}`,
                  color: isRunning ? 'var(--text3)' : '#000',
                  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                  cursor: isRunning ? 'not-allowed' : 'pointer', letterSpacing: 1, transition: 'all 0.15s'
                }}
              >
                {isRunning ? '◌ RUNNING AGENTS...' : '▶ RUN AGENT FLOW  ⌘↵'}
              </button>

              {(isRunning || hasResult) && (
                <div style={{ marginTop: 16 }}>
                  <StepIndicator steps={steps} />
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '⚙️', label: 'Agent 1', desc: 'Generates .tf files' },
                  { icon: '🔍', label: 'Agent 2', desc: 'Reviews security' },
                  { icon: '🚀', label: 'Agent 3', desc: 'Builds CI pipeline' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', minWidth: 60 }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Results */}
            <div style={panelStyle}>
              {hasResult || isRunning
                ? <ResultPanel terraform={terraform} review={review} pipeline={pipeline} />
                : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text3)' }}>
                    <div style={{ fontSize: 48, opacity: 0.3 }}>🏗️</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', lineHeight: 2 }}>
                      Describe your infrastructure on the left<br />
                      <span style={{ fontSize: 11 }}>Three agents will run: Generate → Review → Pipeline</span>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* ════ REVIEW MODE ════ */}
        {mode === 'review' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: '100%' }}>

            {/* Left: .tf input */}
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
                  fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, outline: 'none', transition: 'border-color 0.15s'
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

            {/* Right: Chat */}
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
                {isChatting && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', animation: 'pulse-accent 1s ease infinite' }}>
                    ◌ Agent thinking...
                  </div>
                )}
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
        )}
      </div>
    </div>
  )
}
