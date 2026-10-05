import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../../node-registry/registry"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowGroupDTO,
  DomainWorkflowNodeDTO,
} from "../../types"

import {
  exportDomainWorkflowForBackend,
  exportDraftDomainWorkflowForBackend,
} from "./backend-export"

const registry = createNodeRegistry(builtinBaseDefinitions)

function node(
  id: string,
  kind: DomainWorkflowNodeDTO["kind"],
  x: number,
  config: DomainWorkflowNodeDTO["config"] = {}
): DomainWorkflowNodeDTO {
  return { id, kind, position: { x, y: 0 }, label: id, config }
}

function connection(
  sourceNodeId: string,
  targetNodeId: string
): DomainWorkflowConnectionDTO {
  return {
    id: `${sourceNodeId}-${targetNodeId}`,
    sourceNodeId,
    targetNodeId,
    sourceHandle: null,
    targetHandle: null,
  }
}

function group(
  nodeIds: string[],
  overrides: Partial<DomainWorkflowGroupDTO> = {}
): DomainWorkflowGroupDTO {
  return {
    id: "g1",
    label: "Parse",
    color: "green",
    x: -20,
    y: -60,
    width: 900,
    height: 300,
    collapsed: true,
    nodeIds,
    ...overrides,
  }
}

/** root → step → result, exported as ids 1, 2, 3. */
function workflow(groups?: DomainWorkflowGroupDTO[]): DomainWorkflowDTO {
  return {
    id: "workflow-1",
    name: "Workflow",
    version: 1,
    metadata: {},
    nodes: [
      node("result", "result", 400, { category: "true" }),
      node("step", "setVariable", 200, {
        variableName: "value",
        valueExpression: "{{ root }}",
      }),
      node("root", "inlineExpression", 0, { isRoot: true }),
    ],
    connections: [connection("root", "step"), connection("step", "result")],
    ...(groups ? { groups } : {}),
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

describe.each([
  ["strict", exportDomainWorkflowForBackend],
  ["draft", exportDraftDomainWorkflowForBackend],
])("%s backend export with groups", (_mode, exportWorkflow) => {
  it("references the exported numeric node ids, sorted ascending", () => {
    const backend = exportWorkflow(
      registry,
      workflow([group(["result", "step"])])
    )

    expect(backend.groups).toEqual([
      {
        id: "g1",
        label: "Parse",
        color: "green",
        x: -20,
        y: -60,
        width: 900,
        height: 300,
        collapsed: true,
        nodeIds: [2, 3],
      },
    ])
  })

  it("exports an empty group with no node ids", () => {
    const backend = exportWorkflow(registry, workflow([group([])]))
    expect(backend.groups[0]?.nodeIds).toEqual([])
  })

  it("exports an empty list when the workflow has no groups", () => {
    expect(exportWorkflow(registry, workflow()).groups).toEqual([])
  })

  it("leaves the node payloads unchanged", () => {
    const withGroups = exportWorkflow(
      registry,
      workflow([group(["root", "step", "result"])])
    )
    const withoutGroups = exportWorkflow(registry, workflow())
    expect(withGroups.nodes).toEqual(withoutGroups.nodes)
  })

  it("never reads groups for ordering or reachability", () => {
    expect(() =>
      exportWorkflow(
        registry,
        workflow([
          group(["root"], { id: "g1" }),
          group(["step", "result"], { id: "g2" }),
        ])
      )
    ).not.toThrow()
  })
})
