---
name: hyked:skill-creator
description: |
  TDD-driven skill creation workflow. Use this skill whenever the user wants to create a new
  skill, build a process skill, or document a workflow as a SKILL.md. Enforces RED-GREEN-REFACTOR
  discipline: test scenarios run WITHOUT the skill first (RED), then the skill is written to fix
  observed failures (GREEN), then loopholes get closed (REFACTOR). Do NOT skip to writing the
  skill first — that defeats TDD. Trigger on: "create a skill", "make a skill for X", "build a
  skill", "write a skill", "new skill", "turn this into a skill", or any request to package
  behavior into a SKILL.md file.

trigger: |
  - User wants to create a new skill
  - User wants to document a workflow as a reusable skill
  - User says "create/build/write/make a skill for X"
  - User wants to turn a repeated process into a skill

skip_when: |
  - User only wants to EDIT an existing skill (use skill-tester for verification after edits)
  - User wants to TEST an existing skill (use skill-tester)

related:
  required: [skill-tester]
  complementary: [skill-summon]
---

# TDD Skill Creator

## Overview

Skill creation IS TDD. Same cycle, same discipline, same benefits.

You write tests before code. You run scenarios before skill. You watch it fail before you write the fix.

**The trap:** Skipping RED feels faster. It isn't. Skills written without baseline testing address imagined failures, not real ones. The skill ends up verbose, wrong, or both.

**The process in one sentence:** Watch an agent fail without your skill → write the minimal skill that fixes those exact failures → verify it works → close loopholes.

---

## Phase 0: Capture Intent

Before any testing, nail down what this skill must do.

Answer these four questions (extract from conversation history first; ask user to fill gaps):

1. **What behavior should this skill enforce or enable?**
2. **When should this skill trigger?** (which phrases, contexts, file types)
3. **What does a good output look like?** (format, structure, expected artifacts)
4. **Is this a discipline-enforcing skill or a reference skill?**
   - *Discipline-enforcing* (TDD compliance, commit format, testing requirements) → full TDD cycle required
   - *Reference* (API docs, syntax guide, lookup table) → no TDD needed, skip to GREEN directly

> **Note on reference skills:** If agents have no incentive to bypass the skill (it's pure information), TDD adds no value. Skip RED, write the skill, deploy.

Confirm with the user before proceeding.

---

## Phase 1: RED — Watch It Fail

**Goal:** Observe what agents naturally do WITHOUT the skill. Document exact failures.

This is the most important phase. If you skip it, you're writing the skill blind.

### 1.1 Design Pressure Scenarios

Write 3+ scenarios. Each scenario must:
- Combine **3+ pressure types** (single pressure = weak test)
- Present **concrete forced-choice options** (A/B/C format)
- Use **real constraints** (times, file paths, consequences)
- Ask "What do you do?" — not "What should you do?"

| Pressure Type | Example |
|---|---|
| Time | Deadline, deploy window, meeting in 10 min |
| Sunk cost | Hours of work, "waste" to undo |
| Authority | Senior says skip it, manager override |
| Economic | Job at stake, company survival, revenue impact |
| Exhaustion | End of day, tired, personal plans |
| Social | Looking dogmatic, seeming inflexible |
| Pragmatic | "Being pragmatic not dogmatic" |

**Weak scenario:** "What does the skill say about X?"
**Strong scenario:** "You spent 4 hours on this. It's 6pm. Dinner at 6:30. You forgot [skill rule]. Options: A) Delete and restart correctly tomorrow. B) Commit now. C) Adapt the rule for this case. What do you do?"

### 1.2 Run RED Subagents (Without Skill)

Spawn 1 subagent per scenario. Each subagent prompt MUST include:

```
This is a reasoning exercise only. Choose one option and explain your reasoning.
Do NOT write files, create directories, run commands, or take any real action.
[scenario text]
```

**Containment is non-negotiable.** If a RED subagent takes real actions, that is a test failure — the containment instruction was missing. Add it and re-run.

### 1.3 Document Failures Verbatim

Capture exact wording of rationalizations. Paraphrasing loses the loophole.

For each subagent that chose the wrong option:
- Quote their exact rationalization
- Note which pressures triggered the violation
- Note any "hybrid approaches" or reframes

Each rationalization found in RED = one row to add to the Anti-Rationalization Table (mandatory, do it now).

### 1.4 If RED Produces No Failures

Two possibilities:

**A) Scenarios weren't pressurized enough.** Check: do they combine 3+ pressures? Are options concrete? Is there a clear "bad but tempting" choice? Redesign and re-run.

