# Hyked Claude Marketplace

> A zero-build, markdown-native plugin system for [Claude Code](https://claude.ai/code) that extends your workflow with **Spec-Driven Development (SDD)**, productivity utilities, knowledge management, and cross-tool automation — all discoverable as plain markdown files with YAML frontmatter.

---

## Why This Exists

Traditional AI coding assistants jump straight into implementation. Hyked flips that model: **spec first, code second**. Every feature is decomposed into approved User Stories before a single line is written. Parallel agents implement stories independently, and hard gates prevent incomplete work from being merged.

No build system. No dependencies. Just markdown files that Claude Code auto-discovers.

---

## Quick Start

```
/shadow-plan "Add user authentication" --desc="OAuth2 login with Google and GitHub"
/shadow-run                          # runs stories in parallel (default: 2 workers)
/shadow-finish                       # validates + archives
/shadow-docs                         # generates Mermaid flow diagrams
```

### If you are doing a small feature

```
/shadow-nano "Add user authentication" --desc="OAuth2 login with Google and GitHub"
```

---

## Plugins

### hyked-dev — Spec-Driven Development Toolkit

The core SDD engine. Manages the `.shadow/` workspace, orchestrates parallel agents, and enforces quality gates.

**Skills:**

| Command | What It Does |
|---|---|
| `/shadow-plan` | Decomposes a feature into User Stories, writes the spec, requires approval |
| `/shadow-run` | Spawns parallel `code-specialist` agents per story batch |
| `/shadow-finish` | Validates all stories are `[x]`, archives to `features/`, deletes `wip/` |
| `/shadow-docs` | Reads archived feature + changed files, generates Mermaid flow docs |
| `/shadow-nano` | Runs Plan → Run → Finish in sequence |
| `/tdd` | Enforces red-green-refactor discipline |

**Agents:**

| Agent | Model | Role |
|---|---|---|
| `spec-architect` | sonnet | Decomposes features into User Stories |
| `code-specialist` | sonnet | Implements stories with full TDD discipline |
| `review-agent` | sonnet | Reviews code-specialist output |
| `spec-archivist` | sonnet | Validates completeness, archives features |
| `spec-writer` | sonnet | Generates documentation from archived features |

### hyked-default — General-Purpose Skills

Productivity, knowledge management, and cross-tool utilities.

| Command | What It Does |
|---|---|
| `/commiter` | Creates atomic conventional commits |
| `/obsidian-note` | Converts text into Obsidian markdown notes |
| `/skill-creator` | Creates new skills with TDD discipline |
| `/skill-tester` | Tests skills against anti-rationalization scenarios |
| `/write-prd` | Generates a PRD from client brief with mandatory interview + repo exploration |

---

## The `.shadow/` Workspace

Created at runtime, never committed. Tracks feature lifecycle:

```
.shadow/
├── counter                          ← 4-digit ID counter (e.g. "0003")
├── wip/
│   └── 0003-feature-name/
│       ├── spec/
│       │   ├── root.md             ← [ ] US-1, [ ] US-2, ... (progress tracker)
│       │   ├── US-1.md             ← User Story 1 spec
│       │   └── US-2.md             ← User Story 2 spec
│       └── results/
│           ├── US-1.json           ← code-specialist output + review status
│           └── US-2.json
└── features/
    └── 0003-feature-name.md        ← archived post-finish
```

**Hard Gate:** `shadow-finish` will refuse to archive if any `[ ]` (unchecked) checkbox remains in `root.md`.

---

## Project Structure

```
.
├── .claude-plugin/
│   └── marketplace.json              ← Plugin registry (source of truth)
├── plugins/
│   ├── default/                      ← hyked-default plugin
│   │   └── skills/
│   │       ├── commiter/
│   │       ├── obsidian-note/
│   │       ├── skill-creator/
│   │       ├── skill-tester/
│   │       └── write-prd/
│   └── dev-team/                     ← hyked-dev plugin
│       ├── skills/
│       │   ├── shadow-plan/
│       │   ├── shadow-run/
│       │   ├── shadow-finish/
│       │   ├── shadow-docs/
│       │   ├── shadow-nano/
│       │   └── tdd/
│       ├── references/               ← Shared reference docs for agents
│       │   ├── tests.md
│       │   ├── mocking.md
│       │   ├── refactoring.md
│       │   ├── interface-design.md
│       │   └── deep-modules.md
│       └── agents/
│           ├── spec-architect.md
│           ├── code-specialist.md
│           ├── review-agent.md
│           ├── spec-archivist.md
│           └── spec-writer.md
├── CLAUDE.md                         ← Development conventions
└── README.md
```

---

## Adding a Skill

1. Create `plugins/{plugin}/skills/{skill-name}/SKILL.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   name: {namespace}:{skill-name}   # hyked: or shadow.
   description: |
     What it does and when to trigger
   tags: [tag1, tag2]
   ---
   ```
3. Use `hyked:skill-creator` to enforce TDD — test scenarios **before** writing the skill
4. Add an anti-rationalization table if the skill enforces discipline:
   ```
   | Rationalization | Why It's Wrong | Required Action |
   ```

## Adding an Agent

Create `plugins/{plugin}/agents/{name}.md` with frontmatter:

```yaml
---
name: shadow:{agent-name}
description: What this agent does
model: sonnet          # sonnet | haiku | opus
color: blue
memory: project
---
```

Every agent **MUST** include:
- **Blocker Criteria** — when to STOP and report, not proceed
- **Anti-Rationalization Table** — prevent skipping gates under pressure
- **Negative Constraints** — explicit list of what the agent must NOT do

Use enforcement language: MUST, STOP, FORBIDDEN, CANNOT, HARD GATE. Avoid: should, consider, try to, optional.

---

## Architecture Principles

- **Markdown-native** — skills and agents are plain `.md` files with YAML frontmatter
- **Auto-discovery** — no registration needed beyond file placement
- **Spec-first** — features are planned and approved before implementation
- **Parallel execution** — stories run concurrently via worker agents
- **Gated finalization** — incomplete work cannot be archived
- **Zero build** — no compilation, no dependencies, no tooling

---

## License

MIT
