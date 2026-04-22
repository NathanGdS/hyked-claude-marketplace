---
description: Generates high-level technical documentation for an implemented feature.
tags: [sdd, documentation, flow]
name: shadow.docs
---

# shadow-docs

Spawns `shadow:spec-writer` to read the archived feature spec and modified source files, then produce Mermaid.js diagrams and flow documentation.

**Usage:**
```
/shadow-docs [FEATURE_ID] --dist=[PATH]
```

**Example:**
```
/shadow-docs 0001 --dist=./docs/technical-flows
```

## Dispatch

<dispatch_required agent="shadow:spec-writer">
Read archived feature and modified files. Generate Mermaid.js flow documentation.
</dispatch_required>

```yaml
Task:
  subagent_type: "shadow:spec-writer"
  prompt: |
    Feature ID: {FEATURE_ID argument}
    Output path: {value of --dist flag, default: ./docs}

    Steps:
    1. Read archived feature: .shadow/features/{FEATURE_ID}-*.md
       If not found → STOP: "Feature {FEATURE_ID} not found in .shadow/features/"
    2. Identify all files modified during the feature implementation from the archive.
    3. Read those source files to map the actual implementation. Do not guess or invent.
    4. Generate documentation at {output path}/{FEATURE_ID}-{feature-name}-flow.md:
       - Overview: purpose of the feature (1–2 sentences)
       - Technical Flow: Mermaid.js sequence diagram + step-by-step logic breakdown
       - Data Schema: DB/API changes with request/response examples
       - Dependencies: modules and services this feature interacts with, including edge cases
    5. Rules:
       - Do not use marketing language.
       - Do not document code outside the specified FEATURE_ID flow.
       - Do not document code you have not read.
```

## Agents

- **shadow:spec-writer**: Senior Technical Writer. Evidence-based documentation derived strictly from actual modified files. Produces Mermaid.js diagrams, API contracts, and logic breakdowns.
