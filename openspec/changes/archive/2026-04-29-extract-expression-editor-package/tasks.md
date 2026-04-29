## 1. Package Scaffold

- [x] 1.1 Create `packages/expression-editor` with package metadata, TypeScript config, lint/test scripts, and workspace exports.
- [x] 1.2 Add package dependencies for React, CodeMirror, `@uiw/react-codemirror`, `acorn`, and required `@workspace/ui` primitives.
- [x] 1.3 Add root exports for the editor component, public types, template utilities, and autocomplete utilities.

## 2. Move Pure Expression Logic

- [x] 2.1 Move template parsing, validation, and insertion helpers from flow into the expression editor package.
- [x] 2.2 Move builtin completion and autocomplete helper logic into the expression editor package.
- [x] 2.3 Move expression editor public types, including variable options and validation results, into the expression editor package.
- [x] 2.4 Update flow imports to consume moved pure utilities and shared types from the new package.

## 3. Move React Editor

- [x] 3.1 Move the CodeMirror-backed editor component into the expression editor package as `ExpressionEditor`.
- [x] 3.2 Rename the public persisted-value callback to `onCommit` while preserving blur, Enter, and variable insertion semantics.
- [x] 3.3 Keep live validation, external value sync, autocomplete, `{{}}` picker trigger detection, and variable insertion behavior intact.
- [x] 3.4 Move or expose expression editor-specific styles from the new package while leaving node layout styles in flow.
- [x] 3.5 Add a temporary flow-local wrapper or update flow call sites directly so existing workflow nodes render the new editor.

## 4. Preserve Flow Boundaries

- [x] 4.1 Keep `collectWorkflowVariables` and workflow graph traversal logic in `@workspace/flow`.
- [x] 4.2 Update set-variable, branch, extractor, and keyword expression list fields to pass prepared variable catalogs into `ExpressionEditor`.
- [x] 4.3 Remove obsolete flow-local expression editor files only after all flow imports use the reusable package.
- [x] 4.4 Remove CodeMirror and expression-editor-only dependencies from `@workspace/flow` when they are no longer imported directly.

## 5. Verification

- [x] 5.1 Move or recreate template and autocomplete unit tests in the expression editor package.
- [x] 5.2 Move or recreate editor lifecycle integration tests for blur commit, Enter commit, no per-keystroke commit, live validation, external value sync, and variable insertion.
- [x] 5.3 Keep flow-level coverage for workflow variable collection and expression field integration in workflow nodes.
- [x] 5.4 Run expression editor package tests.
- [x] 5.5 Run flow package tests.
- [x] 5.6 Run typecheck and lint for affected packages.
