import { builtinDefinitions, createInitialGraph } from "@flow/flow"

// Graphs for e2e/workflow-measured-layout-groups: the measured initial layout
// must not wait on the canvas nodes that draw groups (frames and cards).

// Keyword → Extractor → Setter → Result, with Extractor and Setter in one
// expanded group.
export const expandedGroupGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "expanded-keyword",
      kind: "inlineExpression",
      label: "Keyword",
      config: { template: ["order"], isRoot: true, repeatable: false },
    },
    {
      id: "expanded-extract",
      kind: "extractor",
      label: "Extract total",
      config: { tokenNumber: 1, extractExpression: "total", unlimited: false },
    },
    { id: "expanded-setter", kind: "setVariable", label: "Store total" },
    {
      id: "expanded-result",
      kind: "result",
      label: "Done",
      config: { category: "true" },
    },
  ],
  edges: [
    { source: "expanded-keyword", target: "expanded-extract" },
    { source: "expanded-extract", target: "expanded-setter" },
    { source: "expanded-setter", target: "expanded-result" },
  ],
  groups: [
    {
      id: "expanded-parse",
      label: "Parse",
      nodeIds: ["expanded-extract", "expanded-setter"],
    },
  ],
  document: { id: "measured-groups-expanded", name: "Expanded group" },
})

// The same chain split into two collapsed groups, so no workflow node is
// visible: only the group cards are drawn.
export const collapsedGroupsGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "collapsed-keyword",
      kind: "inlineExpression",
      label: "Keyword",
      config: { template: ["order"], isRoot: true, repeatable: false },
    },
    {
      id: "collapsed-extract",
      kind: "extractor",
      config: { tokenNumber: 1, extractExpression: "total", unlimited: false },
    },
    { id: "collapsed-setter", kind: "setVariable" },
    {
      id: "collapsed-result",
      kind: "result",
      label: "Done",
      config: { category: "true" },
    },
  ],
  edges: [
    { source: "collapsed-keyword", target: "collapsed-extract" },
    { source: "collapsed-extract", target: "collapsed-setter" },
    { source: "collapsed-setter", target: "collapsed-result" },
  ],
  groups: [
    {
      id: "collapsed-intake",
      label: "Intake",
      nodeIds: ["collapsed-keyword", "collapsed-extract"],
      collapsed: true,
    },
    {
      id: "collapsed-finish",
      label: "Finish",
      nodeIds: ["collapsed-setter", "collapsed-result"],
      collapsed: true,
    },
  ],
  document: { id: "measured-groups-collapsed", name: "Collapsed groups" },
})
