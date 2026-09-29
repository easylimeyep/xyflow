"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react"

import { searchFieldStyles } from "../../../styles/components/nodes"
import {
  SEARCH_TITLE_FIELD,
  coversSearchFieldKey,
  selectNodeHasCurrentField,
  selectNodeSearchStatus,
  useFieldSearchStatus,
  useWorkflowShallowStore,
  useWorkflowStoreApi,
  type FieldSearchStatusOptions,
  type NodeSearchStatus,
} from "../../store"
import { ExpressionInput } from "../expression-input"

/**
 * The fields a node view has actually rendered, so the node knows whether the
 * current match has a field on screen to carry the strong mark.
 *
 * A field walked for search but not drawn — a condition hidden while multiple
 * conditions are off, an operand the row swaps for a badge, anything on a kind
 * rendered by the generic renderer — never registers, and the node then keeps
 * the strong mark itself.
 */
interface SearchFieldRegistry {
  register: (fieldKey: string, includeChildren: boolean) => () => void
}

const SearchFieldRegistryContext = createContext<SearchFieldRegistry | null>(
  null
)

/** Provides a node view's field registry to the marks rendered inside it. */
export const SearchFieldRegistryProvider = SearchFieldRegistryContext.Provider

interface RegisterSearchFieldOptions extends FieldSearchStatusOptions {
  /** False while the field is not rendered; it then does not register. */
  enabled?: boolean
}

/** Registers a rendered field with the node view around it, if any. */
export function useRegisterSearchField(
  fieldKey: string,
  { includeChildren = false, enabled = true }: RegisterSearchFieldOptions = {}
): void {
  const registry = useContext(SearchFieldRegistryContext)
  useEffect(() => {
    if (!registry || !enabled) {
      return
    }
    return registry.register(fieldKey, includeChildren)
  }, [registry, fieldKey, includeChildren, enabled])
}

export interface NodeSearchMarks {
  searchState: NodeSearchStatus
  hasCurrentSearchField: boolean
}

/**
 * A node's own search marks, plus the registry its fields report into.
 *
 * The node subscribes to two values only: whether it holds matches, and
 * whether the current match sits on a rendered field. Moving the current match
 * between two rendered fields changes neither, so the node view does not
 * re-render — only the two field marks do.
 */
export function useNodeSearchMarks(
  nodeId: string
): NodeSearchMarks & { fieldRegistry: SearchFieldRegistry } {
  const storeApi = useWorkflowStoreApi()
  const renderedFieldsRef = useRef(new Map<string, Map<boolean, number>>())
  // Fields mount before a search usually opens, and the selector reads the
  // registry on every store change anyway. Re-render only when the set moves
  // while a search is open, where no store change would pick it up.
  const [, refresh] = useReducer((count: number) => count + 1, 0)

  const fieldRegistry = useMemo<SearchFieldRegistry>(() => {
    const update = (fieldKey: string, includeChildren: boolean, by: 1 | -1) => {
      const variants = renderedFieldsRef.current.get(fieldKey) ?? new Map()
      const count = (variants.get(includeChildren) ?? 0) + by
      if (count > 0) {
        variants.set(includeChildren, count)
      } else {
        variants.delete(includeChildren)
      }
      if (variants.size > 0) {
        renderedFieldsRef.current.set(fieldKey, variants)
      } else {
        renderedFieldsRef.current.delete(fieldKey)
      }
      if (storeApi.getState().search.isOpen) {
        refresh()
      }
    }
    return {
      register: (fieldKey, includeChildren) => {
        update(fieldKey, includeChildren, 1)
        return () => update(fieldKey, includeChildren, -1)
      },
    }
  }, [storeApi])

  const isFieldShown = (fieldKey: string) => {
    if (fieldKey === SEARCH_TITLE_FIELD) {
      return true
    }
    for (const [renderedKey, variants] of renderedFieldsRef.current) {
      for (const includeChildren of variants.keys()) {
        if (coversSearchFieldKey(fieldKey, renderedKey, includeChildren)) {
          return true
        }
      }
    }
    return false
  }

  const marks = useWorkflowShallowStore(
    (state): NodeSearchMarks => ({
      searchState: selectNodeSearchStatus(state, nodeId),
      hasCurrentSearchField: selectNodeHasCurrentField(
        state,
        nodeId,
        isFieldShown
      ),
    })
  )

  return { ...marks, fieldRegistry }
}

interface SearchFieldTarget extends FieldSearchStatusOptions {
  nodeId: string
  /** The field's search key: a config key, or `SEARCH_TITLE_FIELD`. */
  fieldKey: string
}

export interface SearchFieldMarkProps extends SearchFieldTarget {
  children: ReactNode
  /** Extra classes for the wrapper, merged into the mark's own. */
  className?: string
}

/**
 * Wraps one field and marks it while it holds a canvas-search match.
 *
 * It subscribes on its own, so a mark moving between fields re-renders these
 * wrappers only; the field inside is the same element and is left alone.
 */
export function SearchFieldMark({
  nodeId,
  fieldKey,
  includeChildren,
  children,
  className,
}: SearchFieldMarkProps) {
  const searchState = useFieldSearchStatus(nodeId, fieldKey, {
    includeChildren,
  })
  useRegisterSearchField(fieldKey, { includeChildren })

  return (
    <div
      className={searchFieldStyles({ searchState, class: className })}
      data-field-search-state={searchState === "none" ? undefined : searchState}
    >
      {children}
    </div>
  )
}

export interface SearchMarkedTitleProps {
  nodeId: string
  children: ReactNode
}

/** A node title that marks itself while it holds a label match. */
export function SearchMarkedTitle({
  nodeId,
  children,
}: SearchMarkedTitleProps) {
  const searchState = useFieldSearchStatus(nodeId, SEARCH_TITLE_FIELD)

  return (
    <span
      className={searchFieldStyles({ searchState, class: "-mx-1 px-1" })}
      data-field-search-state={searchState === "none" ? undefined : searchState}
    >
      {children}
    </span>
  )
}

export type SearchMarkedExpressionInputProps = SearchFieldTarget &
  Omit<ComponentProps<typeof ExpressionInput>, "searchState">

/** An `ExpressionInput` that marks itself while it holds a search match. */
export function SearchMarkedExpressionInput({
  nodeId,
  fieldKey,
  includeChildren,
  ...inputProps
}: SearchMarkedExpressionInputProps) {
  const searchState = useFieldSearchStatus(nodeId, fieldKey, {
    includeChildren,
  })
  useRegisterSearchField(fieldKey, { includeChildren })

  return <ExpressionInput {...inputProps} searchState={searchState} />
}
