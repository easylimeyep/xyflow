# store-extensible-node-config Specification

## Purpose
Define extensible node-config behaviors driven by NodeDefinition metadata, including expression-key discovery and rename-aware refactoring triggers.

## Requirements

### Requirement: NodeDefinition declares which config keys trigger expression refactoring
`NodeDefinition` SHALL expose expression-bearing config keys through a typed behavior contract in Node API v2. Runtime expression refactoring discovery MUST use this behavior contract and MUST NOT depend on UI field declarations alone.

#### Scenario: Expression key discovery includes behavior-declared keys
- **WHEN** expression keys are resolved for a node kind
- **THEN** keys declared by Node API v2 behavior metadata MUST be included in the resolved expression key set

#### Scenario: Node kind without expression behavior has no expression keys
- **WHEN** expression keys are resolved for a node kind that does not declare expression behavior keys
- **THEN** runtime MUST return an empty expression key set for that node kind

### Requirement: NodeDefinition declares the rename config key for rename-aware nodes
Node API v2 SHALL declare rename-trigger behavior for node config keys. When a typed config update targets a declared rename key with a valid identifier transition, runtime MUST apply rename-aware expression refactoring across graph expressions.

#### Scenario: Rename behavior executes for rename-aware key updates
- **WHEN** a typed config update changes a rename-aware key on a node definition that declares rename behavior
- **THEN** graph expression references to the old identifier MUST be refactored to the new identifier

#### Scenario: Non-rename key updates do not trigger rename refactoring
- **WHEN** a typed config update changes a non-rename key
- **THEN** rename-driven expression refactoring MUST NOT be executed

#### Scenario: Node kind without rename behavior never triggers rename refactoring
- **WHEN** a typed config update is applied to a node kind that does not declare rename behavior
- **THEN** rename-driven expression refactoring MUST NOT be executed

### Requirement: Expression and rename config handling contains no hardcoded node kind strings
Implementations of expression-key discovery and rename-trigger handling SHALL be behavior-driven by Node API v2 definitions and MUST NOT contain node-kind-specific hardcoded branching.

#### Scenario: Adding new rename-aware node kind requires only definition updates
- **WHEN** a new node kind is introduced with rename and expression behavior metadata in its definition
- **THEN** expression and rename handling MUST work without modifying shared runtime refactor dispatch code

### Requirement: NodeDefinition declares refactoring for structured config values
Node definitions SHALL be able to declare how expression templates nested inside a structured config value (a value that is neither a string nor an array of strings) are rewritten during rename refactoring. Runtime refactoring MUST apply a declared rewrite to that config key and MUST leave structured values without a declared rewrite unchanged. The dispatch MUST remain behavior-driven and MUST NOT branch on node kind.

#### Scenario: Declared structured rewrite is applied on rename
- **WHEN** a node definition declares a structured rewrite for a config key and a variable referenced inside that key's value is renamed
- **THEN** the runtime MUST apply the rewrite so the nested references use the new name

#### Scenario: Structured value without a declared rewrite is untouched
- **WHEN** a variable is renamed and a node config key holds a structured value with no declared rewrite
- **THEN** the runtime MUST leave that value unchanged

#### Scenario: Unchanged structured value keeps node identity
- **WHEN** a declared structured rewrite produces no change for a node
- **THEN** the runtime MUST return that node unchanged
