"use client"

import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import { ArchiveIcon, ClipboardListIcon, UserCheckIcon } from "lucide-react"

import { WorkflowEditor, createInitialGraph, defineNode } from "@flow/flow"
import type { NodeDefinition } from "@flow/flow"

import { ExamplePreview } from "./example-preview"

type ReviewConfig = { assignee?: unknown; priority?: unknown }

/**
 * A fully hand-rendered node. Declaring `view` on the definition opts a kind
 * out of the package's `DefaultNodeRenderer` entirely — the component below
 * draws its own card and wires its own `Handle`s from `@xyflow/react`. The
 * handle `id`s must match the `sourceHandle` used on the edges, and the config
 * panel still renders from `fields`, independent of the view.
 */
function HumanReviewNode({ data, selected }: NodeProps) {
  const record = (data ?? {}) as { label?: unknown; config?: ReviewConfig }
  const config = record.config ?? {}
  const label = typeof record.label === "string" ? record.label : "Human review"
  const assignee =
    typeof config.assignee === "string" && config.assignee
      ? config.assignee
      : "Unassigned"
  const priority =
    typeof config.priority === "string" ? config.priority : "normal"

  return (
    <div
      className="relative w-[260px] rounded-xl border bg-white shadow-sm transition-shadow"
      style={{ borderColor: selected ? "#6366f1" : "#e5e7eb" }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 10, height: 10, background: "#6366f1", border: "none" }}
      />

      <div className="flex items-center gap-2 rounded-t-xl bg-indigo-50 px-3 py-2">
        <UserCheckIcon className="h-4 w-4 text-indigo-600" />
        <span className="text-sm font-semibold text-indigo-950">{label}</span>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs text-gray-600">{assignee}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{
            background:
              priority === "high"
                ? "#fee2e2"
                : priority === "low"
                  ? "#e0f2fe"
                  : "#f3f4f6",
            color:
              priority === "high"
                ? "#b91c1c"
                : priority === "low"
                  ? "#0369a1"
                  : "#374151",
          }}
        >
          {priority}
        </span>
      </div>

      <span className="pointer-events-none absolute right-3 top-[34%] -translate-y-1/2 text-[10px] font-medium text-emerald-600">
        approve
      </span>
      <Handle
        id="review-approve"
        type="source"
        position={Position.Right}
        style={{
          top: "38%",
          width: 10,
          height: 10,
          background: "#10b981",
          border: "none",
        }}
      />

      <span className="pointer-events-none absolute right-3 top-[68%] -translate-y-1/2 text-[10px] font-medium text-rose-600">
        reject
      </span>
      <Handle
        id="review-reject"
        type="source"
        position={Position.Right}
        style={{
          top: "72%",
          width: 10,
          height: 10,
          background: "#f43f5e",
          border: "none",
        }}
      />
    </div>
  )
}

const intakeForm = defineNode({
  kind: "intakeForm",
  title: "Intake form",
  description: "A submitted form starts the flow.",
  icon: ClipboardListIcon,
  category: "io",
  showTarget: false,
  fields: [{ key: "formId", label: "Form ID", type: "text" }],
  buildDefaultConfig: () => ({ formId: "" }),
  subtitle: (config) => (config.formId ? String(config.formId) : "Any form"),
  outputPaths: ["submission"],
  allowedTargets: ["humanReview"],
})

const humanReview = defineNode({
  kind: "humanReview",
  title: "Human review",
  description: "A person approves or rejects the submission.",
  icon: UserCheckIcon,
  category: "control",
  // The bespoke renderer. Everything else — palette, config panel, connection
  // rules — still comes from this definition.
  view: HumanReviewNode,
  fields: [
    { key: "assignee", label: "Assignee", type: "text" },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: [
        { label: "Low", value: "low" },
        { label: "Normal", value: "normal" },
        { label: "High", value: "high" },
      ],
    },
  ],
  buildDefaultConfig: () => ({ assignee: "", priority: "normal" }),
  outputPaths: ["approved", "rejected"],
  allowedTargets: ["archive"],
})

const archive = defineNode({
  kind: "archive",
  title: "Archive",
  description: "Store the outcome.",
  icon: ArchiveIcon,
  category: "data",
  fields: [
    {
      key: "store",
      label: "Store",
      type: "select",
      options: [
        { label: "Approved bucket", value: "approved" },
        { label: "Rejected bucket", value: "rejected" },
      ],
    },
  ],
  buildDefaultConfig: () => ({ store: "approved" }),
  subtitle: (config) => `→ ${config.store}`,
  outputs: [],
  outputPaths: [],
  allowedTargets: [],
})

