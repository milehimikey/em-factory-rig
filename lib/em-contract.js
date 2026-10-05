'use strict';

// What the rig relies on from em, as data. bin/check-em-contract verifies it against the
// installed em, and fails if a guide uses an em command or flag that is not listed here.

module.exports = {
  // em subcommand -> the flags the guides and the launcher use on it.
  commands: {
    scaffold: [],
    validate: ['--slice-ready', '--json'],
    export: ['--slice'],
    coverage: ['--slice', '--tests', '--strict'],
    watch: ['--out', '--serve'],
    contract: [],
    upgrade: ['--apply'],
    'skill install': [],
    'skill check': [],
    'ci init': [],
    'slice new': [],
    'slice index': [],
    'slice review': ['--by'],
    'slice ratify': ['--by'],
    'slice reratify': [],
    'slice mark-implemented': [],
    'slice conform': ['--at'],
    'state read': [],
    'state set-phase': ['--step'],
    'state set-review': [],
    'state set-conformance': ['--report'],
    'state log-usage': ['--phases'],
    'query upstream': ['--of'],
    'conform-supersede': ['--as-of', '--findings', '--locus', '--by'],
    'conform-findings check': [],
    'model version bump': ['--by'],
  },

  // Flags a guide names only to forbid them, or in passing.
  mentionedFlags: ['--include-ready', '--partial', '--skip-findings-check'],

  // Skills the role guides load by name (vendored into the project by `em skill install`).
  skills: [
    'event-modeling',
    'event-modeling-discover',
    'event-modeling-design',
    'event-modeling-review',
    'event-modeling-implement',
    'event-modeling-conform',
  ],

  // Headings in `em contract` output that the guides cite.
  contractHeadings: ['## 3. Three modes', 'Order of work'],

  // Fields read out of em's JSON output.
  json: {
    'state read': ['modelPath', 'emVersion', 'phase'],
    'validate --slice-ready --json': ['ready'],
    'coverage --slice --json': ['ok', 'slices'],
    'export --slice': ['slice'],
  },

  // The files that carry instructions to seats or to the human.
  guides: ['CULTURE.md', 'README.md', 'startup', 'agents', 'policies'],
};
