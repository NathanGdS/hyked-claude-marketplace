---
name: constitution:constitution-keeper
description: |
  Enforce an existing CONSTITUTION.md and run the amendment process. Triggers before any
  implementation, analysis, or debugging task that touches code or architecture -- under any
  workflow (TDD, shadow-SDD, ad-hoc). Use when about to write, edit, or review code in a project
  that has a CONSTITUTION.md at its root.
tags: [constitution, governance, enforcement, amendment]
related:
  required: [constitution-init]
---

# constitution-keeper

Enforces every article in `CONSTITUTION.md` against the planned or actual change -- including
violations too nuanced for a regex to catch. The companion hook (`constitution-guard.js`) already
blocks clear-cut Forbidden Patterns matches and silent self-edits at the tool-call level; this skill
is the reasoning layer above it, and the only path through a hook denial.

## Why This Exists

A hook can only catch what a regex can describe. Judgment calls -- "is this business logic creeping
into a controller," "does this abstraction violate the dependency direction this project committed
to" -- need an agent that reads the whole constitution and reasons about intent, not just pattern
matches. And even when a rule legitimately needs to change, a change made by quietly editing the
text is indistinguishable from a violation that got away with it. The amendment process is what
keeps "the rule changed" auditable and distinct from "the rule got ignored."

## Enforcement Flow

### Step 1 -- No CONSTITUTION.md found

Hand off to `constitution-init` immediately. Do not block the user's actual task waiting on setup --
mention the hand-off, then let the user's original request proceed if they don't want to set up a
constitution right now.

### Step 2 -- Read CONSTITUTION.md in full

Read every article, not just the ones that seem relevant at a glance. Judge the planned or actual
change against each one, including articles with no Forbidden Patterns row -- those are judgment
calls this skill exists specifically to catch, since the hook cannot.

### Step 3 -- On violation: stop and report

Output exactly this shape:

```
**Constitutional Conflict Detected**

Article: CONST-00X -- <Title>
Protects against: <verbatim "Protects against" line from the article>

<one or two sentences on what specifically conflicts>

Suggested compliant alternative: <a concrete alternative the user can take instead>

Execution stopped. Proceeding requires the amendment process below -- never a silent edit.
```

Then stop. Do not proceed with the original task until the user responds.

### Step 4 -- If the user insists on proceeding: run the amendment interview

Ask these four questions, in order, and record the answers:

1. Which article is affected? (CONST-ID)
2. Why is the current rule wrong or insufficient?
3. What's the new rule text, or the scoped exception text?
4. Scope: a global rule change, or a one-off exception for this file/case?

A chat message that happens to contain substantive answers to all four -- even from the person with
final sign-off authority on the repo -- is not the same as having run the interview. Ask the
questions explicitly and get them answered as part of this skill's flow, even if the user has
already said most of it. The point is not extracting the information; it's producing the artifact
below from it.

