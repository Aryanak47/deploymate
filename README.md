# 🚀 DeployMate — IaC Agent

> Describe your app in plain English. Get infrastructure, security review, and a CI/CD pipeline — automatically.


---

## How It Works

DeployMate runs a **3-agent flow** powered by Claude:

```
User describes infrastructure
         ↓
[Agent 1] generate_infrastructure  →  .tf files
         ↓
[Agent 2] review_security          →  security report + fixes
         ↓
[Agent 3] generate_pipeline        →  .gitlab-ci.yml
```

Each agent has its own focused skill file — a system prompt that makes Claude an expert at that specific task.

---

## Quick Start

### 1. Backend

```bash
cd backend

# Edit .env and add your real API key:
# ANTHROPIC_API_KEY=sk-ant-...

npm install
npm run dev
```

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
deploymate/
├── backend/
│   ├── index.js                        # Express server + 3-agent flow via SSE
│   ├── skills/
│   │   ├── generate_infrastructure.md  # Agent 1 system prompt
│   │   ├── review_security.md          # Agent 2 system prompt
│   │   └── generate_pipeline.md        # Agent 3 system prompt
│   └── .env                            # Your API key goes here
│
└── frontend/
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                     # Full UI — two modes
        └── index.css
```

---

## Two Modes

**⚙️ Generate Flow** — Type what you want → 3 agents run in sequence → get .tf files, security report, and pipeline

**🔍 Review .tf** — Paste existing OpenTofu code → security agent reviews it → follow-up chat

---

## Fix Your .env

Your current `.env` has the wrong format. Change it to:

```
ANTHROPIC_API_KEY=sk-ant-your-real-key-here
PORT=3001
```

Get your API key from: https://console.anthropic.com
