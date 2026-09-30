# em-factory — team culture

This rig takes an em event model through its whole lifecycle — discover, model, slice,
review, implement, conform — with a live human as domain expert and sole ratifier. It is
project-agnostic: everything about the domain lives in the project repo the rig is launched
against (`rig up rig.yaml --cwd <project>`), never in the rig.

After startup or compaction, run `rig whoami --json` first. It tells you who you are, who your
peers are, and how to reach them.

**Addressing.** This file names seats as `pod.member` (`deliver.lead`). That is the topology
id, not an address. A seat's session — what `rig send` and `rig queue --destination` take — is
`<pod>-<member>@<rig>`: `deliver.lead` on rig `em-factory` is `deliver-lead@em-factory`. Take
exact session names from `rig whoami --json`; never guess them.

## The shape of the team

Two orchestrators, split along em's own phase boundary, with the human between them:

```
            human (domain expert, sole ratifier)
              ▲ questions            │ answers, ratifications, merges
              │                      ▼
 model pod ── model.lead ──ratified slices──▶ deliver.lead ── deliver pod
 modeler, slicer1, slicer2, critic          impl1-3, qa, reviewer
              ▲                                   │
              └──────── gaps (spec holes) ────────┘
                         oversight.steward: conform + metrics, routes findings to the owning lead
```

- **model.lead** runs discover, model, slice and review. It owns `.event-modeling.md` and its
  Decisions log, and is the only seat that talks domain with the human.
- **deliver.lead** pulls ratified slices in timeline order, gates them, and carries each to a
  merged PR.
- A slice crosses from modeling to delivery **only** when the human has ratified it. No seat
  ever runs `em slice ratify`, edits `ratifiedBy`, or makes a readiness gate pass.

## Where the authority lives

The project repo is the single source of truth. Read these before acting, in this order:

1. `AGENTS.md` — the em agent contract (`em contract` prints it in full).
2. `.event-modeling.md` — current phase and step, participants, and the **Decisions log**.
3. `README.md` — the generated slice index (the one place slices are enumerated).
4. `constitution.md` — the house rules for implementation, including its **Amendments**, which
   win where they differ from the sections above them.
5. `slices/<key>.md` — a slice doc is the read-only spec for that slice.

The em skills live in the project at `.claude/skills/event-modeling*/SKILL.md`. Claude seats
load them as skills; Codex seats read those files directly. When you propose a process step,
say which skill it comes from — or say plainly that it is your own addition.

## Ground rules (these are rulings, not suggestions)

- **Slice in timeline order.** Work starts at the storyboard's beginning and proceeds along the
  timeline. Never propose "riskiest first", and never ask the human which slice to do first.
- **Search the Decisions log before asking.** An "open" question may already have a ratified
  answer. Grep `.event-modeling.md` (and the slice docs) first; ask only what is genuinely
  unanswered, and never re-propose something the log records as rejected.
- **Slice docs are specs, not agent logs.** Never narrate tool versions, rule names, fold
  history, or who-did-what in a slice doc body. That goes in commits, PR descriptions, and
  `pilot/NOTES.md`.
- **Review sets `reviewed`; humans ratify.** The review walkthrough flips a slice whose
  questions are all resolved from `draft` to `reviewed` and refreshes the index. Ratification
  is a separate human gate. Never prompt for it during review.
- **Events first, then slices never touch each other.** The first delivery PR creates every
  event class in its emitting slice's package. After that, one branch and one PR per slice
  against main — no integration branch, no stacked branches, no edits outside the slice's own
  package. Needing something from outside the package is a gap, not a reason to edit it.
- **Again views are one read slice.** A read model shown `again` later on the timeline is one
  projection, implemented once, in one PR that marks every position implemented.
- **Commands and views are the API.** Every State Change slice exposes its command and every
  State View its query, resource-style over REST, listed in the PR. Automation commands stay
  internal. Never ask whether a slice needs HTTP — the model's UI boxes answer it.
- **Gaps go back to the model, never into code.** An implementer who has to guess stops and
  reports the gap. Guessing silently is the one unforgivable failure.
- **The human merges.** No seat merges a PR. The implementing-agent operator never merges its
  own work.

## Blind rebuild

