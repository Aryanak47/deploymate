# 🚀 DeployMate — IaC Agent

> Describe your app in plain English. Get infrastructure, security review, and a CI/CD pipeline — automatically.
>
> <img width="1848" height="824" alt="image" src="https://github.com/user-attachments/assets/ab9d23b7-f138-4e82-9447-7a1be8ead0b5" />
<img width="1820" height="886" alt="image" src="https://github.com/user-attachments/assets/46ae3a5e-cf4d-4b30-8958-50c094f3fe0f" />
<img width="1851" height="903" alt="image" src="https://github.com/user-attachments/assets/fc62ae54-86b9-4e24-ba73-613f17807957" />





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


