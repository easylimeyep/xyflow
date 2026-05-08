// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import {
  DEFAULT_EVALUATOR_OPERATOR_ID,
  WORKFLOW_NODE_KINDS,
  WorkflowEditor,
  isNodeKind,
} from "./index"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
  NodeKind,
  WorkflowExportDomainMapper,
  WorkflowGraphState,
  WorkflowImportDomainMapper,
  WorkflowNode,
} from "./index"

function RuntimeProbe() {
  const exportDomain = WorkflowEditor.use.store((state) => state.exportDomain)
  const hasRuntimeExportMapper = WorkflowEditor.use.store((state) =>
    Boolean(state.runtime.exportDomain?.mapper)
  )
  const hasRuntimeImportMapper = WorkflowEditor.use.store((state) =>
    Boolean(state.runtime.importDomain?.mapper)
  )

  return (
    <div>
      <span data-testid="workflow-editor-export-domain">
        {JSON.stringify(exportDomain(), null, 2)}
      </span>
      <span data-testid="workflow-editor-has-runtime-export-mapper">
        {String(hasRuntimeExportMapper)}
      </span>
      <span data-testid="workflow-editor-has-runtime-import-mapper">
        {String(hasRuntimeImportMapper)}
      </span>
    </div>
  )
}

describe("WorkflowEditor package root", () => {
  afterEach(() => {
    cleanup()
  })

  it("re-exports consumer workflow types and helpers from the package root", () => {
    const nodeKind: NodeKind = "inlineExpression"
    const nodeDto: DomainWorkflowNodeDTO = {
      id: "node-1",
      kind: nodeKind,
      position: { x: 0, y: 0 },
      label: "Keyword",
      config: {
        template: ["hello"],
        isRoot: true,
        repeatable: false,
        caseSensitive: false,
      },
    }
    const connectionDto: DomainWorkflowConnectionDTO = {
      id: "edge-1",
      sourceNodeId: "node-1",
      targetNodeId: "node-2",
      sourceHandle: null,
      targetHandle: null,
    }
    const workflowDto: DomainWorkflowDTO = {
      id: "workflow-1",
      name: "Workflow",
      version: 1,
      metadata: {},
      nodes: [nodeDto],
      connections: [connectionDto],
      viewport: { x: 0, y: 0, zoom: 1 },
    }
    const workflowNode: WorkflowNode = {
      id: nodeDto.id,
      type: "default",
      position: nodeDto.position,
      data: {
        kind: nodeDto.kind,
        label: nodeDto.label,
        config: nodeDto.config,
      },
    }
    const graphState: WorkflowGraphState = {
      nodes: [workflowNode],
      edges: [],
      viewport: workflowDto.viewport,
      document: {
        id: workflowDto.id,
        name: workflowDto.name,
        version: workflowDto.version,
        metadata: workflowDto.metadata,
      },
    }
    const exportMapper: WorkflowExportDomainMapper = (payload) => payload
    const importMapper: WorkflowImportDomainMapper = (payload) => payload

    expect(WORKFLOW_NODE_KINDS).toContain(nodeKind)
    expect(isNodeKind(nodeKind)).toBe(true)
    expect(DEFAULT_EVALUATOR_OPERATOR_ID).toBe("is equal to")
    expect(exportMapper(workflowDto)).toBe(workflowDto)
    expect(importMapper(workflowDto)).toBe(workflowDto)
    expect(graphState.nodes[0]?.data.kind).toBe(nodeKind)
  })

  it("lets consumers pass runtime import and export mappers", () => {
    render(
      <WorkflowEditor
        runtime={{
          importDomain: {
            mapper: (payload: DomainWorkflowDTO) => ({
              ...payload,
            }),
          },
          exportDomain: {
            mapper: (payload: DomainWorkflowDTO) => ({
              ...payload,
              metadata: {
                ...payload.metadata,
                consumerMapper: true,
              },
            }),
          },
        }}
      >
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-has-runtime-export-mapper").textContent
    ).toBe("true")
    expect(
      screen.getByTestId("workflow-editor-has-runtime-import-mapper").textContent
    ).toBe("true")
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"consumerMapper\": true")
  })

  it("lets consumers request measured initial auto-layout from package root", () => {
    render(
      <WorkflowEditor autoLayoutOnInit="after-measure">
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"nodes\"")
  })

  it("keeps the initial runtime config when WorkflowEditor rerenders", () => {
    const firstRuntime = {
      importDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            importRuntimeLabel: "first-runtime",
          },
        }),
      },
      exportDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            runtimeLabel: "first-runtime",
          },
        }),
      },
    }
    const secondRuntime = {
      importDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            importRuntimeLabel: "second-runtime",
          },
        }),
      },
      exportDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            runtimeLabel: "second-runtime",
          },
        }),
      },
    }

    const view = render(
      <WorkflowEditor runtime={firstRuntime}>
        <RuntimeProbe />
      </WorkflowEditor>
    )
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"runtimeLabel\": \"first-runtime\"")

    view.rerender(
      <WorkflowEditor runtime={secondRuntime}>
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"runtimeLabel\": \"first-runtime\"")
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).not.toContain("\"runtimeLabel\": \"second-runtime\"")

    view.unmount()
    render(
      <WorkflowEditor runtime={secondRuntime}>
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"runtimeLabel\": \"second-runtime\"")
  })
})
