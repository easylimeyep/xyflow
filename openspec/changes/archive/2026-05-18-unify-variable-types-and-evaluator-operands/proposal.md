## Why

Extractor, Setter, and Evaluator are all variable-oriented nodes, but their type metadata and editing contracts are uneven. Extractor already persists `variableType`, Setter has no matching type field, and Evaluator conditions still store operands as plain strings, which makes array operands awkward and does not scale to future value types such as `date`.

## What Changes

- Make Extractor and Setter variable metadata symmetrical in both UI and config storage.
- Render Extractor and Setter `Label` and `Type` controls in one single-line row: `Label | gap | Type`.
- Add Setter `config.variableType` with the same supported values as Extractor: `string` and `array`.
- **BREAKING** Replace Evaluator condition operand fields (`value` and `targetValue`) with typed operand objects.
- Support Evaluator operand types `string` and `array` for both left and right operands.
- Render array operands as repeatable free-text rows that allow spaces and may be empty.
- Preserve current evaluator operator set and case-sensitive behavior; operator filtering is out of scope for this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-variable-config`: Setter variable type metadata and symmetrical Label/Type editing are added alongside the existing Extractor variable type behavior.
- `workflow-evaluator-node`: Evaluator condition config changes from string operands to typed operand objects that support string and array values.

## Impact

- Affected code: workflow node configs, node definitions, config validation, node UI components, evaluator condition editor, domain/backend persistence tests, clipboard/import/export tests.
- Affected APIs: persisted Evaluator condition config shape changes from `value` / `targetValue` strings to typed operand objects.
- Runtime impact: backend consumers must read typed evaluator operands and apply existing case-sensitive comparison semantics to strings inside array operands.
- Dependencies: none.
