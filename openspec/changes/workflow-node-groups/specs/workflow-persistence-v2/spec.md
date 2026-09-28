## ADDED Requirements

### Requirement: Domain workflows persist node groups

The domain workflow DTO SHALL carry an optional `groups` array. Each group SHALL have `id` (string), `label` (non-empty string), `color` (string color token), and `nodeIds` (non-empty array of domain node ids). A missing `groups` field SHALL be read as an empty array. Domain export SHALL always write `groups`.

#### Scenario: Domain roundtrip preserves groups

- **WHEN** a workflow with groups is exported to domain JSON and imported back
- **THEN** every group's id, label, color, and member set MUST be preserved

#### Scenario: Workflow without groups field imports

- **WHEN** domain JSON without a `groups` field is imported
- **THEN** import MUST succeed with no groups

### Requirement: Invalid group payloads fail deterministically

Domain import SHALL reject a payload whose groups are malformed: a group missing `id`, `label`, `color`, or `nodeIds`; an empty `nodeIds`; a `nodeIds` entry that references no node; a node listed in more than one group; or duplicate group ids. An unknown color token SHALL be normalized to the default color rather than rejected.

#### Scenario: Node in two groups is rejected

- **WHEN** imported JSON lists the same node id in two groups
- **THEN** import MUST fail with an explicit validation error

#### Scenario: Unknown node id is rejected

- **WHEN** a group's `nodeIds` references a node id that is not in `nodes`
- **THEN** import MUST fail with an explicit validation error

#### Scenario: Unknown color is normalized

- **WHEN** a group has color `"teal-900"` which is not a known token
- **THEN** import MUST succeed and the group color MUST be the default color

### Requirement: Clipboard payload carries whole groups

The selection clipboard payload SHALL carry the groups whose members are all included in the copied nodes. Groups only partially included SHALL be omitted from the payload.

#### Scenario: Clipboard roundtrip with a whole group

- **WHEN** all members of a group are copied and pasted
- **THEN** the pasted nodes MUST form a group with the original label and color and a new id

### Requirement: Backend export emits node groups

Backend export and draft backend export SHALL emit a `groups` array in which each group has `id` (string), `label`, `color`, and `nodeIds` expressed as the exported numeric backend node ids, sorted ascending. Groups SHALL NOT appear in the backend `nodes` array, SHALL NOT affect backend node ordering or numbering, and SHALL NOT make a workflow non-exportable. Backend node payloads SHALL be identical to those produced for the same workflow without groups.

#### Scenario: Groups reference backend numeric ids

- **WHEN** a workflow whose group contains the nodes exported as ids 2 and 3 is exported for the backend
- **THEN** the backend DTO MUST contain a group with `nodeIds: [2, 3]`

#### Scenario: Groups do not change node export

- **WHEN** the same workflow is exported with and without groups
- **THEN** the backend `nodes` arrays MUST be equal

#### Scenario: Workflow without groups exports an empty list

- **WHEN** a workflow without groups is exported for the backend
- **THEN** the backend DTO MUST contain `groups: []`
