"use client"

import * as React from "react"
import {
  Collection,
  Header as HeaderPrimitive,
  ListBox as ListBoxPrimitive,
  ListBoxItem as ListBoxItemPrimitive,
  ListBoxSection as ListBoxSectionPrimitive,
  ListLayout,
  Virtualizer,
  type ListBoxItemProps as ListBoxItemPrimitiveProps,
  type ListBoxProps as ListBoxPrimitiveProps,
  type ListBoxSectionProps as ListBoxSectionPrimitiveProps,
} from "react-aria-components"

import { cn } from "@flow/ui/lib/utils"

type ListBoxProps<T extends object> = Omit<
  ListBoxPrimitiveProps<T>,
  "className"
> & {
  className?: string
}

/**
 * A standalone list of options, for results or pickers outside a popover.
 *
 * `forwardRef` so the ref survives React 18, which drops `ref` from the props
 * of a plain function component; the cast restores the item type parameter
 * that `forwardRef` erases.
 */
const ListBox = React.forwardRef(function ListBox<T extends object>(
  { className, ...props }: ListBoxProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <ListBoxPrimitive
      ref={ref}
      data-slot="list-box"
      className={cn(
        "overflow-x-hidden overflow-y-auto outline-hidden",
        className
      )}
      {...props}
    />
  )
}) as <T extends object>(
  props: ListBoxProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement

type ListBoxSectionProps<T extends object> = Omit<
  ListBoxSectionPrimitiveProps<T>,
  "className"
> & {
  className?: string
}

function ListBoxSection<T extends object>({
  className,
  ...props
}: ListBoxSectionProps<T>) {
  return (
    <ListBoxSectionPrimitive
      data-slot="list-box-section"
      className={className}
      {...props}
    />
  )
}

/** A section's heading; not an option, so it is never focused or selected. */
function ListBoxHeader({
  className,
  ...props
}: React.ComponentProps<typeof HeaderPrimitive>) {
  return (
    <HeaderPrimitive
      data-slot="list-box-header"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

type ListBoxItemProps<T extends object> = Omit<
  ListBoxItemPrimitiveProps<T>,
  "className"
> & {
  className?: string
}

function ListBoxItem<T extends object>({
  className,
  ...props
}: ListBoxItemProps<T>) {
  return (
    <ListBoxItemPrimitive
      data-slot="list-box-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed outline-hidden select-none data-focus-visible:ring-2 data-focus-visible:ring-ring/40 data-hovered:bg-accent/60 data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export {
  Collection,
  ListBox,
  ListBoxHeader,
  ListBoxItem,
  ListBoxSection,
  ListLayout,
  Virtualizer,
}
export type { ListBoxItemProps, ListBoxProps, ListBoxSectionProps }
