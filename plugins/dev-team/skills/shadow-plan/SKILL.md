---
description: Initiates the Spec-Driven Development flow by planning features and setting up the .shadow structure.
tags: [sdd, planning, spec]
name: shadow.plan
---

# shadow-plan

Spawns `shadow:spec-architect` to decompose the feature into User Stories, run the approval cycle, and write the `.shadow/wip/` structure.

**Usage:**
```
/shadow-plan "Feature Name" --desc="Detailed description of the feature"
```

## Dispatch

<dispatch_required agent="shadow:spec-architect">
Decompose feature request into User Stories. Run approval cycle. Write .shadow/wip/ structure on approval.
</dispatch_required>

```yaml
Task:
  subagent_type: "shadow:spec-architect"
  prompt: |
    Feature: {feature name from invocation argument}
    Description: {value of --desc flag}

    Steps:
    1. Read .shadow/counter to get the next ID.
       - If file does not exist, create it with value "0001" and use "0001".
    2. Draft User Stories:
       - Each US must be atomic and independently executable in parallel.
       - Do not combine two distinct requirements into one US.
       - Format:
         ---User Stories---
         Title: {Feature Name}
         US-1: {Technical Requirement}
         US-2: {Technical Requirement}
         ...
    3. Present draft to user and wait for decision:
       - approve   → proceed to step 4
       - iterate "feedback" → revise stories and re-present from step 2
       - reject    → halt immediately, write nothing
    4. On approval:
       a. Increment .shadow/counter (e.g., "0004" → "0005").
       b. Create directory: .shadow/wip/XXXX-{feature-name}/spec/
       c. Write root.md — status tracker listing all US with [ ] checkboxes.
       d. Write US-1.md, US-2.md, ... — one file per story with:
          - Title
          - Description: "As a [System/User], I want [action] so that [outcome]."
          - Acceptance Criteria (bullet list)
    5. Return: feature ID created (e.g., "0005") and list of US titles.
```

## Output Structure (Post-Approval)

```
.shadow/
├── counter              ← e.g., contains "0005"
└── wip/
    └── 0005-feature-name/
        └── spec/
            ├── root.md  ← [ ] US-1, [ ] US-2, ...
            ├── US-1.md
            └── US-2.md
```

## Agents

- **shadow:spec-architect**: Lead architect. Decomposes feature requests into atomic User Stories, runs the approval cycle, and writes the `.shadow/wip/` structure post-approval.
