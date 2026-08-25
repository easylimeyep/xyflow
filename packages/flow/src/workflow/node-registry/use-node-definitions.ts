"use client"

import { useSyncExternalStore } from "react"

import type { NodeDefinition } from "./define-node"
import { listNodeDefinitions, subscribeNodeDefinitions } from "./registry"
import { listNodeViews, type NodeViewMap } from "./view-registry"

/**
 * The live node vocabulary, re-rendering the caller when a consumer registers
 * more kinds.
 *
 * The snapshot is the definition array itself, whose identity changes only on a
 * registration, so a component reading this does not re-render on unrelated
 * state. Server rendering gets the same list — registration happens at module
 * scope, so it is already in place by the time anything renders.
 */
export function useNodeDefinitions(): readonly NodeDefinition[] {
  return useSyncExternalStore(
    subscribeNodeDefinitions,
    listNodeDefinitions,
    listNodeDefinitions
  )
}

/**
 * The live map of bespoke node renderers. Registering a view replaces the map
 * with a new object, so its identity is a sound memo dependency.
 */
export function useNodeViews(): NodeViewMap {
  return useSyncExternalStore(
    subscribeNodeDefinitions,
    listNodeViews,
    listNodeViews
  )
}
