# workflow validation integration

`WorkflowEditor` accepts validation as an external snapshot. The host
application owns fetching, polling, streaming, and cache updates.

## Validation payload

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

`revision` identifies one server validation result. A new revision replaces
visible validation and clears locally hidden messages.

## Query-style polling

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

## Stream updates through query cache

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
