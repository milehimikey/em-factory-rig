# em-factory (fintech delivery-only branch)

An OpenRig rig that takes an [em](https://github.com/milehimikey/em) event model through its
whole lifecycle. **This branch (`fintech-delivery-only`) runs only the delivery pod against the
Pax8 fintech repo in decide-fast mode** for Project Tally (sprint epic FIN-1070, rig task
FIN-1081). The modeling pod is not started; slices are built before ratification under the
build-assumption protocol in the project's `notes/project-tally/`. The full toolshed rig is on
`main`.

The rig holds no domain knowledge. Everything about the project lives in the project repo the rig
is launched against.

## Seats (this branch)

| Seat | Runtime | Role |
|---|---|---|
| `deliver.lead` | claude-code · Opus 5.5 | Delivery orchestrator: build-ready check, herdr worktrees, merge order |
| `deliver.impl1`–`impl3` | claude-code · Sonnet 5 | One slice per worktree, test-first, records A-lines |
| `deliver.qa` | claude-code · Sonnet 5 | Invariant, scenario and A-id traceability, checks by effect |
| `deliver.reviewer` | claude-code · Opus 5.5 | Spec fidelity, constitution, slice isolation |

No Codex seat runs on this branch. How they coordinate is in [CULTURE.md](CULTURE.md); each
role's guidance is in `agents/<role>/guidance/role.md`.

## Layout

```
rig.fintech.yaml          delivery pod, six seats (launch this for the rig lane)
rig.smoke.fintech.yaml    four-seat subset for the fintech smoke test
rig.yaml, rig.smoke.yaml  the toolshed rig, kept for the back-out; do not launch against fintech
CULTURE.md                team operating manual (delivered to every seat)
startup/boot.md           boot context (delivered to every seat)
agents/<role>/            AgentSpec + role guidance; imports agents/shared (vendored, CLI 0.6.0)
agents/shared/            vendored copy of OpenRig's shared builtins; re-copy after a CLI upgrade
policies/                 em-factory permission policy (selection record; the project's
                          .claude/settings.json is the native application)
axon.compose.yaml         unused on this branch: fintech's docker-compose.yml is the only stack
```

Seats inherit only `shared:claude-activity-hooks` from the vendored builtins. The shared MCP
fragment (exa, context7), the Codex config and the `acceptEdits` settings fragment are
deliberately not imported: the project's `.claude/settings.json` is the single permission source.

## Project prerequisites (fintech)

- `.claude/settings.json` translating the policy (fintech PR #720) and `.gitignore` entries for
  `.openrig/`, `.claude/plugins/`, `.claude/skills/shared:*` (same PR); `*.local.md` already
  ignored.
- `.specify/memory/constitution.md` ratified; models under `design/models/<ctx>/`.
- The compose stack started by the human before `rig up`: `docker compose up -d` in the
  rig-host worktree, then `curl -fsS http://localhost:8024/actuator/health/readiness`.
- A rig-host herdr worktree cut from `origin/main` after PR #720 merges:
  `herdr worktree create --cwd ~/Development/fintech --branch fin-1081-rig-host --base origin/main --path ~/.herdr/worktrees/fintech/fin-1081-rig-host --label rig-host --no-focus`.

## Launch

```bash
cd ~/Development/em-factory-rig
rig daemon start --no-kernel
rig spec audit rig.fintech.yaml
rig up rig.fintech.yaml --cwd ~/.herdr/worktrees/fintech/fin-1081-rig-host --plan --json   # read preflight.errors
rig up rig.fintech.yaml --cwd ~/.herdr/worktrees/fintech/fin-1081-rig-host
rig ps --nodes
```

`rig spec validate` does not resolve agent imports; only `rig up --plan` does. Read its JSON.

### Smoke test first (Fri 2026-10-02)

`rig up rig.smoke.fintech.yaml --cwd <rig-host worktree>` boots `deliver.lead`, `deliver.impl1`,
`deliver.qa`, `deliver.reviewer`. Pass criteria (all five):

1. **Boot.** `rig ps --nodes` shows all four `ready`; `rig capture` on each shows role and
   culture received and `rig whoami --json` run; `impl1` and `qa` report `claude-sonnet-5`,
   `lead` and `reviewer` `claude-opus-5-5`.
2. **Permissions**, in `deliver.lead` and `deliver.impl1`, no prompt: `rig ps`,
   `rig whoami --json`, `mise exec -- em validate design/models/pim/pim-event-model.em`,
   `mise exec -- em export design/models/pim/pim-event-model.em --slice pim-0001-create-category`,
   `git status`, `./gradlew spotlessCheck`, `./gradlew test -x composeUp -x composeDown --dry-run`.
   Refused or prompted, and you refuse: `gh pr merge`, `git push --force`, reading a path under
   `~/Development/em-factory-rig`. **2b:** no `exa` or `context7` MCP server is connected in any
   seat (ask the seat; check `CLAUDE.local.md` in the rig-host tree). `herdr worktree create` for
   a throwaway `fin-1081-smoke` branch from inside `impl1`, then `herdr worktree remove`.
3. **Queue round trip** with one fake `stage:build`: `human@host` sends `stage:buildable` for
   `pim-0001-create-category` ("SMOKE, do not build"); `deliver.lead` runs the build-ready check
   reading `gates.docBound` and `gates.frontmatterUsable` and ignoring `ready: false`, hands
   `impl1` a `stage:build`; `impl1` replies with a fake `stage:assumption` ("A-000 smoke");
   `deliver.lead` parks it on `human@host` with `rig queue block`; you
   `rig queue resolve <id> --decision "smoke ok"`. `rig queue transitions` shows every step and
   `deliver.lead` did not wait for the answer.
4. **Clean tree.** `git status` clean in the rig-host worktree, in `~/Development/fintech`, and in
   `~/Development/em-factory-rig`; `AGENTS.md` unchanged; no OpenRig block in a tracked file.
5. **Stop.** `rig down em-factory-fintech-smoke`; compose stack still running; `rig ps` lists no
   smoke seats; `rig daemon stop` if nothing else needs it.

## Answering the rig

Human-routed work (assumption id requests, gaps, merge requests) is addressed to `human@host`.
The `rig queue` verbs take the caller's identity from `OPENRIG_SESSION_NAME` (`--actor` is
ignored); seat panes have it set, your own terminal doesn't. In the terminal you use to answer
the rig:

```bash
export OPENRIG_SESSION_NAME=human@host
rig queue list --state blocked                       # what's waiting on you
rig queue show <qitem-id> --full                     # the decision brief
rig queue resolve <qitem-id> --decision "<answer>"   # unparks it and nudges the owning seat
```

Without the variable, `resolve` fails with `actor_required`.

## Starting the rig lane

Once the full delivery rig is up, send `deliver.lead` the first `stage:buildable` qitem: slice
key (export key, for example `o2c-0039-finalize-invoice`), model file, FIN ticket, known A-ids,
and the exit check it serves. Rig A-ids are `A-050` to `A-099`. Delivery idles until that qitem.
