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
- **deny: merge_or_release** — the human merges every PR (the project constitution's review
  norms). No seat merges, including its own work.
- **ask: publish_package, force_push** and the destructive class — these defer to the human.

This records a selection. Verify it took effect in one Claude seat and one Codex seat before
trusting it across the rig.
