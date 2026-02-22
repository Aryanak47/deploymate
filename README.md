# 🚀 DeployMate — IaC Agent

> Describe your app in plain English. Get infrastructure, security review, and a CI/CD pipeline — automatically.
><img width="1891" height="912" alt="image" src="https://github.com/user-attachments/assets/a51ec78e-a464-4729-86fd-93fc0d0156b0" />
> <img width="1870" height="914" alt="image" src="https://github.com/user-attachments/assets/d779ec7c-3659-451a-b599-444b31d463ff" />







---

## How It Works

DeployMate runs a **5-agent flow**:

```
User describes infrastructure
         ↓
[Agent 0] clarify_requirements     →  asks questions, collects cloud/db/scale details
         ↓
[Agent 1] generate_infrastructure  →  .tf files (OpenTofu)
         ↓
[Agent 2] review_security          →  security report + fixes
         ↓
[Agent 3] estimate_cost            →  monthly cost breakdown
         ↓
[Agent 4] generate_pipeline        →  .gitlab-ci.yml
```

Each agent has its own focused skill file — a system prompt that makes Claude an expert at that specific task.

---

## Features

- **Agent 0 Clarifier** — asks only the questions needed (cloud, database, scale) before generating anything
- **Session History** — run multiple deployments, switch between them, old sessions stay intact
- **Download ZIP** — download all generated files (`main.tf`, `.gitlab-ci.yml`, security report, cost estimate) in one click
- **Review Mode** — paste existing `.tf` files and get a security review with follow-up chat
- **Real-time streaming** — watch agents run step by step via SSE

---

## Quick Start

### 1. Backend

```bash
cd backend

# Add your Anthropic API key to .env:
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
│   ├── index.js                        # Express server + 5-agent flow via SSE
│   ├── skills/
│   │   ├── clarify_requirements.md     # Agent 0 — collects requirements
│   │   ├── generate_infrastructure.md  # Agent 1 — generates .tf files
│   │   ├── review_security.md          # Agent 2 — security review
│   │   ├── estimate_cost.md            # Agent 3 — cost estimation
│   │   └── generate_pipeline.md        # Agent 4 — GitLab CI pipeline
│   └── .env                            # Your API key goes here
│
└── frontend/
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                     # Full UI — sessions, results, ZIP download
        └── index.css
```

---

## Two Modes

**⚙️ Generate Flow** — Describe your app → Agent 0 asks clarifying questions → 4 agents run in sequence → get `.tf` files, security report, cost estimate, and GitLab pipeline. Supports multiple sessions side by side.

**🔍 Review .tf** — Paste existing OpenTofu/Terraform code → security agent reviews it → follow-up chat to ask questions or get fixes.
