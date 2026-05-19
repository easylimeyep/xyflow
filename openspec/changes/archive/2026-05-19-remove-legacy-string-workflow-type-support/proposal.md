## Why

The `rename-string-variable-type-to-value` implementation still includes compatibility paths that accept legacy workflow type literal `string` and normalize it to `value`. The product contract should be stricter: `value` and `array` are the only supported workflow variable/operand type literals, and stale `string` metadata should fail validation instead of being silently migrated.

## What Changes

- **BREAKING** Remove legacy normalization from workflow type metadata: `variableType: "string"`, operand `type: "string"`, runtime operator catalog `string` groups, and `allowTypes: ["string"]` are no longer accepted.
- Reject imports/config updates containing workflow type literal `string` wherever the workflow type system expects `value | array`.
- Remove regression tests and code paths that describe or assert legacy `string` workflow type normalization.
- Keep ordinary JavaScript string checks unchanged, such as `typeof value === "string"` and arrays whose entries are JavaScript strings.

## Capabilities

### New Capabilities

### Modified Capabilities

- `workflow-variable-config`: Extractor and Setter variable type config rejects `string` instead of normalizing it to `value`.
- `workflow-evaluator-node`: Evaluator operand type config rejects `string` instead of normalizing it to `value`.
- `workflow-branch-operator-options`: Evaluator operator catalogs reject `string` group keys and `allowTypes` entries instead of normalizing them to `value`.

## Impact

- Affected code: Extractor/Setter node definitions, Evaluator node definition, runtime evaluator operator catalog normalization, node-registry tests, store runtime tests, and OpenSpec artifacts from `rename-string-variable-type-to-value` if they are kept as the active implementation record.
- Affected API/config shape: `config.variableType`, evaluator operand `type`, evaluator operator catalog keys, and operator `allowTypes`.
- Compatibility: Existing payloads using workflow type literal `string` will be rejected; callers must emit `value` or `array`.
