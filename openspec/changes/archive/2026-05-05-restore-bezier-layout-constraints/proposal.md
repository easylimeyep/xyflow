## Why

The routed-edge implementation solved node overlap by drawing ELK orthogonal edge sections, but it changed the workflow editor's visual language from curved React Flow connections to straight, segmented paths and can visually merge separate connections into shared corridors. We want to keep the previous curved connection appearance and solve the original readability problem by improving ELK node placement and constraints instead.

## What Changes

- Restore workflow edge rendering to the previous Bezier-style visual by default.
- Treat ELK edge section rendering as out of scope for this change unless used only as internal layout evidence, not as the rendered connection path.
- Tune ELK node placement, spacing, and ordering constraints so shortcut branch connections get enough visual clearance without passing under unrelated nodes in the large ELK example.
- Add regression coverage that confirms auto-layout preserves graph connectivity and does not attach or appear to attach workflow connections to other connections.
- Keep workflow connection semantics node-to-node and handle-aware; no edge-to-edge connection model will be introduced.

## Capabilities

### New Capabilities

- `workflow-layout-clearance`: Requirements for keeping Bezier workflow connections visually readable by improving node layout clearance rather than rendering routed edge paths.

### Modified Capabilities

- `workflow-auto-layout`: Auto-layout must preserve curved connection rendering expectations while arranging nodes to reduce branch shortcut overlap with unrelated node bodies.

## Impact

- Affected code: `packages/flow/src/workflow/layout/*`, `packages/flow/src/workflow/components/workflow-edge/*`, workflow layout tests, and large ELK example tests.
- Affected behavior: workflow connections should render with the old curved visual style while ELK-driven node positions provide better clearance.
- No external API or persistence format changes are expected.
- The previous `add-elk-edge-routing` implementation becomes a candidate rollback or partial removal, depending on whether route metadata is still useful internally.
