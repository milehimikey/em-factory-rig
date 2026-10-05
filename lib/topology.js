'use strict';

// The em-factory team as data. bin/em-factory renders a rig spec from this for one launch:
// which pods, which runtime profile, and the project's model file. Nothing in here names a
// project.

// The em range the culture and role guides are written against. bin/em-factory refuses to
// launch outside it. Widen it only after re-reading the guides against the new em.
const EM_RANGE = { atLeast: '1.13.1', below: '1.14.0' };

const CONTINUITY = {
  enabled: true,
  sync_triggers: ['pre_compaction', 'pre_shutdown', 'milestone'],
  artifacts: { session_log: true, restore_brief: true },
  restore_protocol: { peer_driven: true, verify_via_quiz: false },
};

const OPUS = 'claude-opus-5-5';
const SONNET = 'claude-sonnet-5';
const FABLE = 'claude-fable-5-1';

// A member with `check` is an independent check on other seats' work. Under the `claude`
// runtime profile it runs claude-code on `check.model`, a different model from every seat it
// checks. Under `mixed` it runs codex. `smoke: true` puts the member in the smoke subset.
const PODS = [
  {
    id: 'model',
    label: 'Modeling',
    summary: 'Discover, model, slice docs, and review — runs ahead of delivery on the timeline.',
    continuity: true,
    members: [
      { id: 'lead', label: 'Modeling lead (facilitator)', agent: 'modeling-lead', model: OPUS, smoke: true },
      { id: 'modeler', label: 'Modeler (.em editor)', agent: 'em-modeler', model: SONNET },
      { id: 'slicer1', label: 'Slice author 1', agent: 'slice-author', model: OPUS, smoke: true },
      { id: 'slicer2', label: 'Slice author 2', agent: 'slice-author', model: OPUS },
      // Checks the slicers (Opus) and the modeler (Sonnet).
      { id: 'critic', label: 'Model critic', agent: 'model-critic', check: { model: FABLE }, smoke: true },
    ],
    edges: [
      ['delegates_to', 'lead', 'modeler'],
      ['delegates_to', 'lead', 'slicer1'],
      ['delegates_to', 'lead', 'slicer2'],
      ['delegates_to', 'lead', 'critic'],
      ['can_observe', 'critic', 'modeler'],
      ['can_observe', 'critic', 'slicer1'],
      ['can_observe', 'critic', 'slicer2'],
      ['escalates_to', 'slicer1', 'lead'],
      ['escalates_to', 'slicer2', 'lead'],
    ],
  },
  {
    id: 'deliver',
    label: 'Delivery',
    summary: 'Gate ratified slices and carry each, in dependency order, to a PR the human merges.',
    continuity: true,
    members: [
      { id: 'lead', label: 'Delivery lead (implementing-agent operator)', agent: 'delivery-lead', model: OPUS, smoke: true },
      { id: 'impl1', label: 'Implementer 1', agent: 'slice-implementer', model: SONNET, smoke: true },
      { id: 'impl2', label: 'Implementer 2', agent: 'slice-implementer', model: SONNET },
      { id: 'impl3', label: 'Implementer 3', agent: 'slice-implementer', model: SONNET },
      // Both check the implementers (Sonnet).
      { id: 'qa', label: 'QA', agent: 'slice-qa', check: { model: OPUS } },
      { id: 'reviewer', label: 'PR reviewer', agent: 'pr-reviewer', check: { model: OPUS } },
    ],
    edges: [
      ['delegates_to', 'lead', 'impl1'],
      ['delegates_to', 'lead', 'impl2'],
      ['delegates_to', 'lead', 'impl3'],
      ['delegates_to', 'lead', 'qa'],
      ['delegates_to', 'lead', 'reviewer'],
      ['can_observe', 'qa', 'impl1'],
      ['can_observe', 'qa', 'impl2'],
      ['can_observe', 'qa', 'impl3'],
      ['can_observe', 'reviewer', 'impl1'],
      ['can_observe', 'reviewer', 'impl2'],
      ['can_observe', 'reviewer', 'impl3'],
      ['escalates_to', 'impl1', 'lead'],
      ['escalates_to', 'impl2', 'lead'],
      ['escalates_to', 'impl3', 'lead'],
    ],
  },
  {
    id: 'oversight',
    label: 'Oversight',
    summary: 'Advisory conformance on a cadence and the pilot\'s records; routes findings, never fixes.',
    members: [
      { id: 'steward', label: 'Conform steward', agent: 'conform-steward', model: SONNET },
    ],
    edges: [],
  },
  {
    id: 'view',
    label: 'Live view',
    summary: 'Serves the live model diagram for the human.',
    members: [
      // A terminal, not an agent. Its command is rendered from the project's model file.
      { id: 'watch', label: 'Live model view', terminal: 'watch' },
    ],
    edges: [],
  },
];

const CROSS_POD_EDGES = [
  ['collaborates_with', 'model.lead', 'deliver.lead'],
  ['escalates_to', 'deliver.lead', 'model.lead'],
  ['can_observe', 'oversight.steward', 'model.lead'],
  ['can_observe', 'oversight.steward', 'deliver.lead'],
];

const SUMMARY =
  'Full-cycle event-modeling team for an em project: a modeling orchestrator and a delivery ' +
  'orchestrator with a live human between them as domain expert and sole ratifier. Discover → ' +
  'model → slice → review → implement → conform.';

module.exports = { EM_RANGE, CONTINUITY, PODS, CROSS_POD_EDGES, SUMMARY };