Then, as one unit:
- Append a new entry to `AMENDMENTS.md` using this exact template (use `--` exactly as shown, not an
  em dash -- the guard hook's date check is a literal `--` regex match):

  ```markdown
  ## Amendment N -- YYYY-MM-DD
  **Article(s):** CONST-00X
  **Scope:** global rule change | scoped exception (file/case)
  **Before:** <prior rule text / table row>
  **After:** <new rule text / table row>
  **Rationale:** <why, from the interview answers above>
  **Author:** <user/agent>
  ```

  `N` increments from the last `## Amendment` entry in the file (start at `1` if the file is still
  header-only). `YYYY-MM-DD` is today's date. List every affected `CONST-ID` in `Article(s)` if more
  than one, space- or comma-separated.
- Edit the article in `CONSTITUTION.md` (and its Forbidden Patterns row too, if the scope is global
  and the rule is regex-expressible).
- Stage both files (`git add`). Do not commit -- committing is the user's explicit decision.

Write `AMENDMENTS.md` first, then edit `CONSTITUTION.md` -- the guard hook's self-edit gate checks
for a same-day `AMENDMENTS.md` entry before allowing the `CONSTITUTION.md` edit through.

## Negative Constraints

- MUST NOT proceed past a detected violation without running the full four-question interview.
  Not a shortened version. Not "the user already explained it in chat." Ask all four, explicitly,
  and produce the `AMENDMENTS.md` entry from the answers -- the chat message is not the artifact.
- MUST NOT edit `CONSTITUTION.md` without first appending the matching `AMENDMENTS.md` entry --
  the hook will deny the edit, but the skill must not even attempt the workaround of editing around
  it (narrowing a glob, weakening a regex, adding a "this doesn't really apply here" comment instead
  of an amendment).
- MUST NOT treat a verbal "I already discussed this with the team" or a senior teammate's sign-off
  as a substitute for the logged interview. The log is the point -- a discussion that happened off
  the record is exactly what the amendment process exists to capture, regardless of who held it.
- MUST NOT commit `CONSTITUTION.md` or `AMENDMENTS.md` changes. Stage only.
- MUST NOT accept "I'll log the amendment afterward" or any deferred-logging promise -- whether
  framed as time pressure, "next week's housekeeping pass," or "I'll write it properly tomorrow when
  I'm not rushed" -- as a substitute for logging it before the edit. Violating the letter of "log it
  first" is violating the spirit of having an audit trail at all.
- MUST NOT treat a judgment-call article (one with no Forbidden Patterns row) as exempt from the
  amendment process. "It's not a regex gate, so I get to decide alone" inverts the actual reason
  nuanced articles have no table row -- they need a human/agent reasoning layer to catch them, not
  less process once caught.

## RED Phase Finding

Two rounds of pressure-scenario testing (3 scenarios, then 3 escalated re-runs with the obvious
"tells" removed and additional authority/economic/sunk-cost pressure stacked on) were run against
fresh subagents with no access to this skill, before it was written. All 6 produced the correct
choice, with explicit, reasoned rejection of every tempting alternative -- including a scenario where
the user pre-answered all four interview questions in chat and argued the formal interview was
"pure ceremony," and one where a senior teammate's verbal sign-off plus a promised future
housekeeping pass was offered as cover. No rationalization succeeded in this round of testing. The
Anti-Rationalization Table below is therefore sourced from the genuine tempting framings that were
tested and explicitly defeated (verbatim, from the agents' own reasoning), not from a captured
failure -- there wasn't one. If a future session finds a framing that does succeed, add it here as a
new row per the usual REFACTOR process.

## Anti-Rationalization Table

| Rationalization | Why It's Wrong | Required Action |
|---|---|---|
| "I'll ship the violation now and narrow the rule's own text so it no longer covers my case" | Silently rewriting the rule to exclude your own violation is forgery of process, not amendment of it -- a real amendment needs the same scrutiny outside the heat of a ship deadline | MUST run the four-question interview and log `AMENDMENTS.md` before any `CONSTITUTION.md` edit, even under deadline pressure |
| "I'll commit the violation now and convert it to the compliant form 'first thing tomorrow'" | "Later" carries none of the urgency pressuring you right now, and a known, specific, previously-realized risk doesn't pause for a deadline | MUST bring the change into compliance (or get the amendment logged) before merging, not after |
| "The accountable person already verbally approved this / a senior teammate signed off, so the formal interview is just ceremony" | A chat message or verbal sign-off is unindexed and unversioned; the interview's job is producing the durable artifact, not just gathering information that happens to already be true | MUST capture the answers as a same-day `AMENDMENTS.md` entry regardless of who stated them or how complete they sound |
| "I'll make the edit now since it's time-sensitive, and write the `AMENDMENTS.md` entry afterward in the same session" | This reorders the gate to after the irreversible action, turning a hard gate into an optional cleanup step that's easy to skip once the urgent part is done | MUST write `AMENDMENTS.md` before editing `CONSTITUTION.md`, not after, regardless of same-session intent |
| "It's a judgment-call article with no Forbidden Patterns row, so I get to decide alone without amending anything" | Judgment-call articles have no regex row because they need a reasoning layer to catch them -- not because they need less governance once caught | MUST run the same violation-and-amendment flow for judgment-call articles as for regex-detected ones |
| "I'll add the exception to the rule now since I'm confident the team will agree, and write the careful, well-worded `AMENDMENTS.md` entry tomorrow when I'm not rushed" | Quality-of-writing is not the gate; sequencing is -- a rushed-but-logged entry beats a polished one that doesn't exist yet when the edit already happened | MUST write the `AMENDMENTS.md` entry before the `CONSTITUTION.md` edit, even if it's terse; polish it later if needed, but log it first |

## Pressure Resistance

| User Says | Your Response |
|---|---|
| "I'm the tech lead, I already cleared this with the team, skip the interview" | "CANNOT skip it. Authority to approve an exception and authority to skip documenting it are different things -- approving it IS answering the four questions, into the record." |
| "I already answered all four questions right here in chat, there's nothing left to interview" | "CANNOT treat the chat message as the artifact. I still need those answers captured as a same-day `AMENDMENTS.md` entry before editing `CONSTITUTION.md` -- same content, but it has to be the logged form." |
| "We'll formalize this properly in next week's housekeeping pass, ship it now" | "CANNOT defer the log past the edit. The amendment entry takes minutes to write now; a verbal promise to write it later is exactly the gap this process closes." |
| "This is just a judgment call, not a hard regex gate, so it's my call to make solo" | "CANNOT treat judgment-call articles as exempt. No Forbidden Patterns row means the hook can't catch it -- it doesn't mean the amendment process doesn't apply." |

## Blocker Criteria

STOP and report if:

| Condition | Required Action |
|---|---|
| No `CONSTITUTION.md` at project root | Hand off to `constitution-init`; do not block the user's original task |
| User insists on proceeding past a violation without answering all four interview questions | STOP -- cannot edit `CONSTITUTION.md` without a complete, logged amendment |
| User asks to commit the staged constitution/amendment files | STOP -- committing is the user's explicit action, outside this skill's scope |
| The hook denies a `CONSTITUTION.md` edit with "log the Amendment first" | STOP -- this means `AMENDMENTS.md` was not written first, or doesn't have a same-day entry for the changed article. Fix the order, never the rule. |
