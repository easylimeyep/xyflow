import { tv } from "tailwind-variants"

/**
 * Each color token points --group-color at its CSS variable (see style.css).
 * The surfaces below derive from it by mixing with the theme's background and
 * foreground, so one class per surface serves both light and dark mode.
 */
const groupColor = {
  gray: "[--group-color:var(--color-group-gray)]",
  blue: "[--group-color:var(--color-group-blue)]",
  green: "[--group-color:var(--color-group-green)]",
  yellow: "[--group-color:var(--color-group-yellow)]",
  orange: "[--group-color:var(--color-group-orange)]",
  red: "[--group-color:var(--color-group-red)]",
  purple: "[--group-color:var(--color-group-purple)]",
  pink: "[--group-color:var(--color-group-pink)]",
} as const

const colorVariants = {
  gray: { root: groupColor.gray },
  blue: { root: groupColor.blue },
  green: { root: groupColor.green },
  yellow: { root: groupColor.yellow },
  orange: { root: groupColor.orange },
  red: { root: groupColor.red },
  purple: { root: groupColor.purple },
  pink: { root: groupColor.pink },
}

const surface = {
  header:
    "bg-[color-mix(in_oklab,var(--group-color)_18%,var(--background))] text-[color-mix(in_oklab,var(--group-color)_40%,var(--foreground))]",
  inner: "bg-[color-mix(in_oklab,var(--group-color)_7%,var(--background))]",
  border:
    "border-[color-mix(in_oklab,var(--group-color)_35%,var(--background))]",
}

export const groupFrameStyles = tv({
  slots: {
    // The whole frame takes the pointer like a node: a click selects the
    // group and a drag moves it. Shift+drag still starts a box selection, and
    // nodes and edges drawn above the frame keep their own pointer events.
    root: "relative flex size-full cursor-grab flex-col rounded-2xl active:cursor-grabbing",
    // A colored band behind the bar. Its bottom padding runs under the
    // content panel (pulled up by the negative margin), so the header color
    // shows around the panel's rounded top corners.
    header: ["-mb-3 shrink-0 rounded-t-2xl pb-3", surface.header],
    // The bar is GROUP_FRAME_HEADER_HEIGHT tall. It is the group's focus
    // target and holds its title, context menu, and actions.
    bar: "flex h-10 items-center gap-2 rounded-t-2xl px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
    inner: [
      "relative min-h-0 flex-1 rounded-2xl border shadow-sm",
      surface.inner,
      surface.border,
    ],
    title: "min-w-0 truncate text-sm font-semibold",
    count:
      "shrink-0 rounded-full bg-background/60 px-1.5 text-[11px] font-medium tabular-nums",
    actions: "nodrag nopan ml-auto flex shrink-0 items-center",
    renameInput:
      "nodrag nopan flex-1 bg-background font-semibold text-foreground md:text-sm dark:bg-background",
    // The resize lines and handles come before the header and the content
    // panel, which take the pointer to drag the group. Lifted above them, a
    // press on an edge resizes instead of moving the group.
    resizeLine: "z-10",
    resizeHandle: "z-10",
  },
  variants: {
    color: colorVariants,
    selected: {
      true: { root: "ring-4 ring-ring/40" },
    },
    editable: {
      false: { root: "cursor-default active:cursor-default" },
    },
    searchState: {
      none: {},
      match: {
        title: "rounded-sm bg-amber-300/70 px-0.5 dark:bg-amber-400/40",
      },
      current: {
        title: "rounded-sm bg-primary px-0.5 text-primary-foreground",
      },
    },
  },
  defaultVariants: {
    color: "blue",
    selected: false,
    editable: true,
    searchState: "none",
  },
})

