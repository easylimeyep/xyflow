## Context

`WorkflowEditor` currently keeps graph state, UI intent state, history, runtime configuration, and transient editor operation errors in the workflow store. The existing `lastError` state is suited for editor actions such as invalid connections, import failures, clipboard failures, or layout failures. Server-side workflow validation has a different lifecycle: it is supplied by the host application, can update repeatedly through polling or streaming, and should not become part of the persisted graph document.

Validation display needs two surfaces:

- workflow-level messages that apply to the whole graph;
- node-level messages that identify a specific workflow node and optionally a field path.

## Goals / Non-Goals

**Goals:**

- Accept externally supplied validation snapshots through `WorkflowEditor`.
- Keep validation outside `WorkflowGraphState`, undo/redo, clipboard, duplicate, import/export, and node `data`.
- Display global validation messages through the existing `Alert` component.
- Display node validation through a destructive node visual state and a compact message affordance.
- Optimistically hide node validation after local edits and restore current server truth when a new validation revision arrives.
- Provide examples for query/polling and stream-driven host integrations.

**Non-Goals:**

- The editor will not fetch validation from the server directly.
- The editor will not define backend validation rules.
- The editor will not persist validation messages in exported workflow JSON.
- Field-level inline validation inside every node control is out of scope for the first implementation, though the API should carry `fieldPath` for future use.

## Decisions

### Use a controlled validation prop

`WorkflowEditor` will accept a `validation?: WorkflowValidationSnapshot | null` prop. The host application owns fetching, polling, cache updates, and stream subscriptions.

Example polling/query integration:

```tsx
function WorkflowPage({ workflowId }: { workflowId: string }) {
  const workflowQuery = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => api.getWorkflow(workflowId),
  })

  const validationQuery = useQuery({
    queryKey: ["workflow-validation", workflowId],
    queryFn: () => api.getWorkflowValidation(workflowId),
    enabled: workflowQuery.isSuccess,
    refetchInterval: 3000,
  })

  if (!workflowQuery.data) return null

  return (
    <WorkflowEditor
      initialGraph={workflowQuery.data.graph}
      validation={validationQuery.data ?? null}
    />
  )
}
```

Example stream integration that keeps query cache as the host-side source:

```tsx
function useWorkflowValidation(workflowId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["workflow-validation", workflowId],
    queryFn: () => api.getWorkflowValidation(workflowId),
  })

  useEffect(() => {
    return api.subscribeToValidation(workflowId, (nextValidation) => {
      queryClient.setQueryData(
        ["workflow-validation", workflowId],
        nextValidation
      )
    })
  }, [queryClient, workflowId])

  return query
}
```

The editor sync layer can use `useEffect`:

```tsx
function WorkflowValidationSync({
  validation,
}: {
  validation: WorkflowValidationSnapshot | null | undefined
}) {
  const setValidation = useWorkflowStore((state) => state.setValidation)

  useEffect(() => {
    setValidation(validation ?? null)
  }, [setValidation, validation])

  return null
}
```

Stable object identity is useful, but correctness should rely on `revision`, not referential equality. The store should ignore repeated snapshots with the same revision when possible.

### Define a snapshot API with revision

The validation input should describe a complete server validation result:

```ts
type WorkflowValidationSeverity = "error" | "warning" | "info"

interface WorkflowValidationMessage {
  id?: string
  code?: string
  message: string
  severity?: WorkflowValidationSeverity
}

interface WorkflowNodeValidationMessage extends WorkflowValidationMessage {
  nodeId: string
  fieldPath?: string
}

interface WorkflowValidationSnapshot {
  workflowId?: string
  workflowVersion?: number
  revision?: string
  global?: WorkflowValidationMessage[]
  nodes?: WorkflowNodeValidationMessage[]
}
```

Example payload:

```json
{
  "workflowId": "lead-qualification",
  "workflowVersion": 42,
  "revision": "validation-42",
  "global": [
    {
      "code": "WORKFLOW_HAS_NO_ENTRYPOINT",
      "message": "Workflow must contain exactly one root Keyword node.",
      "severity": "error"
    }
  ],
  "nodes": [
    {
      "nodeId": "node-3",
      "code": "MISSING_FALSE_BRANCH",
      "message": "Evaluator node must have a false branch.",
      "severity": "error"
    },
    {
      "nodeId": "node-7",
      "code": "UNKNOWN_VARIABLE",
      "message": "Variable `customerScore` is not available here.",
      "severity": "warning",
      "fieldPath": "config.valueExpression"
    }
  ]
}
```

`revision` means "this is a distinct server validation result." When a new revision arrives, local hidden validation state is cleared and visible messages are recalculated from the new snapshot.

### Store validation outside graph history

The workflow store should add a validation slice or validation-owned state:

```ts
interface WorkflowValidationStoreState {
  server: NormalizedWorkflowValidation | null
  locallyHiddenKeys: Set<string>
}
```

The normalized state should include:

- global messages in display order;
- node messages grouped by `nodeId`;
- stable keys for messages, derived from `id`, or from `nodeId`, `code`, `fieldPath`, and `message` when no `id` exists.

Selectors should expose visible validation only:

- `selectVisibleGlobalValidationMessages(state)`;
- `selectVisibleValidationMessagesForNode(state, nodeId)`;
- `selectNodeHasVisibleValidation(state, nodeId)`.

### Hide stale local validation optimistically

Local edits should hide visible validation that likely refers to stale server state. This does not mutate the server snapshot; it adds keys or node ids to a local hidden set.

Initial rule set:

- label/config changes hide validation messages for that node;
- edge changes hide validation for touched source/target nodes and may hide global validation;
- node add/delete hides global validation and validation for affected nodes;
- import clears current validation or marks it hidden until the host provides a validation snapshot for the imported graph;
- a new server revision replaces validation and clears local hidden state.

This gives immediate feedback after a user fixes a node while preserving the server as the source of truth.

### Render global validation through Alert

Workflow-level messages should render in a dedicated validation alert surface near the editor body/canvas composition, not in `EditorToolbar` status. The toolbar status can remain focused on transient editor operation messages.

If multiple global messages are present, the first message should be visible without interaction. Additional messages can be summarized or listed in the same alert depending on available space.

### Render node validation through NodeShell

Node validation should be displayed by `NodeShell` so default and custom node renderers share consistent behavior. A node with visible validation should:

- use a destructive border/ring state without changing persisted node data;
- expose an icon or compact header affordance;
- expose message text through a tooltip or popover;
- keep node dimensions stable enough to avoid disruptive layout shifts.

The first implementation should avoid rendering full validation text inline inside node bodies by default.

## Risks / Trade-offs

- [Stale validation can reappear after local edits] -> Require a server `revision` and clear local hidden state only when a new revision arrives.
- [Unstable validation prop object causes repeated sync effects] -> Let hosts pass query data directly when possible and make `setValidation` no-op for repeated revisions.
- [Hiding a node error may hide a still-valid server error until the next snapshot] -> This is an intentional UX trade-off; the server remains source of truth on the next revision.
- [Node error text can disturb graph layout] -> Use compact icon/tooltip/popover surfaces instead of inline body text by default.
- [Global validation may be hidden too aggressively] -> Hide global messages only on structural graph changes and full imports, not every text/config edit.
- [Validation message keys can collide when server omits ids] -> Prefer server-provided `id`; otherwise derive a deterministic fallback key from message fields.
