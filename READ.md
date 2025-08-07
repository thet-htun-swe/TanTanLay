# 🧠 Claude Code – Context Engineering Guide

## 🎯 Objective

This guide outlines the setup of Claude Code with Serena MCP and defines the collaboration process between developer and senior engineer agents using structured project files.

## 🏗️ System Components

| Component              | Function              | Interactions                         |
| ---------------------- | --------------------- | ------------------------------------ |
| **Claude Code CLI**    | Main interface        | Controls terminals, connects to MCP  |
| **Serena MCP Server**  | Context management    | Stores memory, provides instructions |
| **Terminal 1 (Algo)**  | Developer agent       | Next.js/Strapi implementation        |
| **Terminal 2 (Kairo)** | Senior engineer agent | Code review and architecture         |

## 📊 Agent Workflow Overview

```mermaid
flowchart TD
    Start([Project Start]) --> Setup[Initial Setup]

    Setup --> PrepDocs[Prepare Documentation]
    PrepDocs --> RunClaude[Run Claude: /init]
    RunClaude --> InstallSerena[Install Serena MCP]
    InstallSerena --> LoadInstructions{Auto-load Success?}
    LoadInstructions -->|No| ManualLoad[Manual: /mcp*serena*initial_instructions]
    LoadInstructions -->|Yes| UpdateMemory[Update Serena Memory]
    ManualLoad --> UpdateMemory

    UpdateMemory --> Split{Split Terminals}

    Split --> Algo[Terminal 1: Algo<br/>Developer Agent]
    Split --> Kairo[Terminal 2: Kairo<br/>Senior Engineer Agent]

    Algo --> AlgoRead[Read principle.md]
    AlgoRead --> AlgoTodo[Draft task plan in todo.md]
    AlgoTodo --> AlgoImpl[Implement Code<br/>Next.js + Strapi]
    AlgoImpl --> AlgoWait{Wait for<br/>improvement.md}

    Kairo --> KairoRead[Read principle.md]
    KairoRead --> KairoReview1[Review code & todo.md]
    KairoReview1 --> KairoWrite[Write improvement.md<br/>Comments & Suggestions]

    KairoWrite --> AlgoWait
    AlgoWait --> AlgoRefactor[Read improvement.md<br/>Refactor Code]
    AlgoRefactor --> KairoReview2[Kairo: Final Review]
    KairoReview2 --> KairoFinal[Update improvement.md<br/>Final Comments]
    KairoFinal --> End([Project Complete])

    style Algo fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style Kairo fill:#50C878,stroke:#2F7C4F,color:#fff
    style AlgoRead fill:#E8F0FE,stroke:#4A90E2
    style AlgoTodo fill:#E8F0FE,stroke:#4A90E2
    style AlgoImpl fill:#E8F0FE,stroke:#4A90E2
    style AlgoRefactor fill:#E8F0FE,stroke:#4A90E2
    style KairoRead fill:#E8F8F5,stroke:#50C878
    style KairoReview1 fill:#E8F8F5,stroke:#50C878
    style KairoWrite fill:#E8F8F5,stroke:#50C878
    style KairoReview2 fill:#E8F8F5,stroke:#50C878
    style KairoFinal fill:#E8F8F5,stroke:#50C878
```

## ✅ Initial Setup

### 1. **Prepare Documentation**

- Ensure `PRD.md` is complete and accurate
- Clean and update `README.md`

### 2. **Run Claude**

```bash
/init
```

### 3. **Install Serena MCP**

Add Serena using:

```bash
claude mcp add serena -- <serena-mcp-server> --context ide-assistant --project $(pwd)
```

Example using `uvx`:

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

### 4. **Load Serena Instructions (if required)**

If Claude fails to auto-load them:

```bash
/mcp*serena*initial_instructions
```

Ensure `initial_instructions` is enabled under `included_optional_tools` in the config.

### 5. **Update Serena's Memory**

After setup, prompt Claude:

> _"Serena, please update your memory with the current project context."_

## 🧪 AI Agent Terminals (2 Required)

### 👨‍💻 Terminal 1 – **Algo** (Developer Agent)

**Tech Stack:** Next.js + Strapi

**Principles:**

- Must follow the **DRY (Don't Repeat Yourself)** principle
- **🚫 Read-only access to** `improvement.md`

**Tasks:**

1. Read `principle.md`
2. Draft a task plan in `todo.md`
3. Begin implementation based on the plan
4. After `improvement.md` is updated by Kairo, refactor accordingly

### 🧠 Terminal 2 – **Kairo** (Senior Principal Engineer Agent)

**Role:** Reviews and improves architecture and code quality

**Tasks:**

1. Read `principle.md`
2. Review code and `todo.md`
3. Write and update `improvement.md` with comments and suggestions
4. Perform a final review after Algo's refactor

## 💡 Best Practices

1. **Communication:** All inter-agent communication happens through files
2. **Iteration:** Multiple review cycles may be needed for complex features
3. **Documentation:** Keep `todo.md` updated with progress
4. **Code Quality:** Algo must strictly adhere to DRY principles
5. **Review Depth:** Kairo should provide actionable, specific feedback

## 🚀 Quick Start Commands

```bash
# Initialize Claude
/init

# Install Serena MCP
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)

# Load instructions if needed
/mcp*serena*initial_instructions

# Update memory
"Serena, please update your memory with the current project context."
```

---

_This guide ensures consistent, high-quality development through structured AI agent collaboration._
