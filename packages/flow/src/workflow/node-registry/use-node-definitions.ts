"use client"

import type { NodeDefinition } from "./define-node"
import type { NodeRegistry } from "./registry"
import { selectNodeRegistry } from "../store/selectors"
import { useWorkflowStore } from "../store/store"

/**
 * The vocabulary of the editor this component is inside.
 *
 * Read from the store rather than a module singleton, so two editors on one
 * page disagree about what exists without fighting, and there is no window in
 * which a canvas has mounted against a vocabulary nobody has filled yet.
 */
export function useNodeRegistry(): NodeRegistry {
  return useWorkflowStore(selectNodeRegistry)
}

export function useNodeDefinitions(): readonly NodeDefinition[] {
  return useWorkflowStore((state) => state.registry.list())
}
