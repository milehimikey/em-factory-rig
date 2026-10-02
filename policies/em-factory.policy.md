---
source: custom
name: em-factory
surface: config
policy_schema_version: 1
description: Routine dev, pushes and PRs run freely; merging is the human's alone; history rewrites and destructive acts ask.
default_posture: allow
allow: [push_to_remote, create_pr]
ask: [publish_package, force_push]
deny: [merge_or_release]
destructive_class: [delete_everything, drop_persistent_store, reset_or_discard_vcs]
---

# em-factory permission policy

- **allow: push_to_remote, create_pr** — every slice is a branch and a PR; asking for each one
  would freeze the delivery pod on every slice.
- **deny: merge_or_release** — the human merges every PR (branch protection requires an approver who
  is not the author; see `.github/CODEOWNERS` header and `.specify/memory/constitution.md`
  Amendment Process). No seat merges, including its own work. A PR built by this rig is merged
  by a CODEOWNERS approver other than the person operating the rig.
- **ask: publish_package, force_push** and the destructive class — these defer to the human.

This records a selection. Verify it took effect in one Claude seat (`deliver.lead`) and one Claude
seat on the other model tier (`deliver.impl1`) before trusting it across the rig. The native
application is the project's `.claude/settings.json`; this file is a floor, not a grant.
