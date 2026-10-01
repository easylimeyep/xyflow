# consumer-node-config-keys Specification

## Purpose
Make a node definition's declared fields the authority on which config keys a kind supports, so a
consumer's kind can declare a field it does not seed, and let a consumer express a config update for
its own kind in the package's public types.

## Requirements

### Requirement: A definition's declared fields are its config surface
The package SHALL resolve the config keys a kind supports from the union of its `fields` keys, its
`inlineFields` keys and the keys of its default config. Editing, normalization and document decoding
MUST all resolve key validity through that same set.

#### Scenario: A declared key without a default value is editable
- **WHEN** a definition declares a field whose key its `buildDefaultConfig` omits, and a config
  update targets that key with a value its `validateConfigValue` accepts
- **THEN** the update MUST be applied to the node

#### Scenario: An undeclared key is still refused
- **WHEN** a config update targets a key that appears in neither the fields nor the default config
- **THEN** the update MUST fail with the unsupported-config-key error and the graph MUST be unchanged

#### Scenario: A declared key survives normalization
- **WHEN** a config carrying a declared-but-unseeded key is normalized
- **THEN** the normalized config MUST retain that key's value, and MUST still drop a key the
  definition does not declare

#### Scenario: A document carrying a declared key decodes
- **WHEN** a stored node config carrying a declared-but-unseeded key is decoded
- **THEN** decoding MUST succeed and the decoded config MUST retain that key

### Requirement: Config updates are expressible for registered kinds
The public `NodeConfigUpdate` type SHALL admit an update for a kind registered by a consumer, typed
as a kind, a key and a JSON value, alongside the exactly-typed payloads for the built-in kinds.
Because a built-in kind cannot be excluded from `string` at the type level, a payload that names a
built-in kind but carries a value of the wrong type is a type-level match; it SHALL be rejected at
runtime by the definition's own value check.

#### Scenario: A consumer types an update for its own kind
- **WHEN** a consumer builds a config update for a kind it registered
- **THEN** that value MUST satisfy `NodeConfigUpdate` without casting

#### Scenario: A wrongly typed built-in value is refused at runtime
- **WHEN** a config update names a built-in kind and carries a value its definition rejects
- **THEN** the update MUST fail with the invalid-config-value error and the graph MUST be unchanged
