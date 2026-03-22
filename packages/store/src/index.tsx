import { create } from "zustand"
export { createContextStore } from "./context-store"
export type {
  ContextStore,
  ContextStoreEqualityFn,
  ContextStoreFactory,
  ContextStoreItemProps,
  ContextStoreSelector,
} from "./context-store"

export interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function createHistoryState<T>(initialValue: T): HistoryState<T> {
  return {
    past: [],
    present: initialValue,
    future: [],
  }
}

export function pushHistoryState<T>(
  history: HistoryState<T>,
  nextValue: T,
  limit = 50
): HistoryState<T> {
  const normalizedLimit = Math.max(limit, 1)
  const nextPast = [...history.past, history.present]
  const trimmedPast =
    nextPast.length > normalizedLimit
      ? nextPast.slice(nextPast.length - normalizedLimit)
      : nextPast

  return {
    past: trimmedPast,
    present: nextValue,
    future: [],
  }
}

export function undoHistoryState<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) {
    return history
  }

  const previousValue = history.past[history.past.length - 1]
  if (previousValue === undefined) {
    return history
  }
  const reducedPast = history.past.slice(0, -1)

  return {
    past: reducedPast,
    present: previousValue,
    future: [history.present, ...history.future],
  }
}

export function redoHistoryState<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) {
    return history
  }

  const nextValue = history.future[0]
  if (nextValue === undefined) {
    return history
  }
  const reducedFuture = history.future.slice(1)

  return {
    past: [...history.past, history.present],
    present: nextValue,
    future: reducedFuture,
  }
}

export { create }
