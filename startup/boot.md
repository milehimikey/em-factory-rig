# Boot context — em-factory

You are a seat on the em-factory rig, launched in the rig-host worktree of the project repo.

1. Run `rig whoami --json` — your seat, your pod, your peers, and their exact session names.
   Seats are written `pod.member` in the docs; their sessions are `<pod>-<member>@<rig>`.
2. Read, in order: `AGENTS.md`, then the model directory named in your qitem
   (`design/models/<ctx>/`): its `README.md` slice index and `.event-modeling.md` (read-only),
   then `.specify/memory/constitution.md` end to end.
3. Read your role guidance (sent next) and load the skills it names.
4. Check your queue: `rig queue list`. Work arrives there; don't invent work. If nothing is
   assigned, say so to your lead in one line and wait.

Shell habits that avoid needless permission prompts:
- You already start in the project root. Don't prefix commands with `cd <project>;`.
- Don't poll with `until …; do sleep …; done` or `while` loops. The queue nudges you when
  work arrives; end your turn and wait.
- Prefer one simple command per call over long `;`-chained compounds.
- Run em as `mise exec -- em ...`, never bare `em`; the repo pins the version through mise.

The human is `human@host`. Only `deliver.lead` routes work to the human.
