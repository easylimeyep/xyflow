export const EXAMPLE_TABS = [
  "base",
  "with-default-graph",
  "with-elk-graph",
  "with-large-elk-graph",
  "with-custom-operators",
  "with-backend-transform",
  "with-tour-anchors",
  "with-validation",
  "with-global-validation",
  "with-fullscreen-modal",
] as const

export type ExampleTab = (typeof EXAMPLE_TABS)[number]

export const DEFAULT_EXAMPLE_TAB: ExampleTab = "with-custom-operators"

export const EXAMPLE_TAB_SEARCH_PARAM = "tab"

export function isExampleTab(value: string | null): value is ExampleTab {
  return EXAMPLE_TABS.includes(value as ExampleTab)
}
