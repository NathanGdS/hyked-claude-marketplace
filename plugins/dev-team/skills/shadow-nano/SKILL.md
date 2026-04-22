---
name: shadow-nano
description: |
  Runs the full Spec-Driven Development pipeline in one command: Research → Plan → Run → Finish.
  Researches the codebase and docs before planning. Drafts User Stories, gets approval, spawns
  parallel worker agents per story, then archives and cleans up.
  Trigger on: /shadow-nano, "shadow nano", "run the full SDD pipeline", "plan and implement feature".

trigger: |
  - User invokes /shadow-nano
  - User asks to "plan and implement" a feature end-to-end
  - User wants the full SDD pipeline in one shot

skip_when: |
  - User wants only planning (use nano-plan)
  - User wants only implementation of existing spec (use nano-run)
  - User wants only archiving (use nano-finish)
---

# Command: /shadow-nano

**Function**: Runs the complete SDD pipeline — Research → Plan → Run → Finish — in a single invocation.

**Usage**:
```
/shadow-nano "Feature Name" --desc="Detailed description"
```

---

## Pipeline Overview

```
Phase 0: Research   → Understand codebase + docs
Phase 1: Plan       → Draft US, get approval, write .shadow structure
Phase 2: Run        → Spawn parallel workers, update spec_state.json
Phase 3: Finish     → Validate, archive, cleanup
```

Each phase gates the next. Do not skip or reorder.

---

## Phase 0 — Research

**Why this phase exists:** US written without codebase knowledge produce stories that contradict existing patterns, duplicate partial implementations, or miss architectural constraints. Research surfaces what you do not know to ask.

### What to read

1. **Docs**: `README.md`, `CLAUDE.md`, `docs/*.md`, `wiki/` — project conventions, architecture, constraints
2. **Code**: Identify the tech stack, key modules, patterns, and files most likely affected by the feature

### How to search

- Read root-level markdown files first
- Use Glob to find relevant source files (`src/**/*.ts`, etc.)
- Grep for related symbols, patterns, or existing partial implementations

### Output

Produce a **Tech Context** summary (used in root.md and passed to every worker):
- Stack and tooling
- Key patterns to follow
- Relevant files likely to be affected
- Any explicit constraints or out-of-scope areas found in docs

**Do not skip research even if:**
- The user says they will answer questions
- The feature type (dark mode, auth, etc.) seems familiar
- The description feels complete

Unknown unknowns exist in the code, not in the feature description. Research finds them.

---

## Phase 1 — Plan

### Step 1 — Clarify with user

Before drafting stories, use `AskUserQuestion` to ask 2–3 targeted questions about the feature. Base these on gaps found during research. Examples:
- "Should this feature be accessible to all user roles or restricted?"
- "Is SSR support required, or client-only is fine?"
- "Should existing partial implementation X be extended or replaced?"

### Step 2 — Draft User Stories

Read `./.shadow/counter` to get the next ID (zero-padded to 4 digits, e.g. `0012`).

Present stories:

```
Feature: {Feature Name}  [ID: XXXX]

US-1: {Title} — {one-line summary}
US-2: {Title} — {one-line summary}
...
```

### Step 3 — Decision loop

Use `AskUserQuestion` to ask:
- **approve** → proceed to Step 4
- **iterate** "feedback" → revise stories and re-present
- **reject** → halt, write nothing, wait for new instructions

### Step 4 — Write output

**Increment counter**: write `XXXX` to `./.shadow/counter`.

**Create directory**: `.shadow/wip/XXXX-{feature-name}/`

**File 1: `root.md`**

```markdown
# XXXX — {Feature Name}

## Description
{What this feature does and why}

## Tech Context
{From research phase: stack, patterns, constraints, files likely affected}

## Out of Scope
{Explicit exclusions}
```

**File 2: `spec_state.json`**

```json
{
  "id": "XXXX",
  "title": "{Feature Name}",
  "total": N,
  "stories": [
    {
      "id": "US-1",
      "title": "{Story Title}",
      "status": "pending",
      "spec": "{Full spec as escaped string: acceptance criteria, technical approach, files to touch}"
    }
  ]
}
```

Rules:
- `status` is always `"pending"` at creation
- `spec` is a single string with `\n` for newlines
- No other files created (no individual `US-X.md` files)

---

## Phase 2 — Run

### 1. Load state

Read:
- `root.md` — feature context (pass to every worker)
- `spec_state.json` — collect all stories where `status == "pending"`

If no pending stories → print "All stories complete. Proceeding to finish." and continue to Phase 3.

### 2. Spawn workers (parallel)

