# Hyked Claude Marketplace

A plugin marketplace for [Claude Code](https://claude.ai/code) implementing **Spec-Driven Development (SDD)** — structured feature planning via User Stories, parallel implementation by worker agents, and gated finalization.

## How It Works

Skills and agents are **markdown files** — no build system, no dependencies. The registry at `.claude-plugin/marketplace.json` is the source of truth for plugin names, versions, and paths.

1. **Plan** — Decompose a feature into User Stories with `/shadow-plan`
2. **Run** — Execute stories in parallel with `/shadow-run`
3. **Finish** — Validate and archive with `/shadow-finish`
4. **Document** — Generate Mermaid flow docs with `/shadow-docs`
5. **All-in-one** — Run every phase sequentially with `/shadow-nano`

## Plugins

### hyked-dev

Spec-Driven Development toolkit — plan, execute, and finalize features using a structured `.shadow` workflow with parallel worker agents.

**Skills:**

| Skill | Description |
|---|---|
| `shadow-plan` | Decompose a feature into User Stories and write the spec |
| `shadow-run` | Spawn parallel code-specialist agents per batch |
| `shadow-finish` | Validate all stories complete, then archive |
| `shadow-docs` | Generate Mermaid flow documentation |
| `shadow-nano` | Run all phases in sequence |
| `tdd` | Test-driven development with red-green-refactor loop |

**Agents:**

| Agent | Role |
|---|---|
| `spec-architect` | Decomposes features into User Stories |
| `code-specialist` | Implements a User Story with full TDD discipline (Planning → Tracer Bullet → Incremental Loop → Refactor) |
| `review-agent` | Reviews code-specialist output |
| `spec-archivist` | Validates and archives completed features |
| `spec-writer` | Generates documentation |

### hyked-default

General-purpose skills — productivity, knowledge management, and cross-tool utilities.

| Skill | Description |
|---|---|
| `commiter` | Create atomic conventional commits |
| `obsidian-note` | Convert text into Obsidian markdown notes |
| `skill-creator` | Create new skills with TDD discipline |
| `skill-tester` | Test skills against anti-rationalization scenarios |

## Project Structure

```
.
├── .claude-plugin/
│   └── marketplace.json          ← Plugin registry
├── plugins/
│   ├── default/                  ← hyked-default plugin
│   │   └── skills/
│   │       ├── commiter/
│   │       ├── obsidian-note/
│   │       ├── skill-creator/
│   │       └── skill-tester/
│   └── dev-team/                 ← hyked-dev plugin
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
└── CLAUDE.md                     ← Development conventions
```

Skills are auto-discovered from `SKILL.md` files. Agents are auto-discovered from `agents/*.md` files.

## Adding a Skill

1. Create `plugins/{plugin}/skills/{skill-name}/SKILL.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   name: {namespace}:{skill-name}
   description: |
     What it does and when to trigger
   tags: [tag1, tag2]
   ---
   ```
3. Register the namespace: `hyked:` for default, `shadow.` for dev-team

Discipline-enforcing skills require an anti-rationalization table:

```
| Rationalization | Why It's Wrong | Required Action |
```

## Adding an Agent

Agents are executors, not decision-makers. Create `plugins/{plugin}/agents/{name}.md` with frontmatter:

```yaml
---
name: shadow:{agent-name}
description: What this agent does
model: sonnet          # sonnet | haiku | opus
color: blue
memory: project
---
```

Every agent MUST include:
- **Blocker Criteria** — when to STOP and report
- **Anti-Rationalization Table** — prevent skipping gates
- **Negative Constraints** — what the agent must NOT do

Use STRONG language: MUST, STOP, FORBIDDEN, CANNOT, HARD GATE.

## License

MIT