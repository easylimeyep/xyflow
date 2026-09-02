"use client"

import { BracesIcon, SendIcon, WebhookIcon } from "lucide-react"

import { WorkflowEditor, createInitialGraph, defineNode } from "@flow/flow"
import type { NodeDefinition } from "@flow/flow"

import { ExamplePreview } from "./example-preview"

/**
 * A vocabulary built entirely from consumer-defined kinds — no built-ins at all.
 * Each kind is declared with `defineNode` and rendered by the package's own
 * node renderer (fields, subtitle, icon, labeled outputs), so a custom node
 * needs no bespoke React component to look at home on the canvas.
 */
const httpRequest = defineNode({
  kind: "httpRequest",
  title: "HTTP request",
  description: "Call an external endpoint and emit its response.",
  icon: WebhookIcon,
  category: "io",
  // A trigger has no incoming edge — it starts the flow.
  showTarget: false,
  fields: [
    { key: "url", label: "URL", type: "text", placeholder: "https://api…" },
    {
      key: "method",
      label: "Method",
      type: "select",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
    },
  ],
  buildDefaultConfig: () => ({ url: "", method: "GET" }),
  subtitle: (config) =>
    config.url ? `${config.method} ${config.url}` : "No endpoint set",
  outputPaths: ["response"],
  allowedTargets: ["jsonPath", "sendMessage"],
})

const jsonPath = defineNode({
  kind: "jsonPath",
  title: "JSON path",
  description: "Pluck a value out of the incoming payload.",
  icon: BracesIcon,
  category: "data",
  fields: [
    {
      key: "expression",
      label: "Path",
      type: "text",
      ui: "expression",
      placeholder: "data.items[0].email",
    },
    { key: "fallback", label: "Fallback", type: "text" },
  ],
  buildDefaultConfig: () => ({ expression: "", fallback: "" }),
  subtitle: (config) =>
    config.expression ? String(config.expression) : "No path set",
  outputPaths: ["value"],
  allowedTargets: ["jsonPath", "sendMessage"],
})

const sendMessage = defineNode({
  kind: "sendMessage",
  title: "Send message",
  description: "Post the result to a channel.",
  icon: SendIcon,
  category: "io",
  fields: [
    {
      key: "channel",
      label: "Channel",
      type: "select",
      options: [
        { label: "#alerts", value: "#alerts" },
        { label: "#general", value: "#general" },
      ],
    },
    { key: "message", label: "Message", type: "textarea" },
  ],
  buildDefaultConfig: () => ({ channel: "#alerts", message: "" }),
  subtitle: (config) => `→ ${config.channel}`,
  // A terminal node emits nothing, so it draws no output handle.
  outputs: [],
  outputPaths: [],
  allowedTargets: [],
})

const customDefinitions: NodeDefinition[] = [httpRequest, jsonPath, sendMessage]

const initialGraph = createInitialGraph(customDefinitions, {
  nodes: [
    {
      id: "demo-custom-http",
      kind: "httpRequest",
      config: { url: "https://api.example.com/leads", method: "GET" },
    },
    {
      id: "demo-custom-json",
      kind: "jsonPath",
      label: "Pick email",
      config: { expression: "data.items[0].email", fallback: "" },
    },
    {
      id: "demo-custom-send",
      kind: "sendMessage",
      label: "Notify sales",
      config: { channel: "#alerts", message: "New lead: {{ value }}" },
    },
  ],
  edges: [
    {
      id: "demo-custom-edge-http-to-json",
      source: "demo-custom-http",
      target: "demo-custom-json",
    },
    {
      id: "demo-custom-edge-json-to-send",
      source: "demo-custom-json",
      target: "demo-custom-send",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-nodes",
    name: "Workflow Custom Nodes Demo",
    metadata: { source: "docs-demo-custom-nodes" },
  },
})

const code = `import { WorkflowEditor, createInitialGraph, defineNode } from "@flow/flow"
import { BracesIcon, SendIcon, WebhookIcon } from "lucide-react"

// A vocabulary made only of consumer-defined kinds. No built-ins.
const httpRequest = defineNode({
  kind: "httpRequest",
  title: "HTTP request",
  description: "Call an external endpoint and emit its response.",
  icon: WebhookIcon,
  category: "io",
  showTarget: false, // a trigger has no incoming edge
  fields: [
    { key: "url", label: "URL", type: "text" },
    { key: "method", label: "Method", type: "select", options: [
      { label: "GET", value: "GET" },
      { label: "POST", value: "POST" },
    ] },
  ],
  buildDefaultConfig: () => ({ url: "", method: "GET" }),
  subtitle: (config) => (config.url ? \`\${config.method} \${config.url}\` : "No endpoint set"),
  outputPaths: ["response"],
  allowedTargets: ["jsonPath", "sendMessage"],
})

const jsonPath = defineNode({
  kind: "jsonPath",
  title: "JSON path",
  description: "Pluck a value out of the incoming payload.",
  icon: BracesIcon,
  category: "data",
  fields: [
    { key: "expression", label: "Path", type: "text", ui: "expression" },
    { key: "fallback", label: "Fallback", type: "text" },
  ],
  buildDefaultConfig: () => ({ expression: "", fallback: "" }),
  subtitle: (config) => (config.expression ? String(config.expression) : "No path set"),
  outputPaths: ["value"],
  allowedTargets: ["jsonPath", "sendMessage"],
})

const sendMessage = defineNode({
  kind: "sendMessage",
  title: "Send message",
  description: "Post the result to a channel.",
  icon: SendIcon,
  category: "io",
  fields: [
    { key: "channel", label: "Channel", type: "select", options: [
      { label: "#alerts", value: "#alerts" },
      { label: "#general", value: "#general" },
    ] },
    { key: "message", label: "Message", type: "textarea" },
  ],
  buildDefaultConfig: () => ({ channel: "#alerts", message: "" }),
  subtitle: (config) => \`→ \${config.channel}\`,
  outputs: [], // terminal node: no output handle
  outputPaths: [],
  allowedTargets: [],
})

const customDefinitions = [httpRequest, jsonPath, sendMessage]

const initialGraph = createInitialGraph(customDefinitions, {
  nodes: [
    { id: "http", kind: "httpRequest", config: { url: "https://api.example.com/leads", method: "GET" } },
    { id: "json", kind: "jsonPath", label: "Pick email", config: { expression: "data.items[0].email", fallback: "" } },
    { id: "send", kind: "sendMessage", label: "Notify sales", config: { channel: "#alerts", message: "New lead: {{ value }}" } },
  ],
  edges: [
    { id: "e1", source: "http", target: "json" },
    { id: "e2", source: "json", target: "send" },
  ],
})

export function Example() {
  return (
    <WorkflowEditor definitions={customDefinitions} initialGraph={initialGraph} />
  )
}`

export function CustomNodesExample() {
  return (
    <ExamplePreview
      title="Only custom nodes"
      code={code}
    >
      <WorkflowEditor
        definitions={customDefinitions}
        initialGraph={initialGraph}
      />
    </ExamplePreview>
  )
}
