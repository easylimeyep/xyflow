export {
  cloneGraphState,
  commitGraphState,
  createInitialHistory,
  replacePresentGraphState,
} from "./history-helpers"

export {
  collectDescendantNodeIds,
  createSmartQuickAddPosition,
  getEdgeSplitInsertPosition,
  getNodeRect,
  resolveSubgraphShiftX,
  shiftNodesBySubgraph,
} from "./geometry"

export {
  filterEdgesForRemovedNodes,
  getRemovedNodeIds,
  hasEdgeCollectionChanged,
  hasNodeCollectionChanged,
  hasOutgoingConnection,
  haveSameIdSet,
  normalizeSelectionIds,
  shouldCommitEdgeHistory,
  shouldCommitNodeHistory,
  shouldSquashPreviousEdgeRemovalWithNodeRemoval,
} from "./collection-diff"

export {
  navigatorClipboardAdapter,
  readTextFromClipboard,
  setClipboardAdapter,
  writeTextToClipboard,
} from "./clipboard-io"
export type { ClipboardAdapter } from "./clipboard-io"

export {
  asDomainConnectionDTO,
  asDomainNodeDTO,
  toEdgeConnectionWithKind,
} from "./dto-mappers"

export {
  createUniqueJsIdentifier,
  createUniqueLabel,
  getFallbackPasteAnchor,
  getSetVariableNames,
} from "./naming"
