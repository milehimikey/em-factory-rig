# em-factory

An OpenRig rig that takes an [em](https://github.com/milehimikey/em) event model through its
whole lifecycle — discover, model, slice, review, implement, conform — with a live human as
domain expert and sole ratifier. Two orchestrators split along em's phase boundary: `model.lead`
runs ahead on the timeline, `deliver.lead` pulls ratified slices behind it.

The rig holds no domain knowledge. Everything about the project lives in the project repo the rig
is launched against. First use: rebuilding toolshed from scratch (`~/projects/toolshed-v2`).

## Seats

| Seat | Runtime | Role |
|---|---|---|
| `model.lead` | claude-code · Opus 5.5 | Modeling orchestrator, facilitator; owns `.event-modeling.md`, only git writer in the main checkout |
| `model.modeler` | claude-code · Sonnet 5 | Sole editor of the `.em` file |
| `model.slicer1`, `model.slicer2` | claude-code · Opus 5.5 | Deep slice docs, timeline order |
| `model.critic` | codex | Independent check of the model and draft slice docs |
| `deliver.lead` | claude-code · Opus 5.5 | Delivery orchestrator: gate, worktrees, merge order, mark-implemented |
| `deliver.impl1`–`impl3` | claude-code · Sonnet 5 | One slice per worktree, test-first |
| `deliver.qa` | codex | Invariant and scenario traceability, checks by effect |
| `deliver.reviewer` | codex | Spec fidelity, constitution, slice isolation |
| `oversight.steward` | claude-code · Sonnet 5 | Advisory conform on a cadence, pilot metrics |
| `view.watch` | terminal | `em watch --serve` — the live diagram |

How they coordinate — stages, queue tags, the one-git-writer rule, talking to the human — is in
[CULTURE.md](CULTURE.md). Each role's guidance is in `agents/<role>/guidance/role.md`.

## Layout

```
rig.yaml              the full rig (13 agent seats + live view terminal)
rig.smoke.yaml        4-seat subset for the smoke test
CULTURE.md            team operating manual (delivered to every seat)
startup/boot.md       boot context (delivered to every seat)
agents/<role>/        AgentSpec + role guidance, importing OpenRig's shared builtins
policies/             em-factory permission policy (selection record)
axon.compose.yaml     Axon Server, booted before any seat
```

## Project prerequisites

A project the rig can run against has:

- em 1.13.1 or later, both installed and vendored (`em upgrade <model>.em` brings an older
  project's skill bundle and CI block up to date). The role guides use `em coverage --slice`
  and `em slice reratify` on an unshipped doc, which arrived in 1.13.1.
- `em scaffold`, `em skill install`, `em ci init` done, CODEOWNERS on `slices/**`
- `constitution.md` (the implementation house rules)
- `.claude/settings.json` and `.codex/rules/em-factory.rules` translating the policy into native
  rules (see toolshed-v2 for the pair), and the project **trusted in Codex** so the rules load
- a GitHub remote, so PRs and em CI work
- `pilot/NOTES.md` and `pilot/metrics.md` if you want the steward to record the run

The `view.watch` member and the "Live model view" surface name the project's model file
(`toolshed.em`). Change both for another project.

## Launch

```bash
cd ~/projects/em-factory-rig
rig spec validate rig.yaml && rig spec audit rig.yaml
rig up rig.yaml --cwd ~/projects/toolshed-v2 --plan    # preview
rig up rig.yaml --cwd ~/projects/toolshed-v2
rig ps --nodes
```

### Smoke test first

`rig up rig.smoke.yaml --cwd ~/projects/toolshed-v2` boots `model.lead`, `model.slicer1`,
`deliver.lead`, `deliver.impl1`. Pass criteria:

1. `rig ps --nodes` — all four `ready`; `rig capture` on each shows role + culture received and
   `rig whoami --json` run.
2. Permissions: in one Claude seat, `rig ps`, `em validate toolshed.em`, and `git status` run
   without a prompt; `gh pr merge` is refused; reading outside the project (e.g. a rebuild's
   earlier repo) raises a native prompt, which you refuse.
3. Queues: `model.lead` creates a `stage:slice-doc` qitem for `slicer1` → slicer hands back →
   `model.lead` hands a fake `stage:ratified` to `deliver.lead` → `deliver.lead` sends a
   `stage:gap` back → `model.lead` parks a question on `human@host` and you resolve it (see
   [Answering the rig](#answering-the-rig)). `rig queue transitions` shows every step.
4. Managed blocks and projections: `git status` in the project is clean — `CLAUDE.local.md`,
   `.claude/skills/shared:*`, `.claude/plugins/` and `.openrig/` are all ignored, and no OpenRig
   block lands in a tracked file.
5. Stop it: `rig down em-factory-smoke`.

Then launch the full rig. Nothing needs rebuilding between the two.

## Answering the rig

Human-routed work — domain questions, ratification requests, PRs to merge — is addressed to
`human@host`. The `rig queue` verbs take the caller's identity from `OPENRIG_SESSION_NAME`
(`--actor` is ignored); seat panes have it set, your own terminal doesn't. In the terminal you
use to answer the rig:

```bash
export OPENRIG_SESSION_NAME=human@host
rig queue list --state blocked                       # what's waiting on you
rig queue show <qitem-id> --full                     # the decision brief
rig queue resolve <qitem-id> --decision "<answer>"   # unparks it and nudges the owning seat
```

Without the variable, `resolve` fails with `actor_required`.

### Ratifying slices

Ratification is yours alone; no seat runs these commands. When a `stage:ratify` item arrives,
read the slice docs it names, then in the project's main checkout:

```bash
em slice ratify <model>.em <slice-key> --by "<your name>"          # once per slice
rig queue resolve <qitem-id> --decision "ratified: <slice-keys>"
```

`model.lead` commits the sign-off and opens a PR for it. Merge that PR: delivery cuts its
worktrees from `origin/main`, so a slice isn't buildable until its ratification is on main.

When the item says the slice is a change to one you already ratified (a gap fixed before it
was built, or a delta to a slice that has shipped), run
`em slice reratify <model>.em <slice-key>` first, then `em slice ratify` as above.

## Starting the cycle

Once the full rig is up, tell `model.lead`:

> Start discovery. Load `/event-modeling` and follow the discover skill from step 1 with me.

Delivery idles until the first `stage:ratified` qitem. Its first job after the model phase is
the foundation PR (bootstrap + every event).
