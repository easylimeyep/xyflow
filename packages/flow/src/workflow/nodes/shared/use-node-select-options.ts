import { useWorkflowStore, type WorkflowStoreState } from "../../store"
import type { FieldOption } from "../../types"

/**
 * The choices one select-backed config key offers.
 *
 * A host replaces them per kind through `runtime.nodeOptions[kind][configKey]`
 * (see `WorkflowNodeOptionsCatalog`); the list the node ships with is the
 * fallback, so a host that configures nothing keeps the built-in vocabulary.
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
 */
export function resolveSelectedOptionValue(
  options: readonly FieldOption[],
  storedValue: unknown,
  fallbackValue: string
): string {
  if (
    typeof storedValue === "string" &&
    options.some((option) => option.value === storedValue)
  ) {
    return storedValue
  }

  return options[0]?.value ?? fallbackValue
}
