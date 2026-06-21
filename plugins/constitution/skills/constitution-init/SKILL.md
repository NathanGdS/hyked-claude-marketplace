---
name: constitution:constitution-init
description: |
  Bootstrap a new CONSTITUTION.md and AMENDMENTS.md for the current project via an interview.
  Use when the user says "set up a constitution", "create CONSTITUTION.md", "init constitution",
  or wants architectural rules enforced going forward. Also used as the hand-off target when
  constitution-keeper finds no CONSTITUTION.md in the project.
tags: [constitution, governance, setup]
---

# constitution-init

Bootstraps a `CONSTITUTION.md` / `AMENDMENTS.md` pair at the project root through an interview.
Drafts are always presented for approval before any file is written — never auto-written from
inference alone.

## Negative Constraints

- MUST NOT write `CONSTITUTION.md` or `AMENDMENTS.md` without presenting every candidate rule to
  the user first and getting explicit confirmation.
- MUST NOT commit the files it writes. Stage only (`git add`). Committing is the user's explicit
  decision.
- MUST NOT create a `CLAUDE.md` solely to add the constitution pointer. If the project has no
  `CLAUDE.md`, skip step 5 entirely.
- MUST NOT invent a regex/glob for a rule that is actually a judgment call. Nuanced rules get an
  `Implemented in` reference and rationale, but no Forbidden Patterns row — they're enforced by
  `constitution-keeper`'s reasoning layer at edit time, not by the hook.

## Steps

### Step 1 — Scan the project

Look at the project structure, manifest files (`package.json`, `pyproject.toml`, `go.mod`, etc.),
and recent commit history (`git log --oneline -30`). From this, draft 3-8 **candidate** rules —
things the codebase already seems to do consistently, or stated conventions found in existing docs
(`CLAUDE.md`, `CONTRIBUTING.md`, `README.md`). Present the candidates as a numbered list. These are
drafts only — nothing is written yet.

### Step 2 — Interview, per candidate rule

For each candidate the user wants to keep (and any new ones they raise), collect:

1. **Title** — short, e.g. "No raw SQL outside the repository layer"
2. **Rule** — the actual constraint, stated as an instruction
3. **Rationale** — why this exists
4. **Protects against** — the concrete failure mode this prevents
5. **Exceptions** — any carve-outs, or "None"
6. **Implemented in** — a freeform pointer to where this is enforced or demonstrated: a file, a
   folder, a PR number, a commit hash. If there's no specific reference yet, use the literal value
   `Foundational (predates constitution)`.

### Step 3 — Forbidden Patterns table, where applicable

For each rule that is a clear-cut, regex-detectable anti-pattern (a banned function call, a banned
import, a banned file in a banned location), also collect:

- **File scope (glob)** — which files this applies to, e.g. `src/**/*.ts`
- **Pattern (regex)** — the anti-pattern to detect, e.g. `\bany\b` for "no `any` type in TypeScript"

Confirm the regex actually matches what the user means by testing it against 1-2 real file
snippets from the project, mentally or by grepping. A row that's too broad (matches legitimate code)
or too narrow (misses the actual violation) is worse than no row — ask the user to refine it or drop
it to the reasoning-layer-only category instead.

Rules too nuanced for regex (architectural judgment calls, like "business logic must not leak into
controllers") get no Forbidden Patterns row. They're still full articles — `constitution-keeper`
enforces them by reading and reasoning, not by pattern match.

### Step 4 — Write the files

Write `CONSTITUTION.md` at the project root using this exact per-article template, one block per
article, in the order discussed:

```markdown
# <Project Name> Constitution

### CONST-001 -- <Title>
**Rule:** <the constraint, stated as an instruction>
**Rationale:** <why this exists>
**Protects against:** <the concrete failure mode this prevents>
**Exceptions:** <carve-outs, or "None">
**Implemented in:** <freeform pointer, or "Foundational (predates constitution)">

### CONST-002 -- <Title>
...

## Forbidden Patterns

| Pattern | Violates | File scope (glob) | Pattern (regex) |
|---|---|---|---|
| <short label> | CONST-00X | <glob> | <regex> |

## Amendment History

See AMENDMENTS.md
```

Number articles sequentially starting at `CONST-001`. Only rules from Step 3 get a Forbidden
Patterns row; nuanced rules still get a full article block, just no table row.

Write `AMENDMENTS.md` at the project root with header only — no entries yet:

```markdown
# Amendments

```

Stage both files:

```bash
git add CONSTITUTION.md AMENDMENTS.md
```

Do not commit. Tell the user the files are staged and ready for review.

### Step 5 — CLAUDE.md pointer (only if CLAUDE.md already exists)

If the project has no `CLAUDE.md`, skip this step entirely — never create one solely for this.

If `CLAUDE.md` exists:
- If it already has a `## Constitution` section, replace its body with the single line:
  `See \`constitution-keeper\` skill (auto-triggers before implementation/analysis/debugging tasks).`
- If it has no `## Constitution` section, ask the user whether to append one with that same line.
  Only append on explicit confirmation.

Stage the change (`git add CLAUDE.md`) if made. Do not commit.

## Blocker Criteria

STOP and report if:

| Condition | Required Action |
|---|---|
| User wants files written before any candidate rule was discussed | STOP — run Step 1-2 first |
| User wants a Forbidden Patterns row for a rule that is actually a judgment call | STOP — explain the distinction, offer the reasoning-layer-only article instead |
| `CONSTITUTION.md` already exists at the project root | STOP — this is a re-init, not a fresh bootstrap. Tell the user the file exists and ask if they want to add articles via the amendment process (`constitution-keeper`) instead |
| User asks to commit the staged files | STOP — committing is an explicit user action outside this skill's scope. Confirm staging is done; let the user run the commit themselves (or invoke a commit skill) |