export const groupCardStyles = tv({
  slots: {
    root: [
      "relative flex size-full items-center gap-2 rounded-2xl border px-3 shadow-sm",
      surface.header,
      surface.border,
    ],
    title: "min-w-0 flex-1 truncate text-sm font-semibold",
    count:
      "shrink-0 rounded-full bg-background/60 px-1.5 text-[11px] font-medium tabular-nums",
    status: "size-2.5 shrink-0 rounded-full",
    error: "size-4 shrink-0 text-destructive",
    actions: "nodrag nopan flex shrink-0 items-center",
    handle: "!size-2 !border-2 !bg-background",
  },
  variants: {
    color: colorVariants,
    selected: {
      true: { root: "shadow-md ring-4 ring-ring/40" },
    },
    hasError: {
      true: { root: "border-destructive ring-4 ring-destructive/25" },
    },
    runtimeStatus: {
      none: { status: "hidden" },
      failed: { status: "bg-destructive" },
      running: { status: "animate-pulse bg-primary" },
      waiting: { status: "bg-amber-400" },
      done: { status: "bg-emerald-500" },
      skipped: { status: "bg-muted-foreground/40" },
    },
    searchState: {
      none: {},
      match: {
        title: "rounded-sm bg-amber-300/70 px-0.5 dark:bg-amber-400/40",
      },
      current: {
        title: "rounded-sm bg-primary px-0.5 text-primary-foreground",
      },
    },
  },
  defaultVariants: {
    color: "blue",
    selected: false,
    hasError: false,
    runtimeStatus: "none",
    searchState: "none",
  },
})

/**
 * The header's action dock: a capsule lifted off the tinted header, its
 * buttons inked and hovered in the group's own color. Reads --group-color
 * from the frame or card it sits in.
 */
export const groupToolbarStyles = tv({
  slots: {
    dock: [
      "flex items-center gap-0.5 rounded-lg p-0.5 shadow-xs ring-1 backdrop-blur-sm",
      "bg-[color-mix(in_oklab,var(--group-color)_6%,var(--background))]/80",
      "ring-[color-mix(in_oklab,var(--group-color)_30%,var(--background))]",
    ],
    button: [
      "size-7 rounded-md text-[color-mix(in_oklab,var(--group-color)_55%,var(--foreground))]",
      "hover:bg-[color-mix(in_oklab,var(--group-color)_22%,var(--background))] hover:text-foreground",
      "aria-expanded:bg-transparent aria-expanded:text-[color-mix(in_oklab,var(--group-color)_55%,var(--foreground))]",
      "dark:hover:bg-[color-mix(in_oklab,var(--group-color)_28%,var(--background))]",
      "data-[pressed]:bg-[color-mix(in_oklab,var(--group-color)_30%,var(--background))]",
    ],
    icon: "size-4",
    divider:
      "mx-0.5 h-4 w-px bg-[color-mix(in_oklab,var(--group-color)_30%,var(--background))]",
    // The color button shows the group's current color instead of a generic
    // palette glyph, so the setting is readable without opening the popover.
    swatchDot:
      "size-3.5 rounded-full bg-(--group-color) ring-2 ring-background shadow-[0_0_0_3px_color-mix(in_oklab,var(--group-color)_35%,transparent)]",
  },
})

export const groupColorPickerStyles = tv({
  slots: {
    root: "nodrag nopan flex flex-col gap-2",
    swatches: "flex flex-wrap gap-1.5",
    swatch:
      "size-6 rounded-full bg-(--group-color) ring-offset-2 ring-offset-popover outline-none focus-visible:ring-2 focus-visible:ring-ring",
  },
  variants: {
    color: {
      gray: { swatch: groupColor.gray },
      blue: { swatch: groupColor.blue },
      green: { swatch: groupColor.green },
      yellow: { swatch: groupColor.yellow },
      orange: { swatch: groupColor.orange },
      red: { swatch: groupColor.red },
      purple: { swatch: groupColor.purple },
      pink: { swatch: groupColor.pink },
    },
    active: {
      true: { swatch: "ring-2 ring-foreground" },
    },
  },
})
