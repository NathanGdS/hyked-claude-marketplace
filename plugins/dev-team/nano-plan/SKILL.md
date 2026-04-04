---
description: Initiates the Spec-Driven Development flow by planning features and setting up the .shadow structure.
tags: [sdd, planning, spec]
name: hyked-dev:nano-plan
---

# Command: /shadow-plan

**Function**:
1. Drafts User Stories (US) based on feature name and description.
2. Manages the Approval / Iteration / Rejection cycle with the user.
3. Upon approval: increments `./shadow/counter`, creates the WIP directory, and writes **2 files** — `root.md` and `spec_state.json`.

**Usage**:
```
/shadow-plan "Feature Name" --desc="Detailed description"
```

---

## Workflow

### Step 1 — Draft US

Read `./shadow/counter` to determine next ID (e.g. `0012`). Present stories to the user:

```
Feature: {Feature Name}  [ID: XXXX]

US-1: {Title} — {one-line summary}
US-2: {Title} — {one-line summary}
...

```

### Step 2 — Decision loop

Use `AskUserQuestion` to ask:
- **approve** → proceed to Step 3
- **iterate** "feedback"` → revise US and re-present
- **reject** → halt, write nothing and wait for new instructions


### Step 3 — Write output (2 files only)

**Increment counter**: write `XXXX` (zero-padded to 4 digits) to `./shadow/counter`.

**Create directory**: `.shadow/wip/XXXX-{feature-name}/`

---

#### File 1: `root.md`

Human-readable feature context. Template:

```markdown
# XXXX — {Feature Name}

## Description
{What this feature does and why}

## Tech Context
{Relevant stack notes, constraints, patterns to follow}

## Out of Scope
{Explicit exclusions, if any}
```

---

#### File 2: `spec_state.json`

Machine state — all US specs and statuses. Schema:

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
      "spec": "{Full spec as escaped string: acceptance criteria, technical details, files to touch}"
    }
  ]
}
```

**Rules**:
- `status` is always `"pending"` at creation time.
- `spec` is a single string with `\n` for newlines. Include: acceptance criteria, technical approach, and files likely affected.
- Do not create any other files (no individual `US-X.md` files).

---

## Output Structure

```
.shadow/
├── counter          ← updated to XXXX
└── wip/
    └── XXXX-{feature-name}/
        ├── root.md           ← human context
        └── spec_state.json   ← all US specs + status
```
