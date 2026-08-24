## ADDED Requirements

### Requirement: Canvas renders an externally supplied runtime overlay
The workflow canvas SHALL accept a `WorkflowRuntimeOverlay` describing per-node runtime state and
render it without deriving, fetching, or computing any of that state itself.

#### Scenario: Overlay assigns statuses to nodes
- **WHEN** a canvas receives an overlay whose `nodes` map assigns statuses to a subset of nodes
- **THEN** each listed node MUST render its status treatment
- **AND** nodes absent from the map MUST render their neutral authoring appearance

#### Scenario: Overlay updates while the canvas is mounted
- **WHEN** a new overlay is supplied with a node's status changed from `running` to `done`
- **THEN** that node MUST render the `done` treatment
- **AND** the workflow graph model MUST remain unchanged

#### Scenario: Overlay never enters history
- **WHEN** an overlay is supplied and the user then triggers undo
- **THEN** the undo MUST apply to graph edits only
- **AND** the rendered runtime state MUST remain the state of the most recently supplied overlay

### Requirement: Runtime statuses distinguish not-reached from not-taken
The canvas SHALL render five distinct node statuses: `done`, `running`, `waiting`, `failed`, and
`skipped`.

#### Scenario: A branch that was not taken
- **WHEN** a node's runtime status is `skipped`
- **THEN** it MUST be rendered distinguishably from a node whose status is `waiting`

#### Scenario: A failed node carries its error
- **WHEN** a node's runtime status is `failed` and its runtime state carries an `error` string
- **THEN** the node MUST surface that error text

### Requirement: Loop nodes render iteration progress
The canvas SHALL render an iteration counter on any node whose runtime state carries an `iteration`
value.

#### Scenario: Loop node mid-iteration
- **WHEN** a node's runtime state carries `iteration` of current 2 and total 3
- **THEN** the node MUST render a `2 / 3` counter

#### Scenario: Node without iteration data
- **WHEN** a node's runtime state carries no `iteration` value
- **THEN** no counter MUST be rendered on that node

### Requirement: Edges are styled by traversal state
The canvas SHALL style edges according to `traversedEdgeIds` and `activeEdgeIds`, and an edge listed
in both MUST be rendered as active.

#### Scenario: Edge already traversed
- **WHEN** an edge id appears in `traversedEdgeIds` only
- **THEN** that edge MUST render its traversed styling

#### Scenario: Edge currently active
- **WHEN** an edge id appears in `activeEdgeIds`
- **THEN** that edge MUST render its active styling regardless of whether it is also traversed

#### Scenario: Untouched edge
- **WHEN** an edge id appears in neither list
- **THEN** that edge MUST render its default styling

### Requirement: Observation mode forbids graph mutation
The workflow editor SHALL accept a `mode` of `edit` or `observe`, defaulting to `edit`, and in
`observe` mode MUST prevent every graph mutation while keeping navigation available.

#### Scenario: Mutation attempts are inert
- **WHEN** a user attempts to drag a node, create a connection, or delete a node in `observe` mode
- **THEN** the workflow graph MUST remain unchanged

#### Scenario: Navigation stays available
- **WHEN** a user pans or zooms the canvas in `observe` mode
- **THEN** the viewport MUST respond as it does in `edit` mode

#### Scenario: Default mode preserves existing behaviour
- **WHEN** an editor is mounted without a `mode` prop
- **THEN** all existing editing affordances MUST behave exactly as before this change

### Requirement: Node inspector replaces the config panel during observation
In `observe` mode the editor SHALL present a read-only inspector for the selected node's runtime
input and output instead of the editable config form.

#### Scenario: Selecting a node with runtime state
- **WHEN** a user selects a node in `observe` mode and that node has runtime state
- **THEN** the panel MUST present its `input` and `output`
- **AND** MUST expose no editable config field

#### Scenario: Selecting a node without runtime state
- **WHEN** a user selects a node in `observe` mode and that node has no runtime state
- **THEN** the panel MUST indicate that the node has not produced runtime data
- **AND** MUST expose no editable config field
