---
description: Executes the implementation of a WIP feature by orchestrating parallel worker agents.
tags: [sdd, execution, implementation]
name: hyked-dev:nano-run
---

# Command: /hyked-run

**Function**:
1. Locates the active WIP feature in `.hyked/wip/`.
2. Reads `spec_state.json` — extracts all US with `"status": "pending"`.
3. Spawns parallel worker agents, one per pending US.
4. On success, updates `status` to `"done"` in `spec_state.json`.

**Usage**:
```
/hyked-run [FEATURE_ID] [--parallel-limit=N]
```

---

## Implementation Instructions

### 1. Locate feature

- If `FEATURE_ID` is given, use `.hyked/wip/FEATURE_ID-*/`.
- Otherwise, use the most recently modified folder in `.hyked/wip/`.

### 2. Load state

Read two files:
- `root.md` — feature context and tech constraints (pass to every worker).
- `spec_state.json` — parse; collect all stories where `status == "pending"`.

If no pending stories → print "All stories complete. Run /sdd-finish." and stop.

### 3. Spawn workers (parallel)

Default `--parallel-limit` = 2. For each pending US, launch a `general-purpose` agent with:

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

### 4. Update spec_state.json

After each worker completes successfully:
- Read `spec_state.json`.
- Set the matching story's `"status"` to `"done"`.
- Write the file back.

### 5. Summary

After all workers finish, print:

```
/hyked-run complete
✅ Done:    US-1, US-3
⚠ Blocked: US-2 — {reason}
```

If any story is blocked, do NOT mark it as done. User must resolve and re-run.