Default parallel limit: **2**. Override with `--parallel-limit=N`.

For each pending story, launch a `general-purpose` agent:

```
Context (root.md content)
---
Story: {us.id} — {us.title}
{us.spec}
---
Implement this story. Follow the project stack and patterns in Context.
Read relevant files before editing. Write or edit files as needed.
Report back: DONE or BLOCKED with reason.
```

### 3. Update spec_state.json after each worker

After each worker completes:
- If worker reports **DONE**: read `spec_state.json`, set matching story `"status"` to `"done"`, write file back
- If worker reports **BLOCKED**: read `spec_state.json`, set matching story `"status"` to `"blocked"`, write file back — **never mark blocked as done**

### 4. Print run summary

```
/shadow-nano run complete
✅ Done:    US-1, US-3
⚠ Blocked: US-2 — {reason}
```

If any story is blocked, **stop here**. Do not proceed to Phase 3. User must resolve and re-run.

---

## Phase 3 — Finish

### 1. Validate

Read `spec_state.json`. If **any** story has `"status": "pending"` or `"status": "blocked"`:
- Print the affected story IDs and titles
- **Abort. Write nothing. Delete nothing.**

Do not proceed until all stories are `"done"`.

### 2. Generate archive

Write `.shadow/features/XXXX-{feature-name}.md`:

```markdown
# XXXX — {title}

**Status**: Complete
**Archived**: {today's date}
**User Stories**: {total} / {total}

---

## Summary

{2–4 sentence description of what was built, derived from root.md}

---

## User Stories

| ID | Title | Status |
|----|-------|--------|
| US-1 | {title} | ✅ |
...

---

## Implementation Details

{For each US: concise paragraph or bullet list of what was implemented. Group by layer when useful.}

---

## Files Changed

| File | Change |
|------|--------|
| `path/to/file` | Description |
```

### 3. Cleanup

Delete the entire `.shadow/wip/XXXX-{feature-name}/` directory.

### 4. Confirm

```
✅ Feature XXXX archived → .shadow/features/XXXX-{feature-name}.md
🗑  WIP directory removed
```

---

## Anti-Rationalization Table

| Rationalization | Why It's Wrong | Required Action |
|---|---|---|
| "User said they'll answer gaps, skip research" | User answers questions you know to ask. Research finds what you don't know to ask. | MUST run full research before planning |
| "I know this feature type (dark mode, auth, etc.)" | General knowledge ≠ this project's constraints. Architectural rules live in code, not in your training. | MUST read this project's files before drafting US |
| "Human expert on-site is higher-fidelity than grepping the code" | Expert answers known gaps; research finds gaps neither of you know exist. No human's mental model tracks current file state perfectly. | MUST run research regardless of who is present |
| "Research cost exceeds benefit under this deadline" | You cannot calculate benefit without doing research — you don't know what it would find. | MUST run research; escalate timeline to user, never silently skip |
| "Worker verbally reported DONE, JSON just wasn't updated" | spec_state.json is the source of truth. Verbal reports are not. Patching state yourself is unauthorized — it bypasses the validation the finish phase is meant to enforce. | MUST halt and report to user. Never manually patch spec_state.json during finish. |
| "PM / user said mark the blocked story as done" | A blocked story is factually not done. No authority can change that. The user can descope, defer, or re-open — but the mechanism is their action, not your state falsification. | MUST mark blocked, halt, report |
| "Core feature works, pending story is minor" | "Minor" is user's judgment, not yours. Finish phase requires all stories done — not most, not the important ones. | MUST abort finish if any story is pending |
| "Re-running from scratch wastes progress" | Progress lives in spec_state.json and code. Blocked stories are preserved. Re-run picks up only pending stories. | MUST re-run for blocked stories; done stories are not re-executed |

---

## Blocker Criteria

| Condition | Required Action |
|---|---|
| Research phase skipped | STOP — run research before planning |
| Finish attempted with any pending story | STOP — print pending IDs, abort |
| Finish attempted with any blocked story | STOP — print blocked IDs, abort |
| Blocked worker status written as "done" | STOP — this is state falsification |
| spec_state.json manually patched during finish validation | STOP — halt and report; user must resolve |

---

## .shadow Directory Structure

```
.shadow/
├── counter                          ← current feature ID (4-digit, zero-padded)
├── wip/
│   └── XXXX-{feature-name}/
│       ├── root.md                  ← human context + tech context from research
│       └── spec_state.json          ← all US specs + statuses (source of truth)
└── features/
    └── XXXX-{feature-name}.md       ← archived on finish
```
