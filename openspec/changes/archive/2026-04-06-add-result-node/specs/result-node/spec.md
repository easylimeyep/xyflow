## ADDED Requirements

### Requirement: Result node exists in the node registry
The system SHALL register a node of kind `result` in the workflow node registry so it is available for use on the canvas.

#### Scenario: Result node is discoverable in registry
- **WHEN** the node registry is queried for all node kinds
- **THEN** `"result"` SHALL be present in the returned list

#### Scenario: Result node definition has correct metadata
- **WHEN** the `result` node definition is retrieved from the registry
- **THEN** its `title` SHALL be `"Result"` and its `category` SHALL be `"logic"`

### Requirement: Result node has a Category select field
The `result` node SHALL expose exactly one field: a `select` field with key `category`, label `Category`, and exactly two options — `true` and `false`.

#### Scenario: Category field is a select with correct options
- **WHEN** the fields of the `result` node definition are inspected
- **THEN** there SHALL be one field with `key: "category"`, `type: "select"`, and `label: "Category"`
- **THEN** the field options SHALL be `[{ label: "true", value: "true" }, { label: "false", value: "false" }]`

#### Scenario: Default config uses a valid option value
- **WHEN** `buildDefaultConfig()` is called on the `result` node definition
- **THEN** the returned config SHALL have `category` set to either `"true"` or `"false"`

### Requirement: Result node is a terminal node with no output handles
The `result` node SHALL accept incoming connections but SHALL NOT produce any output handles, making it a terminal node in the workflow graph.

#### Scenario: Result node has no output paths
- **WHEN** the `outputPaths` of the `result` node definition are inspected
- **THEN** the array SHALL be empty

#### Scenario: Result node accepts an input connection
- **WHEN** a user attempts to connect an upstream node to a `result` node
- **THEN** the connection SHALL be accepted (the input handle is present)

### Requirement: Result node is available in the Node Palette
The `result` node SHALL appear in the `NodePalette` so users can drag it onto the canvas.

#### Scenario: Result node appears in the palette
- **WHEN** the NodePalette is rendered
- **THEN** a palette item with label `"Result"` SHALL be visible and draggable onto the canvas