When the project is a rebuild of an earlier system, the earlier system is off limits unless the
project's `pilot/NOTES.md` says otherwise. The domain comes from the human. If you find yourself
reading the earlier repo, stop and tell your lead.

## One working tree, one git writer per tree

Every seat launches in the project's main checkout. To keep that tree coherent:

- **The main checkout belongs to the model pod.** `model.modeler` is the only seat that edits the
  `.em` file. Slicers edit only the slice docs they are assigned. `model.lead` edits the state
  file and README and is the **only seat that runs git in the main checkout** — it commits the
  model pod's work with explicit paths (never `git add -A` or `git add .`) and opens the
  modeling PRs.
- **Delivery works only in worktrees.** `deliver.lead` creates one worktree per slice at
  `.claude/worktrees/<slice-key>` on branch `impl/<slice-key>` and assigns it to exactly one
  implementer. Implementers never touch the main checkout.
- **Review seats are read-only in the main checkout.** They check out a PR into their own
  worktree (`.claude/worktrees/review-<pr>`) to run anything.
- OpenRig writes managed instruction blocks into `CLAUDE.local.md` (gitignored) and, for Codex
  seats, into `AGENTS.md`. Never commit an OpenRig managed block. If one appears in a diff,
  leave it out of the commit.

## How work moves: the queue is the ledger

Durable work moves through `rig queue`, not chat. `rig send` is for quick questions and
nudges. Tag every qitem with the slice (`--slice <slice-key>`) and a stage tag
(`--tags stage:<stage>`) so anyone can reconstruct the pipeline with `rig queue list`.

| Stage tag | From → to | What the qitem carries |
|---|---|---|
| `stage:model` | model.lead → model.modeler | A model edit to make (events, storyboard, commands, views, swimlanes) |
| `stage:slice-doc` | model.lead → slicer1/slicer2 | A slice key to write in depth, in timeline order |
| `stage:critique` | slicer → model.critic | A draft slice doc (or the whole model) to check |
| `stage:question` | model.lead → human | A batch of domain questions (see "Talking to the human") |
| `stage:ratify` | model.lead → human | Slices at `reviewed`, ready for the human to ratify |
| `stage:ratified` | model.lead → deliver.lead | A ratified slice key; delivery may gate and build it |
| `stage:build` | deliver.lead → impl1/2/3 | A gated slice, its worktree path and branch |
| `stage:qa` | implementer → deliver.qa | A PR: tests traced to invariants and scenarios |
| `stage:review` | deliver.qa → deliver.reviewer | A PR that passed QA |
| `stage:merge` | deliver.reviewer → deliver.lead → human | A PR ready for the human to merge |
| `stage:gap` | implementer → deliver.lead → model.lead | A hole in the spec; goes back to modeling |
| `stage:drift` | oversight.steward → owning lead | A conformance finding |

Close a stage by `rig queue handoff` to the next owner, with `--summary` and, where there is
one, `--evidence-ref` (the slice doc path, PR URL, or report path). A qitem is closed when it is
handed off, not when you think it is accepted — acceptance is the next stage's verdict on its
own qitem.

## Talking to the human

The human is `human@host`. Only the two leads and the steward route work to the human; every
other seat goes through its lead. Human-routed qitems require `--summary` and `--evidence-ref`.

- **Batch questions.** Collect what the slicers and critic surface, de-duplicate against the
  Decisions log, and send one decision brief rather than a stream of pings.
- **Offer choices.** Each question states the options you see, your recommendation, and what
  changes depending on the answer. Plain language — no rule IDs or insider jargon.
- **Record every answer** in the Decisions log with the date and "(Mike Key)" attribution, and
  what was rejected, before acting on it.
- If you are blocked on the human, park the qitem with
  `rig queue block <id> --on human@host --summary ... --evidence-ref ... --continuation ...`
  and move on to other work. Do not stall silently.

## Quality over speed

There is no deadline. A slice doc that answers every question an implementer will ask is worth
more than three that don't. A PR with every invariant traced to a test is worth more than two
that merely pass. Run the check and read its output before you claim anything is done, passing,
or fixed.

## When blocked

- On a permission prompt: name the exact command and what it blocks, tell your lead, and keep
  going with what you can do.
- On a peer: `rig send <session> "waiting on <specific thing>" --verify`; escalate to your lead
  if there is no answer.
- On a missing decision: that is a question for the human, routed through your lead.
