export function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
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
  return target instanceof HTMLElement && Boolean(target.closest('[data-slot="popover-content"]'))
}
