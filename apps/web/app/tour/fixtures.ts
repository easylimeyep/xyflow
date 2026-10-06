import { builtinDefinitions, createInitialGraph } from "@flow/flow"

// Graph for the tour clips recorded by e2e/media: Keyword → Extractor →
// Setter → Result. createInitialGraph does not position nodes; each page
// either lays the chain out on mount or places the nodes itself.
export const tourChainGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "tour-keyword",
      kind: "inlineExpression",
      label: "Keyword",
      config: { template: ["order"], isRoot: true, repeatable: false },
    },
    {
      id: "tour-extract",
      kind: "extractor",
      config: { tokenNumber: 1, extractExpression: "total", unlimited: false },
    },
    { id: "tour-setter", kind: "setVariable" },
    {
      id: "tour-result",
      kind: "result",
      label: "Done",
      config: { category: "true" },
    },
  ],
  edges: [
    { source: "tour-keyword", target: "tour-extract" },
    { source: "tour-extract", target: "tour-setter" },
    { source: "tour-setter", target: "tour-result" },
  ],
  document: { id: "tour-chain", name: "Tour chain" },
})

// For the search clip: `total` is defined by Extractor and Setter, and read by
// both Setters, so a "total" query hits labels, variables and references.
export const tourSearchGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "search-keyword",
      kind: "inlineExpression",
      label: "Keyword",
      config: { template: ["order"], isRoot: true, repeatable: false },
    },
    {
      id: "search-extract",
      kind: "extractor",
      config: { tokenNumber: 1, extractExpression: "total", unlimited: false },
    },
    {
      id: "search-subtotal",
      kind: "setVariable",
      label: "Subtotal",
      config: { variableName: "subtotal", valueExpression: "{{ total }}" },
    },
    {
      id: "search-with-tax",
      kind: "setVariable",
      label: "Total with tax",
      config: {
        variableName: "totalWithTax",
        valueExpression: "{{ subtotal }} * 1.2",
      },
    },
    {
      id: "search-result",
      kind: "result",
      label: "Done",
      config: { category: "true" },
    },
  ],
  edges: [
    { source: "search-keyword", target: "search-extract" },
    { source: "search-extract", target: "search-subtotal" },
    { source: "search-subtotal", target: "search-with-tax" },
    { source: "search-with-tax", target: "search-result" },
  ],
  document: { id: "tour-search", name: "Tour search" },
})
