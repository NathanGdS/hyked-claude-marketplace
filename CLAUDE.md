# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Is

A Claude Code plugin marketplace implementing **Spec-Driven Development (SDD)** — structured feature planning via User Stories, parallel implementation by worker agents, and gated finalization. No build system; all components are markdown files.

Registry: `.claude-plugin/marketplace.json` — source of truth for plugin names, versions, and paths.

---

## Plugin Structure

```
plugins/
├── default/          → hyked-default plugin (general utilities)
│   └── skills/
│       ├── commiter/
│       ├── obsidian-note/
│       ├── skill-creator/
│       ├── skill-tester/
│       └── write-prd/
└── dev-team/         → hyked-dev plugin (SDD workflow)
    ├── skills/
    │   ├── shadow-plan/
    │   ├── shadow-run/
    │   ├── shadow-finish/
    │   ├── shadow-docs/
    │   └── shadow-nano/
    └── agents/
        ├── spec-architect.md
        ├── code-specialist.md
        ├── review-agent.md
        ├── spec-archivist.md
        └── spec-writer.md
```

Skills are auto-discovered from `SKILL.md` files. Agents are auto-discovered from `agents/*.md` files. Both use YAML frontmatter for registration.

---

## Frontmatter Schemas

**Skill (`SKILL.md`):**
```yaml
---
name: {namespace}:{skill-name}   # e.g., shadow.plan or hyked:commiter
description: |
  What it does and when to trigger
tags: [tag1, tag2]
---
```

**Agent (`agents/*.md`):**
```yaml
---
name: shadow:{agent-name}        # e.g., shadow:spec-architect
description: What this agent does
model: sonnet                    # sonnet | haiku | opus
color: blue
memory: project
---
```

---

## SDD Workflow (Shadow Pipeline)

The `.shadow/` directory is created at runtime — not committed initially.

```
.shadow/
├── counter                          ← 4-digit ID, e.g. "0003"
├── wip/
│   └── 0003-feature-name/
│       ├── spec/
│       │   ├── root.md             ← [ ] US-1, [ ] US-2, ...
│       │   ├── US-1.md
│       │   └── US-2.md
│       └── results/
│           ├── US-1.json           ← written by code-specialist
│           └── US-2.json
└── features/
    └── 0003-feature-name.md        ← archived post-finish
```

**Pipeline phases:**
1. `/shadow-plan` → `spec-architect` decomposes to User Stories → approval cycle → writes `spec/`
2. `/shadow-run` → spawns parallel `code-specialist` agents per batch → each routes to `review-agent` → updates `root.md` checkboxes
3. `/shadow-finish` → `spec-archivist` validates all stories complete → archives to `features/` → deletes `wip/`
4. `/shadow-docs` → `spec-writer` reads archived feature + changed files → generates Mermaid flow docs
5. `/shadow-nano` → runs all phases in sequence (Research → Plan → Run → Finish)

**Gate:** `shadow-finish` MUST NOT archive if any `[ ]` checkbox remains in `root.md`.

---

## Rules for Adding Skills

1. **TDD discipline is mandatory.** Use `hyked:skill-creator` — it enforces RED-GREEN-REFACTOR. Do not write the skill before testing scenarios without it.
2. **Anti-rationalization tables** — every discipline-enforcing skill needs one. Format:
   ```
   | Rationalization | Why It's Wrong | Required Action |
   ```
3. Place under `plugins/{plugin}/skills/{skill-name}/SKILL.md`.
4. Register namespace in frontmatter: `hyked:` for default plugin, `shadow.` for dev-team skills.

## Rules for Adding Agents

Agents are executors, not decision-makers. Every agent MUST include:
- **Blocker Criteria** — when to STOP and report, not proceed
- **Anti-Rationalization Table** — prevent skipping gates under pressure
- **Negative Constraints** — explicit list of what the agent must NOT do

Use STRONG language: MUST, STOP, FORBIDDEN, CANNOT, HARD GATE. Avoid: should, consider, try to, optional.

Enforcement words belong at the **beginning** of instructions. "MUST verify before proceeding" not "You should verify before proceeding, this is MUST."

---

## Skill Invocation

Skills are invoked via the Skill tool or `/` command:
```
/shadow-plan "Feature Name" --desc="Description"
/shadow-run [FEATURE_ID] --parallel=N    # default 2, max 5
/shadow-finish [FEATURE_ID]
/shadow-docs [FEATURE_ID] --dist=[PATH]
/shadow-nano "Feature Name" --desc="Description"
/write-prd
```

Agents are dispatched via the `<dispatch_required agent="shadow:agent-name">` block inside skills, which maps to `Agent(subagent_type: "shadow:agent-name", ...)`.

---

## Commits

Use `hyked:commiter` skill. Conventional Commits format. No "Co-authored-by" or AI metadata in commit messages.
