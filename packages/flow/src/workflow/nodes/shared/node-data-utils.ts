export function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry === "string")) {
      return value as string[]
    }

    return value.filter((entry): entry is string => typeof entry === "string")
  }

  return typeof value === "string" ? [value] : []
}

export function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function isInsideExpressionPopover(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('[data-slot="popover-content"]'))
  )
}

/**
 * Whether a stored value is acceptable for a select-backed config key.
 *
 * The check is deliberately shallow: a definition is a module constant and
 * cannot see `runtime.nodeOptions`, so it can no longer tell a host-supplied
 * option from a bogus value. Same bargain the evaluator's `operator` key has
 * always struck — the UI offers only the active options, and the backend owns
 * the meaning of whatever it listed.
 */
export function isSelectConfigValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
