## ADDED Requirements

### Requirement: Domain workflows persist node groups

The domain workflow DTO SHALL carry an optional `groups` array. Each group SHALL have `id` (string), `label` (non-empty string), `color` (string color token), `x` and `y` (finite numbers), `width` and `height` (positive finite numbers), `collapsed` (boolean), and `nodeIds` (array of domain node ids, possibly empty). A missing `groups` field SHALL be read as an empty array. Domain export SHALL always write `groups`, with each group's `nodeIds` sorted ascending.

#### Scenario: Domain roundtrip preserves groups

- **WHEN** a workflow with groups is exported to domain JSON and imported back
- **THEN** every group's id, label, color, rectangle, collapsed state, and member set MUST be preserved

#### Scenario: Empty group roundtrip

- **WHEN** a workflow with a group that has no members is exported and imported back
- **THEN** the group MUST be preserved with no members

#### Scenario: Workflow without groups field imports

- **WHEN** domain JSON without a `groups` field is imported
- **THEN** import MUST succeed with no groups

#### Scenario: Export is deterministic

- **WHEN** the same workflow is exported twice after members were added to a group in different orders
- **THEN** both exports MUST be identical

### Requirement: Invalid group payloads fail deterministically

Domain import SHALL reject a payload whose groups are malformed: a group missing any required field or with a field of the wrong type, a non-positive `width` or `height`, a `nodeIds` entry that references no node, a node listed in more than one group, or duplicate group ids. An unknown color token SHALL be normalized to the default color rather than rejected.

#### Scenario: Node in two groups is rejected

- **WHEN** imported JSON lists the same node id in two groups
- **THEN** import MUST fail with an explicit validation error

#### Scenario: Unknown node id is rejected

- **WHEN** a group's `nodeIds` references a node id that is not in `nodes`
- **THEN** import MUST fail with an explicit validation error

#### Scenario: Invalid size is rejected

- **WHEN** a group has `width: 0`
- **THEN** import MUST fail with an explicit validation error

#### Scenario: Unknown color is normalized

- **WHEN** a group has color `"teal-900"` which is not a known token
- **THEN** import MUST succeed and the group color MUST be the default color

### Requirement: Clipboard payload carries whole groups

The selection clipboard payload SHALL carry every selected group and every group whose members are all included in the copied nodes, with the group's rectangle and collapsed state. Groups only partially included SHALL be omitted, and their copied members SHALL be pasted ungrouped.

#### Scenario: Clipboard roundtrip with a whole group

- **WHEN** a group is copied and pasted
- **THEN** the pasted nodes MUST form a group with the original label, color, size, and collapsed state and a new id

#### Scenario: Clipboard with an empty group

- **WHEN** an empty group is selected, copied, and pasted
- **THEN** a new empty group with the original label, color, and size MUST be pasted

### Requirement: Backend export emits node groups

Backend export and draft backend export SHALL emit a `groups` array in which each group has `id` (string), `label`, `color`, `x`, `y`, `width`, `height`, `collapsed`, and `nodeIds` expressed as the exported numeric backend node ids, sorted ascending. Groups SHALL NOT appear in the backend `nodes` array, SHALL NOT affect backend node ordering or numbering, and SHALL NOT make a workflow non-exportable. Backend node payloads SHALL be identical to those produced for the same workflow without groups.

#### Scenario: Groups reference backend numeric ids

- **WHEN** a workflow whose group contains the nodes exported as ids 3 and 2 is exported for the backend
- **THEN** the backend DTO MUST contain a group with `nodeIds: [2, 3]`

#### Scenario: Groups do not change node export

- **WHEN** the same workflow is exported with and without groups
- **THEN** the backend `nodes` arrays MUST be equal

#### Scenario: Empty group is exported

- **WHEN** a workflow with an empty group is exported for the backend
- **THEN** the backend DTO MUST contain that group with `nodeIds: []`

#### Scenario: Workflow without groups exports an empty list

- **WHEN** a workflow without groups is exported for the backend
- **THEN** the backend DTO MUST contain `groups: []`

#### Scenario: Observe-mode override is not exported

- **WHEN** a viewer expands a saved-collapsed group in observe mode and the workflow is exported
- **THEN** the exported group MUST have `collapsed: true`
