## ADDED Requirements

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
