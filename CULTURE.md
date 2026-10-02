# em-factory — team culture

This rig takes an em event model through its whole lifecycle — discover, model, slice,
review, implement, conform — with a live human as domain expert. In the fintech sprint only the delivery pod runs: it
builds slices before they are ratified, recording every decision it has to make as a build
assumption. It is project-agnostic: everything about the domain lives in the project repo the rig is launched
against (`rig up rig.yaml --cwd <project>`), never in the rig.

After startup or compaction, run `rig whoami --json` first. It tells you who you are, who your
peers are, and how to reach them.

**Addressing.** This file names seats as `pod.member` (`deliver.lead`). That is the topology
id, not an address. A seat's session — what `rig send` and `rig queue --destination` take — is
`<pod>-<member>@<rig>`: `deliver.lead` on rig `em-factory-fintech` is `deliver-lead@em-factory-fintech`. Take
exact session names from `rig whoami --json`; never guess them.

## The shape of the team

In the fintech sprint only the delivery pod runs. The modeling track is a separate team of
humans and is not a seat here. The human is `human@host`.

```
            human@host (domain expert, answers when available; merges go to CODEOWNERS approvers)
              ^ assumptions, gaps, merge requests     | buildable slices, rulings
              |                                       v
                              deliver.lead
                   impl1, impl2, impl3, qa, reviewer
```

- **human@host** sends each slice to `deliver.lead` as a `stage:buildable` qitem. The qitem
  names the slice key (em's export key, for example `o2c-0039-finalize-invoice`), the model
  file, the ticket number, the assumption ids already recorded for it, and the exit check it
  serves. Seats cannot read the sprint plan files; the qitem is the brief.
- **deliver.lead** applies the build-ready check, hands the slice to an implementer, and
  carries the PR to `stage:merge`.
- No seat ever changes a slice doc's `status`, edits `reviewedBy`, `reviewedOn`, `ratifiedBy`
  or `ratifiedOn`, edits an `.event-modeling.md` Decisions log or a `.em` file, or runs
  `em slice review`, `em slice ratify`, `em slice reratify` or `em slice mark-implemented`.

## Where the authority lives

The project repo is the single source of truth. Read these before acting, in this order:

1. `AGENTS.md`, the em agent contract (`mise exec -- em contract` prints it in full). Where it
   says a slice must pass `em validate --slice-ready` and that the gate is a ratification
   decision, this sprint's build-ready check below replaces it for chain slices; the
   ratification gate itself is unchanged and is not yours.
2. The model directory named in your qitem (`design/models/<ctx>/`): `.event-modeling.md`
   (read-only for you) and `README.md` (the generated slice index).
3. `.specify/memory/constitution.md`, the house rules for implementation.
4. `design/models/<ctx>/slices/<slice-key>.md`, the read-only spec for the slice, plus the
   `typespec/` directory beside it.

The em skills live in the project at `.claude/skills/event-modeling*/SKILL.md`. Seats load
them as skills. When you propose a process step,
say which skill it comes from — or say plainly that it is your own addition.

## Ground rules (these are rulings, not suggestions)

- **Order comes from the qitem.** `human@host` sends slices in the order the sprint plan gives.
  Within that order, follow timeline order unless a dependency says otherwise. Raising the
  riskiest assumption early is encouraged.
- **Search the Decisions log before asking.** An "open" question may already have a ratified
  answer. Grep `.event-modeling.md` (and the slice docs) first; ask only what is genuinely
  unanswered, and never re-propose something the log records as rejected. If it is still
  unanswered and it affects the code you are writing, record a build assumption and keep
  building. Do not wait for an answer.
- **Slice docs are specs, not agent logs.** Never narrate tool versions, rule names, fold
  history, or who-did-what in a slice doc body. That goes in commits and PR descriptions. Assumptions go only in the A-line under the
  slice's Open Questions (or in its `## Build Assumptions` section when the doc has no Open
  Questions heading).
- **Each domain's first PR creates only the event classes of the chain slices that domain
  builds**, in the emitting slice's package. After that, one branch and one PR per slice against
  main; no integration branch, no stacked branches, no edits outside the slice's own package. An
  automation and its translation pair may share one branch and PR (ADR-0024). Needing something
  from outside the package is a gap, not a reason to edit it.
- **Again views are one read slice.** A read model shown `again` later on the timeline is one
  projection, implemented once, in one PR that adds the `implementedIn:` line to every
  position's slice doc.
- **Commands and views are the API.** Every State Change slice exposes its command and every
  State View its query, resource-style over REST, listed in the PR. Automation commands stay
  internal. Never ask whether a slice needs HTTP — the model's UI boxes answer it.
- **Decisions are recorded assumptions.** An implementer who must decide writes an A-line under
  the slice's open question (id, what the code does, `Overturned if:`, `Tests:`), cites the id in
  the test name, asks `deliver.lead` for the FIN key, and keeps building. Silent guessing stays
  forbidden. Stop and send `stage:gap` only for a constitution NON-NEGOTIABLE, money
  representation, retention or audit-envelope question, or for a change to the slice doc body,
  the `.em` file or another domain's package.
