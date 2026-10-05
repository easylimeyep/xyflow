// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react"
import { useEffect, type ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowNode } from "../types/types"
import {
  useFieldSearchStatus,
  useNodeSearchStatus,
  useWorkflowStoreApi,
  WorkflowStoreProvider,
  type WorkflowStoreState,
} from "./store"

const registry = createNodeRegistry(builtinBaseDefinitions)

function inline(id: string, y: number, template: string[]): WorkflowNode {
  const node = createWorkflowNode(
    registry,
    "inlineExpression",
    { x: 0, y },
    "Inline"
  )
  node.data.config.template = template
  return { ...node, id }
}

const NODE_IDS = ["a", "b", "c"] as const
const FIELD_PROBES = [
  ["a", "template[0]"],
  ["b", "template[0]"],
  ["c", "template[0]"],
  ["a", ":title"],
] as const
const fieldProbeKey = (nodeId: string, fieldKey: string) =>
  `${nodeId}/${fieldKey}`

function renderProbes() {
  const renders: Record<string, number> = { a: 0, b: 0, c: 0 }
  const statuses: Record<string, string> = {}
  const fieldRenders: Record<string, number> = {}
  const fieldStatuses: Record<string, string> = {}
  let api: { getState: () => WorkflowStoreState } | null = null

  // Recorded in effects, not during render: an effect with no deps runs once
  // per committed render, which is exactly the count this suite asserts on.
  function Probe({ nodeId }: { nodeId: string }) {
    const status = useNodeSearchStatus(nodeId)
    useEffect(() => {
      renders[nodeId] = (renders[nodeId] ?? 0) + 1
      statuses[nodeId] = status
    })
    return null
  }

  function FieldProbe({
    nodeId,
    fieldKey,
  }: {
    nodeId: string
    fieldKey: string
  }) {
    const status = useFieldSearchStatus(nodeId, fieldKey)
    useEffect(() => {
      const probe = fieldProbeKey(nodeId, fieldKey)
      fieldRenders[probe] = (fieldRenders[probe] ?? 0) + 1
      fieldStatuses[probe] = status
    })
    return null
  }

  function CaptureApi(): ReactNode {
    const storeApi = useWorkflowStoreApi()
    useEffect(() => {
      api = storeApi
    }, [storeApi])
    return null
  }

  render(
    <WorkflowStoreProvider
      definitions={builtinBaseDefinitions}
      initialGraph={{
        nodes: [
          inline("a", 0, ["{{ price }} {{ price }}"]),
          inline("b", 100, ["{{ price }}"]),
          inline("c", 200, ["{{ other }}"]),
        ],
        edges: [],
        groups: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        document: { id: "doc", name: "Doc", version: 1, metadata: {} },
      }}
    >
      <CaptureApi />
      {NODE_IDS.map((id) => (
        <Probe key={id} nodeId={id} />
      ))}
      {FIELD_PROBES.map(([nodeId, fieldKey]) => (
        <FieldProbe
          key={fieldProbeKey(nodeId, fieldKey)}
          nodeId={nodeId}
          fieldKey={fieldKey}
        />
      ))}
    </WorkflowStoreProvider>
  )

  const state = () => api!.getState()
  const resetRenders = () => {
    NODE_IDS.forEach((id) => (renders[id] = 0))
    FIELD_PROBES.forEach(
      ([nodeId, fieldKey]) =>
        (fieldRenders[fieldProbeKey(nodeId, fieldKey)] = 0)
    )
  }
  return { renders, statuses, fieldRenders, fieldStatuses, state, resetRenders }
}

describe("useNodeSearchStatus re-renders", () => {
  afterEach(() => {
    cleanup()
  })

  it("re-renders no node when the current match moves within one node", () => {
    const { renders, statuses, state, resetRenders } = renderProbes()
    act(() => {
      state().openSearch()
      state().setSearchQuery("price")
    })
    expect(statuses).toEqual({ a: "current", b: "match", c: "none" })
    resetRenders()

    act(() => state().searchNext())

    expect(statuses.a).toBe("current")
    expect(renders).toEqual({ a: 0, b: 0, c: 0 })
  })

  it("re-renders only the two nodes whose status swapped", () => {
    const { renders, statuses, state, resetRenders } = renderProbes()
    act(() => {
      state().openSearch()
      state().setSearchQuery("price")
      state().searchNext()
    })
    resetRenders()

    act(() => state().searchNext())

    expect(statuses).toEqual({ a: "match", b: "current", c: "none" })
    expect(renders).toEqual({ a: 1, b: 1, c: 0 })
  })

  it("re-renders no field when the current match moves within one field", () => {
    const { fieldRenders, fieldStatuses, state, resetRenders } = renderProbes()
    act(() => {
      state().openSearch()
      state().setSearchQuery("price")
    })
    expect(fieldStatuses["a/template[0]"]).toBe("current")
    resetRenders()

    act(() => state().searchNext())

    expect(Object.values(fieldRenders).every((count) => count === 0)).toBe(true)
  })

  it("re-renders only the two fields whose status swapped", () => {
    const { fieldRenders, fieldStatuses, state, resetRenders } = renderProbes()
    act(() => {
      state().openSearch()
      state().setSearchQuery("price")
      state().searchNext()
    })
    resetRenders()

    act(() => state().searchNext())

    expect(fieldStatuses).toEqual({
      "a/template[0]": "match",
      "b/template[0]": "current",
      "c/template[0]": "none",
      "a/:title": "none",
    })
    expect(fieldRenders).toEqual({
      "a/template[0]": 1,
      "b/template[0]": 1,
      "c/template[0]": 0,
      "a/:title": 0,
    })
  })
})
