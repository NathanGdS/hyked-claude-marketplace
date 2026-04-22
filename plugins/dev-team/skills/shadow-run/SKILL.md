---
description: Executes the implementation of a WIP feature by orchestrating parallel worker agents. Use when the user invokes /shadow-run or wants to implement pending user stories from the active .shadow/wip/ feature. Spawns shadow:code-specialist agents directly (visible progress), routes each to shadow:review-agent, then verifies the build.
tags: [sdd, execution, implementation]
name: shadow.run
color: purple
---

# shadow-run

Orchestrates the full implementation of the active WIP feature. You — not a middleman agent — drive every step so the user sees progress in real time.

## Phase 1: Find and announce the target

1. If a FEATURE_ID argument was given, use `.shadow/wip/<FEATURE_ID>-*/`. Otherwise use the most recent folder in `.shadow/wip/`.
2. Parse `--parallel=N` from the invocation arguments (default: `2`, max: `5`). If N > 5, use 5 and warn the user: `⚠️  --parallel capped at 5 (requested N). Using 5.`
3. Read `root.md` — collect every US entry. Separate into:
   - **pending** (`[ ]`) — needs implementation
   - **done** (`[x]` or `[~]`) — already completed or blocked; skip entirely, do not re-read their specs
4. **Do not read any spec files yet.** Specs are loaded lazily in Phase 2, one batch at a time.
5. Create the results directory: `.shadow/wip/<feature-id>/results/` (if it doesn't exist).
6. **Tell the user** upfront:
   ```
   Feature: 0015-diff-viewer
   Pending: US-3, US-4, US-5   (US-1, US-2 already done — skipping)
   Parallel workers: 2
   Starting implementation...
   ```

## Phase 2: Implement in batches

For each batch of N pending stories:

1. **Read the spec files for this batch only** (`spec/US-N.md` for each story in the batch). Do not read specs for future batches yet.
2. Spawn shadow:code-specialist agents in a single message (one Agent tool call per story). Each agent receives:
   - The full path to the WIP folder
   - Its specific US-*.md content (full text)
   - The project's tech stack (read from README.md or CLAUDE.md if present)
   - The results output path: `.shadow/wip/<feature>/results/US-N.json`
   - **Instruction to save a compact result file** (see format below) and return only a one-line summary

3. After spawning, tell the user:
   ```
   Batch 1/3 — Spawned: US-3, US-4
   Waiting for results...
   ```

### shadow:code-specialist result file format

Each specialist must write this JSON to `.shadow/wip/<feature>/results/US-N.json` before returning:

```json
{
  "us": "US-3",
  "status": "done",
  "files_changed": ["db/environments.go", "db/environments_test.go"],
  "notes": "Added is_secret column read; decrypt on load. go test ./db/... passes."
}
```

- `status`: `"done"` or `"needs_review_attention"` (flag anything the reviewer should scrutinize closely)
- `files_changed`: list of modified/created file paths — no code, no diffs
- `notes`: one or two sentences max — only things the orchestrator or reviewer must know

**The specialist must not return code, diffs, or file contents in its reply to the orchestrator.** All detail lives on disk.

**Do not implement any code yourself.** Your role is orchestration and narration.

## Phase 3: Route each result to shadow:review-agent

As shadow:code-specialist agents complete, immediately read their result file (`.shadow/wip/<feature>/results/US-N.json`) and spawn a shadow:review-agent:

```
US-3 complete — routing to shadow:review-agent...
```

Spawn each `shadow:review-agent` with:
- The US-*.md spec (acceptance criteria) — re-read from disk now if needed
- The result JSON (compact, just loaded)
- Instruction to read the actual changed files from disk as needed, and return either `PASS` or `FAIL` with actionable feedback

You can batch shadow:review-agents for stories that completed around the same time — no need to wait for every specialist before starting any reviews.

## Phase 4: Announce each review outcome and update root.md immediately

As each shadow:review-agent returns, immediately:

1. Report to the user:
   ```
   US-3: PASS
   US-1: FAIL — toggleDiffSelection does not handle the FIFO replacement case (3rd entry should displace oldest, not newest)
   ```

2. **Update `root.md` right away** for that story — don't wait for all stories to finish. This makes the run resilient to interruptions: if something stops mid-run, completed stories stay marked.
   - `[x]` for PASS
   - `[~]` for BLOCKED (after 2 failed retries)
   - Leave `[ ]` only for stories not yet attempted

For any `FAIL`: spawn the shadow:code-specialist again with the reviewer's feedback appended, then re-route to shadow:review-agent. Cap at 2 retries per story. If a story still fails after 2 attempts, mark it as `BLOCKED` in root.md immediately and move on.

## Phase 5: Verify and report

Run these commands and show the user the actual output — do not summarize fabricated results:

```bash
# Discover and run the project's build command (check Makefile, package.json, or README.md)
# Discover and run the project's test suite
git diff --stat HEAD
```

Then give the user a final summary:

```
## Run complete — 0015-diff-viewer

Stories:  8 passed, 0 blocked
Build:    PASS
Tests:    122 passed, 2 pre-existing failures

Files changed:
  modified  frontend/src/store/historyStore.ts        (+42 -3)
  new       frontend/src/hooks/useDiff.ts             (+98)
  new       frontend/src/components/DiffViewer.tsx    (+187)
  ...
```

## Notes

- Spawn shadow:code-specialists in batches of N per the `--parallel` value. Each batch goes out in one message.
- **Never implement code yourself** — your value is in orchestration, visibility, and verification.
- **Lazy-load specs**: only read `spec/US-N.md` for the current batch, not all specs upfront.
- **Keep the orchestrator context lean**: all implementation detail lives in result files on disk. Read only the compact JSON when routing to shadow:review-agent.
- **Skip completed stories**: stories already marked `[x]` or `[~]` in root.md are never re-processed, even if the run is resumed in a new context window.
- Update root.md immediately as each story resolves — don't batch it to the end. Resilience depends on this.
- The build/test verification in Phase 5 is non-negotiable: it is the only evidence the user has that the implementation actually works.
- If the WIP folder has no pending stories (`[ ]`), tell the user and exit — nothing to do.
