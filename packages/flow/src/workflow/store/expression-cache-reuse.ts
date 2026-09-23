import type { ExpressionVariableOption } from "../types/types"

/**
 * Identity preservation for the expression caches.
 *
 * A rebuild recomputes every node's catalog, because the scope resolver is
 * host code and cannot be asked which nodes its answer changed for. Handing
 * back a fresh array for an answer that did not change is what made adding one
 * node re-render every node on the canvas: the catalog selectors compare with
 * `Object.is`.
 *
 * So the rebuild stays whole and the identity is reconciled afterwards —
 * a freshly computed entry equal to the one it replaces keeps the old
 * reference. Reused entries are shared between store states, so treat
 * everything these caches hold as read-only.
 */
export function reuseEqualCatalog(
  previous: ExpressionVariableOption[] | undefined,
  next: ExpressionVariableOption[]
): ExpressionVariableOption[] {
  if (!previous || previous.length !== next.length) {
    return next
  }

  const isSame = previous.every((option, index) => {
    const nextOption = next[index]
    return (
      nextOption !== undefined &&
      option.group === nextOption.group &&
      option.label === nextOption.label &&
      option.value === nextOption.value &&
      option.description === nextOption.description
    )
  })

  return isSame ? previous : next
}

export function reuseEqualVariableTypes(
  previous: Record<string, string> | undefined,
  next: Record<string, string>
): Record<string, string> {
  if (!previous) {
    return next
  }

  const previousKeys = Object.keys(previous)
  if (previousKeys.length !== Object.keys(next).length) {
    return next
  }

  const isSame = previousKeys.every((key) => previous[key] === next[key])
  return isSame ? previous : next
}
