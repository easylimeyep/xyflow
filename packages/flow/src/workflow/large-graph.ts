/**
 * Past this many nodes the canvas switches to its large-graph rendering: it
 * mounts only the nodes and edges inside the viewport, and nodes well away
 * from it draw their compact card. A large graph otherwise keeps thousands of
 * off-screen elements in the DOM, and every pan frame pays to restyle them and
 * re-run their store selectors. A smaller graph stays fully mounted in full
 * view, so panning it never swaps or mounts a node.
 */
export const LARGE_GRAPH_MIN_NODES = 100
