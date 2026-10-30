<div align="center">

# ⚡ XARE-AGENT

**Enterprise Autonomous AI Agent Framework**

[![CI](https://github.com/harinish45/XARE-AGENT/actions/workflows/ci.yml/badge.svg)](https://github.com/harinish45/XARE-AGENT/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Sprints](https://img.shields.io/badge/Sprints%20Complete-3%2F5-brightgreen)](SUMMARY.md)
[![Status](https://img.shields.io/badge/Status-Active%20Development-orange)](TODO.md)

> *Production-grade multi-agent orchestration for desktop automation, browser control, and multimodal AI execution*

[📋 Roadmap](TODO.md) · [📊 Sprint Summary](SUMMARY.md) · [📄 PRD](PRD.md)

</div>

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph User["👤 User Interface"]
        Desktop["🖥️ Desktop App"]
        Extension["🌐 Browser Extension"]
    end

    subgraph Orchestrator["⚡ Antigravity Orchestration Engine"]
        Router["🔀 Task Router"]
        Memory["🧠 Agent Memory"]
        ToolReg["🔧 Tool Registry"]
    end

    subgraph Agents["🤖 Specialized Agents"]
        DesktopAgent["🖥️ Desktop Agent\n(Screen + Input)"]
        BrowserAgent["🌐 Browser Agent\n(DOM + Navigation)"]
        VisionAgent["👁️ Vision Agent\n(Multimodal)"]
    end

    subgraph LLMs["🧠 LLM Backends"]
        Gemini["Google Gemini"]
        Claude["Anthropic Claude"]
        GPT["OpenAI GPT"]
    end

    Desktop --> Router
    Extension --> Router
    Router --> DesktopAgent
    Router --> BrowserAgent
    Router --> VisionAgent
    DesktopAgent <--> Memory
    BrowserAgent <--> Memory
    DesktopAgent --> LLMs
    BrowserAgent --> LLMs
    VisionAgent --> LLMs
    Router <--> ToolReg
```

---

## 🤖 Multi-Agent Flow

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant D as Desktop Agent
    participant B as Browser Agent
    participant L as LLM

    U->>O: "Book a flight to Mumbai"
    O->>O: Analyze intent & route task
    O->>B: Open browser → travel site
    B->>L: Extract form fields
    L-->>B: Field mapping
    B->>B: Fill form with user prefs
    B->>D: Take screenshot for verification
    D->>L: Verify booking details
    L-->>D: Confirm / flag issues
    D-->>O: Task complete
    O-->>U: ✅ Booking confirmed
```

---

## ✅ Sprint Progress

| Sprint | Theme | Status |
|--------|-------|--------|
| Sprint 1 | Core Orchestration Engine | ✅ Complete |
| Sprint 2 | Desktop + Browser Agents | ✅ Complete |
| Sprint 3 | Multi-Agent Coordination | ✅ Complete |
| Sprint 4 | Memory + Tool Registry | 🔧 In Progress |
| Sprint 5 | Evaluation + Optimization | 📋 Planned |

---

## 📁 Structure

```
XARE-AGENT/
├── ⚡ antigravity/          # Core orchestration engine
├── 🖥️  ai-desktop-agent/   # Desktop automation agent
├── 🌐  my-ai-extension/    # Browser extension agent
├── 📄  PRD.md              # Product requirements
├── 🗺️  ROADMAP.md          # High-level roadmap
├── 📊  SPRINT_*_SUMMARY.md # Sprint docs
└── 📋  TODO.md             # Detailed task list
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/harinish45/XARE-AGENT.git
cd XARE-AGENT/antigravity
npm install
npm start
```

---

<div align="center">
<a href="LICENSE">MIT License</a> · Built with ❤️ by harinish45
</div>