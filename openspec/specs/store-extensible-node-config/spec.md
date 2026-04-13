# store-extensible-node-config Specification

## Purpose
Define extensible node-config behaviors driven by NodeDefinition metadata, including expression-key discovery and rename-aware refactoring triggers.

## Requirements

### Requirement: NodeDefinition declares which config keys trigger expression refactoring
`NodeDefinition` SHALL include an optional `extraExpressionConfigKeys?: string[]` field. When present, the listed keys MUST be included in the set of keys that are treated as expression-valued config fields alongside the auto-detected field keys.

#### Scenario: setVariable expression key is included in expression config keys
- **WHEN** `getExpressionConfigKeys` is called for the `setVariable` node kind
- **THEN** `"valueExpression"` MUST be included in the returned keys

#### Scenario: Node kind without extra keys returns only field-derived keys
- **WHEN** `getExpressionConfigKeys` is called for a node kind that does not declare `extraExpressionConfigKeys`
- **THEN** only the auto-detected field keys MUST be returned (no undefined or null values appended)

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
- **WHEN** `updateNodeConfig` is called on a `setVariable` node with `key: "valueExpression"`
- **THEN** no variable reference refactoring MUST occur

#### Scenario: Extractor non-rename config update does not trigger refactoring
- **WHEN** `updateNodeConfig` is called on an `extractor` node with `key: "tokenNumber"`
- **THEN** no variable reference refactoring MUST occur

#### Scenario: Node kind without renameConfigKey does not trigger refactoring on any key update
- **WHEN** `updateNodeConfig` is called on a node kind that does not declare `renameConfigKey`
- **THEN** no variable reference refactoring MUST occur regardless of the key updated

### Requirement: Expression and rename config handling contains no hardcoded node kind strings
The implementations of `getExpressionConfigKeys` (in `refactor.ts`) and `applyNodeConfigUpdate` (in `node-config-updates.ts`) MUST NOT contain string literals matching node kind identifiers. All kind-specific behavior MUST be driven by `NodeDefinition` fields.

#### Scenario: Adding a new rename-aware node kind requires only definition file changes
- **WHEN** a new node kind is added with `renameConfigKey` declared in its `definition.ts`
- **THEN** rename-triggered refactoring MUST work automatically without modifying `refactor.ts` or `node-config-updates.ts`
