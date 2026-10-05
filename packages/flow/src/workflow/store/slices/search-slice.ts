import { DEFAULT_SEARCH_MATCH_OPTIONS } from "../../search/matches"
import {
  selectCurrentSearchMatch,
  selectSearchMatches,
} from "../search-selectors"
import type {
  SearchSourceFilter,
  WorkflowSearchState,
  WorkflowSliceCreator,
  WorkflowStoreState,
} from "../types"

const ALL_SOURCES: SearchSourceFilter = {
  label: true,
  "variable-definition": true,
  "variable-reference": true,
}

const INITIAL_SEARCH: WorkflowSearchState = {
  isOpen: false,
  query: "",
  currentKey: null,
  currentSortTuple: null,
  isResultsOpen: false,
  options: DEFAULT_SEARCH_MATCH_OPTIONS,
  sources: ALL_SOURCES,
}

/** What closing leaves behind: the session goes, the preferences stay. */
function closedSearch(search: WorkflowSearchState): WorkflowSearchState {
  return {
    ...search,
    isOpen: false,
    query: "",
    currentKey: null,
    currentSortTuple: null,
  }
}

/** Moves the current match by `step`, wrapping at both ends. */
function stepSearch(
  state: WorkflowStoreState,
  step: 1 | -1
): Partial<WorkflowStoreState> | WorkflowStoreState {
  const matches = selectSearchMatches(state)
  if (matches.length === 0) {
    return state
  }
  const current = selectCurrentSearchMatch(state)
  const index = current ? matches.indexOf(current) : -1
  const nextIndex = (index + step + matches.length) % matches.length
  const next = matches[nextIndex]!
  return {
    search: {
      ...state.search,
      currentKey: next.key,
      currentSortTuple: next.sortTuple,
    },
  }
}

export const createSearchSlice: WorkflowSliceCreator = (set, get) => ({
  search: INITIAL_SEARCH,
  openSearch: () => {
    set((state) =>
      state.search.isOpen
        ? state
        : { search: { ...state.search, isOpen: true } }
    )
  },
  closeSearch: () => {
    set((state) => {
      const { isOpen, query, currentKey, currentSortTuple } = state.search
      const isClosed =
        !isOpen && query === "" && currentKey === null && !currentSortTuple
      return isClosed ? state : { search: closedSearch(state.search) }
    })
  },
  setSearchQuery: (query) => {
    set((state) =>
      state.search.query === query
        ? state
        : {
            // A new query starts over at its first match.
            search: {
              ...state.search,
              query,
              currentKey: null,
              currentSortTuple: null,
            },
          }
    )
  },
  searchNext: () => {
    set((state) => stepSearch(state, 1))
  },
  searchPrev: () => {
    set((state) => stepSearch(state, -1))
  },
  selectCurrentSearchNode: () => {
    const current = selectCurrentSearchMatch(get())
    if (!current) {
      return
    }
    if (current.target === "group") {
      get().setSelectedNodes([])
      get().setSelectedGroups([current.groupId])
      return
    }
    get().setSelectedNode(current.nodeId)
  },
  setSearchCurrentMatch: (key) => {
    set((state) => {
      if (state.search.currentKey === key) {
        return state
      }
      const match = selectSearchMatches(state).find(
        (candidate) => candidate.key === key
      )
      return match
        ? {
            search: {
              ...state.search,
              currentKey: match.key,
              currentSortTuple: match.sortTuple,
            },
          }
        : state
    })
  },
  toggleSearchResults: () => {
    set((state) => ({
      search: { ...state.search, isResultsOpen: !state.search.isResultsOpen },
    }))
  },
  setSearchOption: (name, value) => {
    set((state) =>
      state.search.options[name] === value
        ? state
        : {
            search: {
              ...state.search,
              options: { ...state.search.options, [name]: value },
            },
          }
    )
  },
  setSearchSources: (sources) => {
    set((state) => ({ search: { ...state.search, sources } }))
  },
  resetSearchSources: () => {
    set((state) =>
      state.search.sources === ALL_SOURCES
        ? state
        : { search: { ...state.search, sources: ALL_SOURCES } }
    )
  },
  syncSearchCurrentMatch: () => {
    set((state) => {
      const current = selectCurrentSearchMatch(state)
      if (!current || current.key === state.search.currentKey) {
        return state
      }
      return {
        search: {
          ...state.search,
          currentKey: current.key,
          currentSortTuple: current.sortTuple,
        },
      }
    })
  },
})
