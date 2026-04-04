---
description: Finalizes a feature, archives the technical specifications, and cleans up the WIP environment.
tags: [sdd, finalization, archive]
name: hyked-dev:nano-finish
---

# Command: /sdd-finish

**Function**:
1. Validates all US are complete in `spec_state.json`.
2. Generates an archive `.md` in `.hyked/features/`.
3. Deletes the WIP directory.

**Usage**:
```
/sdd-finish [FEATURE_ID]
```

---

## Implementation Instructions

### 1. Locate feature

- If `FEATURE_ID` given, use `.hyked/wip/FEATURE_ID-*/`.
- Otherwise, use the most recently modified folder in `.hyked/wip/`.

### 2. Validate

Read `spec_state.json`. If any story has `"status": "pending"`:
- Print the pending story IDs and titles.
- Abort. Do not write or delete anything.

### 3. Generate archive

Write `.hyked/features/XXXX-{feature-name}.md` using this template:

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
| US-2 | {title} | ✅ |
...

---

## Implementation Details

{
  For each US: write a concise paragraph or bullet list describing what was actually implemented.
  Pull content from us.spec + infer from any implementation context available.
  Group by layer (DB, Backend, Frontend) when it makes sense.
}

---

## Files Changed

| File | Change |
|------|--------|
| `path/to/file` | Description |
...
```

### 4. Cleanup

Delete the entire `.hyked/wip/XXXX-{feature-name}/` directory.

### 5. Confirm

Print:
```
✅ Feature XXXX archived → .hyked/features/XXXX-{feature-name}.md
🗑  WIP directory removed
```
