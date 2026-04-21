## Why

`WorkflowEditor` already accepts runtime customization for import/export mapping, but branch boolean conditions still rely on a hardcoded operator list and hardcoded "requires target" behavior. Consumers cannot align the boolean block with domain-specific operator vocabularies without forking the editor.

## What Changes

- Add a public `WorkflowEditor` runtime option for supplying branch boolean operators from the outside.
- Define a typed operator contract with `id` and `value`, plus the metadata needed to render and validate boolean-condition inputs without hardcoded operator maps.
- Update the branch boolean node UI to resolve its operator list from the mounted editor runtime and fall back to the current built-in operators when no overrides are provided.
- Preserve current behavior for existing consumers by keeping the current operator set as the default runtime fallback.
- Handle graphs whose stored operator id is missing from the injected operator list without breaking the config UI.

## Capabilities

### New Capabilities
- `workflow-branch-operator-options`: configurable operator definitions for the branch boolean block, including default fallback behavior and UI handling for operator-specific target input requirements.

### Modified Capabilities
- `workflow-editor-compound-api`: `WorkflowEditor` runtime API exposes branch boolean operator overrides to all descendant editor parts.

## Impact

- Affected code: `packages/flow/src/workflow/components/workflow-editor`, `packages/flow/src/workflow/store`, `packages/flow/src/workflow/nodes/logic`, and shared workflow types/constants.
- Public API: expands `WorkflowRuntimeConfig` and `WorkflowEditor` runtime customization surface.
- Data/runtime behavior: branch condition operators become runtime-driven in the UI while preserving current defaults for existing graphs and consumers.
