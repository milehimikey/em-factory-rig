# em-factory

An OpenRig rig that takes an [em](https://github.com/milehimikey/em) event model through its
whole lifecycle — discover, model, slice, review, implement, conform — with a live human as
domain expert and sole ratifier. Two orchestrators split along em's phase boundary: `model.lead`
runs ahead on the timeline, `deliver.lead` pulls ratified slices behind it.

The rig holds no domain knowledge and names no project. Everything about the domain lives in the
project repo it is launched against, and `bin/em-factory` reads what it needs from there.

## Seats

| Seat | Runtime | Role |
|---|---|---|
| `model.lead` | Claude Code · Opus 5.5 | Modeling orchestrator, facilitator; owns `.event-modeling.md`, only git writer in the main checkout |
| `model.modeler` | Claude Code · Sonnet 5 | Sole editor of the `.em` file |
| `model.slicer1`, `model.slicer2` | Claude Code · Opus 5.5 | Deep slice docs, timeline order |
| `model.critic` | Claude Code · Fable 5.1, or Codex | Independent check of the model and draft slice docs |
| `deliver.lead` | Claude Code · Opus 5.5 | Delivery orchestrator: gate, worktrees, build order, mark-implemented |
| `deliver.impl1`–`impl3` | Claude Code · Sonnet 5 | One slice per worktree, test-first |
| `deliver.qa` | Claude Code · Opus 5.5, or Codex | Invariant and scenario traceability, checks by effect |
| `deliver.reviewer` | Claude Code · Opus 5.5, or Codex | Spec fidelity, constitution, slice isolation |
| `oversight.steward` | Claude Code · Sonnet 5 | Advisory conform on a cadence, pilot metrics |
| `view.watch` | terminal | `em watch --serve` — the live diagram |

The critic, QA and reviewer are independent checks. With `--runtime claude` (the default) they
run Claude Code on a different model from the seats they check; with `--runtime mixed` they run
Codex.

How the seats coordinate — stages, queue tags, the one-git-writer rule, talking to the human —
is in [CULTURE.md](CULTURE.md). Each role's guidance is in `agents/<role>/guidance/role.md`.

## Layout

```
bin/em-factory        the launcher: checks the project, renders the rig spec, runs `rig up`
lib/topology.js       the team as data: pods, seats, models, edges, supported em range
bin/check-em-contract verifies the installed em against what the guides rely on (runs in CI)
lib/em-contract.js    the em commands, flags, skills and JSON fields the rig depends on
CULTURE.md            team operating manual (delivered to every seat)
startup/boot.md       boot context (delivered to every seat)
agents/<role>/        AgentSpec + role guidance, importing OpenRig's shared builtins
policies/             em-factory permission policy (selection record)
axon.compose.yaml     Axon Server, booted before any seat (with `--axon rig`)
```

There is no hand-written `rig.yaml`. The launcher writes `rig.<name>.generated.yaml` for each
launch (gitignored), and links `agents/shared` to the shared agent package of the installed
OpenRig. `bin/em-factory spec <project>` prints the spec without launching anything.

## Project prerequisites

A project the rig can run against has:

- em 1.13.1 or later, both installed and vendored (`em upgrade <model>.em` brings an older
  project's skill bundle and CI block up to date). The role guides use `em coverage --slice`
  and `em slice reratify` on an unshipped doc, which arrived in 1.13.1.
- `em scaffold`, `em skill install`, `em ci init` done, CODEOWNERS on `slices/**`
- `constitution.md` (the implementation house rules)
- `.claude/settings.json` translating the policy into native rules (see toolshed-v2). For
  `--runtime mixed`, also `.codex/rules/em-factory.rules` and the project **trusted in Codex**
  so the rules load.
- a GitHub remote, so PRs and em CI work
- `pilot/NOTES.md` and `pilot/metrics.md` if you want the steward to record the run

`bin/em-factory check <project>` reports which of these are missing. A wrong em version,
missing or stale skills, and a missing constitution block the launch; the rest are warnings.

## The em contract

The culture and role guides call em commands by name, so an em release can break the rig
without changing a line here. Three things guard against that:

- `lib/topology.js` declares the supported em range. The launcher refuses to start outside it,
  for both the installed em and the version the project was last upgraded to.
- `lib/em-contract.js` lists every em command, flag, skill and JSON field the rig relies on.
- `bin/check-em-contract` verifies that list against the installed em, fails if a guide uses an
  em command or flag that is not on the list, and runs the slice lifecycle the guides describe
  (review, ratify, gate, scoped coverage, reratify, mark-implemented) on a scratch project.

CI runs the check against the low end of the range, which must pass, and against the latest
em, which shows a breaking release early. To widen the range: run
`bin/check-em-contract --any-version` on the new em, re-read the guides against its release
notes, then change `EM_RANGE`.

## Launch

```bash
cd ~/projects/em-factory-rig
bin/em-factory up <project> --plan     # preview: checks, spec, OpenRig preflight; launches nothing
bin/em-factory up <project>
rig ps --nodes
```

The launcher takes the model file and em version from the project (`em state read`). The
choices about a launch are flags:

| Flag | Values | Default |
|---|---|---|
| `--pods` | any of `model`, `deliver`, `oversight`, `view`, comma-separated | all four |
| `--runtime` | `claude` (every seat on Claude Code), `mixed` (critic, QA, reviewer on Codex) | `claude` |
| `--axon` | `rig` (the rig boots Axon Server on 8024/8124), `project` (the project runs its own) | `project` if the project has a compose file, else `rig` |
| `--name` | the rig's name | `em-factory` |

To join a project partway through, launch only the pods it needs: `--pods deliver` for a
project that already has ratified slices, `--pods model,view` to model ahead of delivery.
`bin/em-factory add <pod> <project>` adds a pod to the rig while it runs.

### Smoke test first

`bin/em-factory up <project> --smoke` boots `model.lead`, `model.slicer1`, `model.critic`,
`deliver.lead` and `deliver.impl1` as rig `em-factory-smoke`. Run it once per runtime profile
you use. Pass criteria:

1. `rig ps --nodes` — all five `ready`; `rig capture` on each shows role + culture received and
   `rig whoami --json` run. `model.critic` reports the model or runtime the profile gave it.
2. Permissions: in one Claude seat, `rig ps`, `em validate <model>.em`, and `git status` run
   without a prompt; `gh pr merge` is refused; reading outside the project (e.g. a rebuild's
   earlier repo) raises a native prompt, which you refuse.
3. Queues: `model.lead` creates a `stage:slice-doc` qitem for `slicer1` → slicer hands the draft
   to `model.critic` → critic hands back → `model.lead` hands a fake `stage:ratified` to
   `deliver.lead` → `deliver.lead` sends a `stage:gap` back → `model.lead` parks a question on
   `human@host` and you resolve it (see [Answering the rig](#answering-the-rig)).
   `rig queue transitions` shows every step.
4. Managed blocks and projections: `git status` in the project is clean — `CLAUDE.local.md`,
   `.claude/skills/shared:*`, `.claude/plugins/` and `.openrig/` are all ignored, and no OpenRig
   block lands in a tracked file.
5. Adding a pod: `bin/em-factory add oversight <project> --name em-factory-smoke`, then check
   that `oversight.steward` is `ready`, received the boot context, its role and the culture,
   and can send a qitem to `model.lead`.
6. Stop it: `rig down em-factory-smoke`.

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