- **The human merges.** No seat merges a PR. The implementing-agent operator never merges its
  own work. A PR built by this rig is merged by a CODEOWNERS approver other than the person
  operating the rig.

## One working tree, one git writer per tree

- **The rig-host worktree** is where every seat starts. It is a herdr worktree of the project
  repo. `deliver.lead` is the only seat that runs git in it, and only for reading (`git status`,
  `git fetch`, `git log`). Nothing is built there.
- **Every slice gets its own worktree**, created by `deliver.lead` with herdr:
  `herdr worktree create --cwd <rig-host worktree> --branch fin-<ticket>-<slice-key> --base origin/main --path /Users/mkey/.herdr/worktrees/fintech/fin-<ticket>-<slice-key> --no-focus`.
  The implementer it is assigned to is the only git writer there. Implementers never touch the
  rig-host worktree or the main checkout.
- **Review seats** create their own worktree from the pushed slice branch:
  `herdr worktree create --cwd <rig-host worktree> --branch fin-<ticket>-<slice-key>-review --base origin/fin-<ticket>-<slice-key> --path /Users/mkey/.herdr/worktrees/fintech/fin-<ticket>-<slice-key>-review --no-focus`,
  read-only, removed with `herdr worktree remove` when done. They never share a worktree or a
  branch with an implementer.
- Branch names are lowercase, ticket first: `fin-<ticket>-<slice-key>`. The ticket number is in
  the qitem; never invent one.
- **Tests share one stack.** `human@host` starts the project's compose stack once
  (`docker compose up -d`). Run tests as `./gradlew spotlessCheck test -x composeUp -x composeDown`
  and never start or stop the stack yourself. Run at most one Gradle test task at a time across
  the rig; tell `deliver.lead` before you start one.
- OpenRig writes managed instruction blocks into `CLAUDE.local.md` (ignored). Never commit an
  OpenRig managed block. If one appears in a diff, leave it out of the commit. Commit with
  explicit paths, never `git add -A` or `git add .`.

## How work moves: the queue is the ledger

Durable work moves through `rig queue`, not chat. `rig send` is for quick questions and
nudges. Tag every qitem with the slice (`--slice <slice-key>`) and a stage tag
(`--tags stage:<stage>`) so anyone can reconstruct the pipeline with `rig queue list`.

| Stage tag | From → to | What the qitem carries |
|---|---|---|
| `stage:buildable` | human@host → deliver.lead | A slice key, model file, ticket number, known A-ids, and the exit check it serves. It has not been ratified; the word only means the build-ready check may now run |
| `stage:build` | deliver.lead → impl1/2/3 | The gated slice, its worktree path and branch |
| `stage:assumption` | implementer → deliver.lead → human@host | A proposed A-line (id request, what the code does, `Overturned if:`), so `human@host` can create the FIN Task and return the key |
| `stage:qa` | implementer → deliver.qa | A PR: tests traced to invariants, scenarios and A-ids |
| `stage:review` | deliver.qa → deliver.reviewer | A PR that passed QA |
| `stage:merge` | deliver.reviewer → deliver.lead → human@host | A PR ready for a CODEOWNERS approver to merge |
| `stage:gap` | implementer → deliver.lead → human@host | A true gap: a question that cannot become an assumption |

Close a stage by `rig queue handoff` to the next owner, with `--summary` and, where there is
one, `--evidence-ref` (the slice doc path, PR URL, or report path — always a path in the
project repo or a URL; this culture file and the role guides live in the rig repo, not the
project). A qitem is closed when it is
handed off, not when you think it is accepted — acceptance is the next stage's verdict on its
own qitem.

## Talking to the human

The human is `human@host`. Only `deliver.lead` routes work to the human; every other seat goes
through it. Human-routed qitems require `--summary` and `--evidence-ref`.

- **Batch questions.** Collect what the implementers surface, check each against the slice
  doc's Open Questions and existing A-lines, and send `human@host` one brief per working block.
  Cross-domain assumptions (event ownership, shared identifiers, a contract shape another domain
  consumes, the billing clock) always go in the brief; `human@host` confirms the same day.
- **Offer choices.** Each question states the options you see, your recommendation, and what
  changes depending on the answer. Plain language — no rule IDs or insider jargon.
- **Record every answer** in the qitem's `rig queue resolve --decision` text and, if it settles
  an A-line, update that A-line. Never write any `.event-modeling.md` Decisions log.
- Default: record the assumption and continue. Park a qitem with
  `rig queue block <id> --on human@host --summary ... --evidence-ref ... --continuation ...`
  only when the answer cannot be defaulted, then move to the next slice.

## Deadline

The chain is deployed dark by Mon 2026-10-19. A built slice with recorded assumptions beats a
perfect slice doc. A PR with every invariant and every assumption traced to a test is worth more
than two that merely pass. Run the check and read its output before you claim anything is done,
passing, or fixed.

## When blocked

- On a permission prompt: name the exact command and what it blocks, tell your lead, and keep
  going with what you can do.
- On a peer: `rig send <session> "waiting on <specific thing>" --verify`; escalate to your lead
  if there is no answer.
- On a missing decision: record a build assumption. Route it through your lead only if it
  cannot be defaulted.
