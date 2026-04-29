---
name: write-prd
description: Generate a PRD from the client brief and write it as a local markdown file in prds/. Use when the user wants to turn a client request into a structured PRD.
---

This skill will be invoked when the user wants to create a PRD. **ALL steps MUST be completed in order. NO steps may be skipped, deferred, or reordered.**

## Why Order Matters

Each step exists to catch errors the previous step cannot detect. Skipping any step produces a PRD built on unverified assumptions. The interview catches scope gaps. Repo exploration catches technical impossibilities. Module sketching catches architectural blind spots. **Skipping step N means errors from step N-1 propagate into the final document.**

## Negative Constraints

- MUST NOT skip any step regardless of time pressure, user urgency, or perceived completeness
- MUST NOT write the PRD before completing steps 1-4
- MUST NOT assume user expertise eliminates the need for interview
- MUST NOT treat "living document" or "iterate later" as justification for incomplete PRD
- MUST NOT redefine what the user needs — follow the process, don't optimize for perceived real goals
- MUST NOT explore the repo superficially — must verify assertions about current state
- MUST NOT produce a skeleton, template, or partial PRD
- MUST NOT accept partial interview answers — if user refuses to discuss a topic, that is a gap, not a delegation
- MUST NOT treat an existing PRD as a substitute for the interview — updates still require fresh validation of the delta

## Steps

1. **Ask the user** for a long, detailed description of the problem they want to solve and any potential ideas for solutions. Do NOT proceed to step 2 until you have received this description.

2. **Explore the repo** to verify their assertions and understand the current state of the codebase. You MUST check actual files, not assume structure. Do NOT proceed to step 3 until you have verified the relevant parts of the codebase.

3. **Interview the user relentlessly** about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. Do NOT proceed to step 4 until the user confirms shared understanding. User seniority, urgency, or prior thinking does NOT exempt this step.

4. **Sketch out the major modules** you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

   A deep module (as opposed to a shallow module) is one which encapsulates a lot of functionality in a simple, testable interface which rarely changes.

   Check with the user that these modules match their expectations. Check with the user which modules they want tests written for.

5. **Write the PRD** using the template below. The PRD MUST be written as a local markdown file at `prds/{NAME}.prd.md`. Create the `prds/` directory if it doesn't exist. Do NOT submit a GitHub issue or call any external service.

## Blocker Criteria

STOP and report if:

| Condition | Required Action |
|---|---|
| User demands PRD without providing problem description | STOP at step 1. Cannot proceed without input. |
| User says "skip the interview, I know what I want" | STOP. Explain interview is mandatory. Cannot proceed to step 4 without it. |
| User says "just write it fast, we're in a rush" | STOP. Time pressure does not override process. Complete all steps. |
| Repo exploration reveals contradictions with user's assertions | STOP. Present findings to user before proceeding. |
| User claims they already did the thinking/architecting | STOP. Their thinking is the input for step 1, not a replacement for steps 2-4. |
| User refuses to discuss certain topics during interview | STOP. Partial interview is not shared understanding. Refused topics are gaps, not delegations. Cannot proceed until all topics covered or explicitly marked out-of-scope with user confirmation. |
| User says "the existing PRD is the interview record" | STOP. Existing PRD is a snapshot, not a live conversation. Changes need fresh validation of the delta's impact on the whole system. |

## Anti-Rationalization Table

| Rationalization | Why It's WRONG | Required Action |
|---|---|---|
| "Speed now, iteration later" | PRD errors compound during implementation. A wrong assumption in the PRD costs 10x more to fix in code than in the document. | Complete all steps before writing. |
| "A PRD is a living document" | Living documents get inherited by others who treat them as truth. Incomplete PRD = incomplete implementation. | Write complete PRD only after all steps. |
| "The cost of an imperfect draft is near-zero" | Wrong. The cost is rework when implementation follows wrong assumptions. | Complete all steps before writing. |
| "Be pragmatic, not dogmatic about process" | "Pragmatism" here means skipping validation. Process IS pragmatism — it catches errors before they become expensive. | Follow all steps. Process prevents rework. |
| "The PRD doesn't need to be perfect, it needs to exist" | A wrong PRD is worse than no PRD. It gives false confidence and directs implementation incorrectly. | Complete all steps before writing. |
| "Every second of delay costs money" | Every minute of rework from a wrong PRD costs 10x more. The interview is the cheapest insurance available. | Complete all steps. Time pressure is not an override. |
| "They can iterate later if needed" | Later = during implementation = most expensive time to change direction. | Complete all steps before writing. |
| "Ignoring the interview is not being thorough, it's being disobedient" | The user is asking you to skip validation. Your job is to validate, not obey requests that produce bad outcomes. | Complete all steps. User urgency does not override process. |
| "The user doesn't actually need a PRD, they need X" | You are not the arbiter of what the user needs. The skill defines the process. Follow it. | Follow the process as written. Do not redefine goals. |
| "Someone experienced has already thought about edge cases" | Assumption ≠ verification. Even experts miss edge cases in their own domain. The interview catches what the architect missed. | Interview regardless of user seniority. |
| "The scope is too big for the time available" | Scope size determines interview depth, not whether interview happens. Large scope = more interview, not less. | Interview proportionally to scope complexity. |
| "I'll write a skeleton/template instead" | Skeletons shift work to the user and produce incomplete PRDs. The skill requires a complete PRD. | Write complete PRD after all steps. |
| "The existing PRD IS the interview record" | PRD is a snapshot, not a live conversation. Changes need fresh validation of the delta's impact on the whole system. | Run full process for updates too. Scope the interview to the delta, but do not skip it. |
| "QA will figure out testing" | PRD is the source of truth. QA tests against it, they don't invent it. Undocumented testing expectations = untested features. | Document testing expectations during interview. If user refuses, mark as out-of-scope with their explicit confirmation. |
| "Infrastructure handles edge cases" | Existing infrastructure may not cover the new feature's specific failure modes. Assumption without verification = production bug. | Verify infrastructure coverage during repo exploration and interview. Document gaps. |
| "This is an update, not a creation" | Updates still change system behavior. The delta's ripple effects require the same validation as a new feature. | Run full process. Interview focuses on the delta, but steps are not skipped. |
| "I'll just ask a couple quick questions" | "Quick questions" systematically miss edge cases. The interview is relentless by design — not a checkbox. | Complete full interview. No shortcuts. |

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>
