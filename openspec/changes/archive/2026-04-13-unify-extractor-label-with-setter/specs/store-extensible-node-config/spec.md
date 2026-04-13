## MODIFIED Requirements

### Requirement: NodeDefinition declares the rename config key for rename-aware nodes
`NodeDefinition` SHALL include an optional `renameConfigKey?: string` field. When a node config update targets this key with a string value, the update MUST trigger variable reference refactoring throughout the graph.

#### Scenario: setVariable definition declares variableName as rename key
- **WHEN** the `setVariable` node definition is loaded
- **THEN** `renameConfigKey` MUST equal `"variableName"`

#### Scenario: extractor definition declares extractExpression as rename key
- **WHEN** the `extractor` node definition is loaded
- **THEN** `renameConfigKey` MUST equal `"extractExpression"`

#### Scenario: setVariable variable name change refactors all references
- **WHEN** `updateNodeConfig` is called on a `setVariable` node with `key: "variableName"` and a new string value
- **THEN** all expression strings in the graph that reference the old variable name MUST be updated to the new name

#### Scenario: extractor Label change refactors all references
- **WHEN** `updateNodeConfig` is called on an `extractor` node with `key: "extractExpression"` and a new string value
- **THEN** all expression strings in the graph that reference the old variable name MUST be updated to the new name

#### Scenario: Config update to a non-rename key does not trigger refactoring
- **WHEN** `updateNodeConfig` is called on an `extractor` node with `key: "tokenNumber"`
- **THEN** no variable reference refactoring MUST occur

#### Scenario: Node kind without renameConfigKey does not trigger refactoring on any key update
- **WHEN** `updateNodeConfig` is called on a node kind that does not declare `renameConfigKey`
- **THEN** no variable reference refactoring MUST occur regardless of the key updated
