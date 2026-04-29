## Why

The workflow editor currently keeps reusable CodeMirror expression authoring behavior inside `@workspace/flow`, which couples the editor UI, template-expression rules, autocomplete, validation, and workflow-specific variable collection in one package. Extracting the reusable editor behavior now will let other workflow surfaces reuse the same expression authoring experience without copying the CodeMirror lifecycle fixes that already protect blur, Enter, validation, and variable insertion.

## What Changes

- Add a new workspace package for a reusable template expression editor backed by CodeMirror.
- Move expression editor UI behavior into the new package, including template parsing/validation, variable autocomplete, `{{ }}` insertion, picker behavior, and commit-on-blur/Enter lifecycle.
- Keep workflow graph-specific variable collection inside `@workspace/flow`; flow will pass a prepared variable catalog into the reusable editor.
- Expose a clearer commit-oriented public API for the editor so consumers distinguish committed value changes from live typing.
- Re-export pure expression utilities from the new package for tests and future non-workflow consumers.
- Update `@workspace/flow` to consume the package instead of owning the CodeMirror implementation directly.

## Capabilities

### New Capabilities
- `reusable-expression-editor-package`: Provides a workspace package containing the reusable CodeMirror expression editor component, public types, and expression utility exports.

### Modified Capabilities
- `expression-input-commit-lifecycle`: Clarifies that expression editor value persistence is commit-based and should be surfaced through a commit-oriented API while preserving the existing blur, Enter, live validation, external sync, and variable insertion behavior.

## Impact

- Affected packages: `packages/flow` and the new expression editor package under `packages/*`.
- Affected runtime behavior: expression fields in workflow nodes should behave the same after migration.
- Affected public APIs: new editor package exports `ExpressionEditor`, expression variable/completion/validation types, and pure template/autocomplete utilities; `@workspace/flow` uses those exports internally.
- Affected dependencies: CodeMirror, `@uiw/react-codemirror`, `acorn`, and UI primitives used by the editor move from direct flow ownership to the reusable editor package boundary.
