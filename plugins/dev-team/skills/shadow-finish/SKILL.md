---
description: Finalizes a feature, archives the technical specifications, and cleans up the WIP environment.
tags: [sdd, finalization, archive]
name: shadow.finish
---

# shadow-finish

Spawns `shadow:spec-archivist` to validate all User Stories are complete, generate the archive document, and remove the WIP directory.

**Usage:**
```
/shadow-finish [FEATURE_ID]
```

If `FEATURE_ID` is omitted, uses the most recent folder in `.shadow/wip/`.

## Dispatch

<dispatch_required agent="shadow:spec-archivist">
Validate all US complete. Archive feature. Clean up WIP.
</dispatch_required>

```yaml
Task:
  subagent_type: "shadow:spec-archivist"
  prompt: |
    Feature ID: {FEATURE_ID argument, or most recent folder in .shadow/wip/ if omitted}

    Steps:
    1. Locate feature folder: .shadow/wip/{FEATURE_ID}-*/
       If not found → STOP: "Feature {FEATURE_ID} not found in .shadow/wip/"
    2. Read root.md. Check all User Story checkboxes.
       If any [ ] (pending) entries exist → STOP and list them:
       "Cannot finish: the following US are incomplete: US-X, US-Y"
       Do NOT archive a feature with any incomplete US.
    3. On all [x] confirmed:
       a. Create archive file: .shadow/features/{ID}-{feature-name}.md
          Content:
          - Feature Title and ID
          - Completion Date
          - List of implemented User Stories with their titles
       b. Delete WIP directory: .shadow/wip/{ID}-{feature-name}/
    4. Report:
       "Feature {ID} archived → .shadow/features/{ID}-{feature-name}.md. WIP removed."
```

## Agents

- **shadow:spec-archivist**: Librarian. Validates completion, generates the feature archive, and purges the WIP directory. Will not archive if any US is incomplete.