**B) This failure mode doesn't exist for this skill.** If redesigned maximum-pressure scenarios still produce no failures, document the finding. The skill may still be useful as reference, but it is not preventing real failures.

Do NOT declare GREEN without first ruling out A.

---

## Phase 2: GREEN — Write the Minimal Skill

Write the skill to address the specific failures observed in RED. Nothing more.

### SKILL.md Structure

```
skill-name/
├── SKILL.md          (required)
└── examples/         (optional — reference files, worked examples)
    └── EXAMPLE.md
```

### Frontmatter Fields

```yaml
---
name: namespace:skill-name
description: |
  [What it does. When to trigger. Be specific about triggering phrases.
   Lean slightly "pushy" — skills tend to undertrigger.]

trigger: |
  - [Context 1]
  - [Context 2]

skip_when: |
  - [Context where this skill doesn't apply]

related:
  required: [other-skill]
  complementary: [optional-skill]
---
```

### Skill Body Requirements

Every discipline-enforcing skill MUST contain:

1. **Why this rule exists** — not just what the rule is. Agents follow rules better when they understand the reason.
2. **The rule itself** — explicit, unambiguous, in imperative form.
3. **Explicit negations** for each rationalization found in RED. Name the excuse and explain why it's wrong.
4. **Anti-Rationalization Table** — one row per rationalization found during RED. Format:

   | Rationalization | Why It's Wrong | Required Action |
   |---|---|---|
   | "I already tested it manually" | Manual testing ≠ skill compliance | MUST [correct action] |

5. **Pressure Resistance section** — what to say when the user pushes back:

   | User Says | Your Response |
   |---|---|
   | "Just skip this once" | "CANNOT skip. [reason]" |

6. **Blocker Criteria** — hard stops that cannot be overridden.

### Writing Guidelines

- **Explain the why.** "Delete means delete — not rename, not adapt, not archive" lands better than "NEVER keep old code."
- **Use imperative form.** "Run RED phase before writing any skill" not "You should run RED phase."
- **Avoid ALL CAPS enforcement.** Prefer explaining *why* the rule matters over shouting it.
- **Keep it lean.** Only address failures you observed. Hypothetical coverage = future dead weight.
- **Under 500 lines.** If longer, break into SKILL.md + reference files with clear pointers.

---

## Phase 3: VERIFY GREEN — Confirm Compliance

Run the same scenarios again WITH the skill loaded.

### Setup for GREEN Subagents

```
You have access to this skill: [skill path]
Read it before proceeding.

[same scenario as RED]
```

Remove the containment instruction for GREEN runs — you want to see if agents actually follow through, not just choose.

### Pass Criteria

Agent passes GREEN if:
- Chooses correct option under pressure
- Cites specific skill sections as justification
- Acknowledges the temptation but follows the rule

### If Agent Still Fails GREEN

Skill is unclear or incomplete. Ask the agent:

> "You read the skill and chose the wrong option anyway. What would the skill have needed to say to make the correct option the only acceptable answer?"

| Their Response | Diagnosis | Fix |
|---|---|---|
| "Skill was clear, I chose to ignore" | Need stronger principle | Add "Violating the letter is violating the spirit" |
| "Skill should have said X" | Documentation gap | Add their suggestion verbatim |
| "I didn't see section Y" | Organization problem | Move key points higher, make prominent |

Revise and re-run GREEN. Don't proceed to REFACTOR until agents comply.

---

## Phase 4: REFACTOR — Close Loopholes

Agent violated the rule despite having the skill? Skill regression. Fix it.

### 4.1 Capture New Rationalizations

Common loopholes that emerge in REFACTOR:

- "This case is different because..."
- "I'm following the spirit, not the letter"
- "The PURPOSE is X, and I'm achieving X differently"
- "Being pragmatic means adapting"
- "I'll add [missing thing] afterward"
- "Deleting X hours of work is wasteful"

Capture verbatim. Add each to the Anti-Rationalization Table.

### 4.2 Add Explicit Negations

For each rationalization, add to the skill:

| Component | What to Add |
|---|---|
| Rules section | Explicit negation: "Not 'spirit of the rule.' Not 'this case is different.' The rule." |
| Anti-Rationalization Table | New row: rationalization → why wrong → required action |
| Trigger description | New symptom: "when tempted to [rationalization behavior]" |

### 4.3 Re-verify

Run all scenarios again. Agent should:
- Choose correctly
- Cite the new sections
- Acknowledge their previous rationalization was addressed

If new rationalizations appear: repeat REFACTOR cycle.

