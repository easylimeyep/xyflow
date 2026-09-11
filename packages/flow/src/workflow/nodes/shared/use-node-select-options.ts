import { useWorkflowStore, type WorkflowStoreState } from "../../store"
import type { FieldOption } from "../../types"

/**
 * The choices one select-backed config key offers.
 *
 * A host replaces them per kind through `runtime.nodeOptions[kind][configKey]`
 * (see `WorkflowNodeOptionsCatalog`); the list the node ships with is the
 * fallback, so a host that configures nothing keeps the built-in vocabulary.
 * An empty list from the host is honoured as an empty list — these catalogs
 * usually come from a server, and falling back to the built-ins when it
 * returns nothing would offer values that server never sanctioned. The node
 * renders a disabled select in that case.
 *
 * The runtime config is normalized once when the store is created, which makes
 * the returned array referentially stable across renders.
 */
export function useNodeSelectOptions(
  kind: string,
  configKey: string,
  fallbackOptions: readonly FieldOption[]
): readonly FieldOption[] {
  const hostOptions = useWorkflowStore(
    (state: WorkflowStoreState): FieldOption[] | undefined =>
      state.runtime.nodeOptions?.[kind]?.[configKey]
  )

  return hostOptions ?? fallbackOptions
}

/**
 * The value the select should show: the stored one when the active options
 * still offer it, otherwise the first option. A config saved under a different
 * option set must not leave the select blank — and neither must a node dropped
 * with the built-in default while the host supplies its own choices, since
 * `buildDefaultConfig` is a module constant that cannot see the runtime.
 *
 * With no options at all the stored value is kept as-is: there is nothing to
 * reconcile against, and an empty catalog is a transient server state that
 * must not rewrite what the node already holds.
 */
export function resolveSelectedOptionValue(
  options: readonly FieldOption[],
  storedValue: unknown,
  fallbackValue: string
): string {
  const storedText = typeof storedValue === "string" ? storedValue : ""

  if (options.length === 0) {
    return storedText || fallbackValue
  }

  if (options.some((option) => option.value === storedText)) {
    return storedText
  }

  return options[0]?.value ?? fallbackValue
}