const definitions: NodeDefinition[] = [intakeForm, humanReview, archive]

const initialGraph = createInitialGraph(definitions, {
  nodes: [
    {
      id: "demo-view-intake",
      kind: "intakeForm",
      config: { formId: "lead-signup" },
    },
    {
      id: "demo-view-review",
      kind: "humanReview",
      label: "Manager review",
      config: { assignee: "Alex", priority: "high" },
    },
    {
      id: "demo-view-approved",
      kind: "archive",
      label: "Approved",
      config: { store: "approved" },
    },
    {
      id: "demo-view-rejected",
      kind: "archive",
      label: "Rejected",
      config: { store: "rejected" },
    },
  ],
  edges: [
    {
      id: "demo-view-edge-intake-to-review",
      source: "demo-view-intake",
      target: "demo-view-review",
    },
    {
      id: "demo-view-edge-review-approve",
      source: "demo-view-review",
      sourceHandle: "review-approve",
      target: "demo-view-approved",
    },
    {
      id: "demo-view-edge-review-reject",
      source: "demo-view-review",
      sourceHandle: "review-reject",
      target: "demo-view-rejected",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-view",
    name: "Workflow Custom View Demo",
    metadata: { source: "docs-demo-custom-view" },
  },
})

const code = `import { Handle, Position, type NodeProps } from "@xyflow/react"
import { WorkflowEditor, createInitialGraph, defineNode } from "@flow/flow"
import { UserCheckIcon } from "lucide-react"

// A fully hand-rendered node. \`view\` opts the kind out of DefaultNodeRenderer;
// the component draws its own card and wires its own Handles. Handle ids must
// match the sourceHandle used on the edges.
function HumanReviewNode({ data, selected }: NodeProps) {
  const config = (data as { config?: { assignee?: string; priority?: string } }).config ?? {}
  const label = (data as { label?: string }).label ?? "Human review"
  return (
    <div className="relative w-[260px] rounded-xl border bg-white shadow-sm"
         style={{ borderColor: selected ? "#6366f1" : "#e5e7eb" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#6366f1" }} />
      <div className="rounded-t-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-950">{label}</div>
      <div className="px-3 py-2.5 text-xs text-gray-600">{config.assignee || "Unassigned"} · {config.priority ?? "normal"}</div>
      <Handle id="review-approve" type="source" position={Position.Right} style={{ top: "38%", background: "#10b981" }} />
      <Handle id="review-reject" type="source" position={Position.Right} style={{ top: "72%", background: "#f43f5e" }} />
    </div>
  )
}

const humanReview = defineNode({
  kind: "humanReview",
  title: "Human review",
  description: "A person approves or rejects the submission.",
  icon: UserCheckIcon,
  category: "control",
  view: HumanReviewNode, // <- the only thing a custom-rendered node needs
  fields: [
    { key: "assignee", label: "Assignee", type: "text" },
    { key: "priority", label: "Priority", type: "select", options: [
      { label: "Low", value: "low" },
      { label: "Normal", value: "normal" },
      { label: "High", value: "high" },
    ] },
  ],
  buildDefaultConfig: () => ({ assignee: "", priority: "normal" }),
  outputPaths: ["approved", "rejected"],
  allowedTargets: ["archive"],
})

// ...intakeForm and archive defined with the default renderer, then:
const definitions = [intakeForm, humanReview, archive]
const initialGraph = createInitialGraph(definitions, {
  nodes: [
    { id: "intake", kind: "intakeForm", config: { formId: "lead-signup" } },
    { id: "review", kind: "humanReview", label: "Manager review", config: { assignee: "Alex", priority: "high" } },
    { id: "approved", kind: "archive", label: "Approved", config: { store: "approved" } },
    { id: "rejected", kind: "archive", label: "Rejected", config: { store: "rejected" } },
  ],
  edges: [
    { id: "e1", source: "intake", target: "review" },
    { id: "e2", source: "review", sourceHandle: "review-approve", target: "approved" },
    { id: "e3", source: "review", sourceHandle: "review-reject", target: "rejected" },
  ],
})

export function Example() {
  return <WorkflowEditor definitions={definitions} initialGraph={initialGraph} />
}`

export function CustomViewExample() {
  return (
    <ExamplePreview
      title="Custom node renderer (view)"
      code={code}
    >
      <WorkflowEditor definitions={definitions} initialGraph={initialGraph} />
    </ExamplePreview>
  )
}