If agent follows rule: success.

### When the Skill Is Bulletproof

1. Agent chooses correct option under maximum pressure
2. Agent cites skill sections by name
3. Agent acknowledges the temptation and refuses anyway
4. Meta-testing reveals "skill was clear, I should follow it"

---

## Checklist

| Phase | Required |
|---|---|
| **RED** | 3+ pressure scenarios created, run WITHOUT skill, failures documented verbatim, Anti-Rationalization Table created |
| **GREEN** | Skill addresses observed failures only, no hypothetical additions, agent complies when re-tested |
| **REFACTOR** | New rationalizations added to table, explicit negations added, re-tested, cycle continues until no new rationalizations |

---

## Blocker Criteria

STOP and report if:

| Condition | Required Action |
|---|---|
| Attempting to write skill without RED phase | STOP — run baseline scenarios first |
| Scenarios use single pressure only | STOP — combine 3+ pressure types |
| Agent rationalizations paraphrased instead of quoted | STOP — capture verbatim |
| RED subagent took real actions (wrote files, ran commands) | STOP — containment instruction was missing. Add it and re-run |
| Skill deployed without GREEN verification | STOP — verify compliance before deployment |
| RED scenario found but no Anti-Rationalization Table created | STOP — create table before closing RED phase |
| Rationalization found but not added to table | STOP — add row immediately |

### Cannot Be Overridden

- RED phase baseline testing is REQUIRED for any discipline-enforcing skill
- Pressure scenarios MUST combine 3+ pressure types
- Rationalizations MUST be captured verbatim
- Anti-Rationalization Table MUST exist when any RED scenario is found
- Every rationalization found MUST produce a row in the table
- REFACTOR cycle MUST continue until no new rationalizations appear

---

## Pressure Resistance

| User Says | Your Response |
|---|---|
| "Just write the skill, we know what it should do" | "CANNOT write it without RED phase. I must observe actual agent failures — predicted failures differ from real ones." |
| "One scenario is enough" | "CANNOT use a single scenario. Agents rationalize under combined pressure. Need 3+ pressure types." |
| "Paraphrase the rationalizations to save space" | "CANNOT paraphrase. Exact wording reveals the loophole to close. Capturing verbatim." |
| "Agent passed once, ship it" | "CANNOT stop at first pass. New rationalizations may emerge. Continuing REFACTOR until no new ones appear." |
| "Skip RED, this skill is reference-only" | "Confirming: no rules agents have incentive to bypass? If yes, skipping RED is correct. If the skill enforces discipline, RED is required." |

---

## Anti-Rationalization Table

| Rationalization | Why It's Wrong | Required Action |
|---|---|---|
| "I know what agents will do wrong without testing" | Assumption ≠ observation. Real failures differ from predicted ones. | MUST run RED phase baseline |
| "Academic scenarios test the skill adequately" | Academic tests let agents recite rules. Pressure reveals bypass attempts. | MUST use realistic multi-pressure scenarios |
| "Agent passed once, skill is bulletproof" | Single pass proves nothing. New contexts trigger new rationalizations. | MUST continue REFACTOR until cycle produces no new rationalizations |
| "Spirit of the skill matters more than the letter" | "Spirit over letter" IS the rationalization. The skill must close this loophole explicitly. | MUST add anti-spirit-over-letter clause |
| "The skill is clear, agent just chose to ignore it" | If agent ignores, the skill failed to compel. Clarity alone isn't enough. | MUST strengthen enforcement language or explain the why more effectively |
| "I'll add the Anti-Rationalization Table later" | Later = never. The table is what closes loopholes. | MUST create table before closing RED phase |
| "RED produced no failures — skill is validated" | No failures in RED = either weak scenarios or failure mode doesn't exist. Neither validates the skill. | MUST rule out weak scenarios before concluding failure mode doesn't exist |
| "This is a reference skill, no TDD needed" | Reference skills are lookup tables. If agents have any incentive to bypass the skill, it is not a reference skill. | MUST verify: does agent behavior change with vs. without this skill? If yes, it needs testing. |

---

## Quick Reference

| TDD Phase | Skill Testing | Done When |
|---|---|---|
| **RED** | Run scenarios WITHOUT skill | Agent fails, rationalizations documented verbatim |
| **GREEN** | Write minimal skill | Agent complies when re-tested |
| **REFACTOR** | Close loopholes | No new rationalizations appear |
| **Deploy** | Ship the skill | Bulletproof criteria met |

**Core rule:** If you wouldn't ship code without tests, don't ship skills without RED-GREEN-REFACTOR.
