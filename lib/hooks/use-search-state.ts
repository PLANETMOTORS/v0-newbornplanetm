/**
 * lib/hooks/use-search-state.ts
 *
 * Centralised search-bar state via useReducer.
 * Keeps all transitions explicit and testable — no scattered useState.
 */

import { useReducer, type Dispatch } from "react"
import type { PopularSearch } from "@/lib/search/data"
import type { SmartSuggestion } from "@/lib/typesense/search"

// ── Types ──────────────────────────────────────────────────────────────────

export interface SearchGroupItem {
  readonly label: string
  readonly count?: number
  readonly href: string
  readonly field?: SmartSuggestion["field"]
}

export interface SearchGroup {
  readonly heading: string
  readonly items: readonly SearchGroupItem[]
}

export interface SearchState {
  readonly isOpen: boolean
  readonly query: string
  readonly popular: readonly PopularSearch[]
  readonly groups: readonly SearchGroup[]
  readonly isLoading: boolean
  readonly activeIndex: number
}

export type SearchAction =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SET_QUERY"; payload: string }
  | { type: "SET_POPULAR"; payload: readonly PopularSearch[] }
  | { type: "SET_GROUPS"; payload: readonly SearchGroup[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTIVE_INDEX"; payload: number }
  | { type: "MOVE_DOWN"; payload: number }
  | { type: "MOVE_UP"; payload: number }

// ── Reducer ────────────────────────────────────────────────────────────────

const INITIAL_STATE: SearchState = {
  isOpen: false,
  query: "",
  popular: [],
  groups: [],
  isLoading: false,
  activeIndex: -1,
}

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true, activeIndex: -1 }
    case "CLOSE":
      return {
        ...state,
        isOpen: false,
        query: "",
        groups: [],
        isLoading: false,
        activeIndex: -1,
      }
    case "SET_QUERY":
      return { ...state, query: action.payload, activeIndex: -1 }
    case "SET_POPULAR":
      return { ...state, popular: action.payload }
    case "SET_GROUPS":
      return { ...state, groups: action.payload, isLoading: false }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload, activeIndex: -1 }
    case "SET_ACTIVE_INDEX":
      return { ...state, activeIndex: action.payload }
    case "MOVE_DOWN": {
      const max = action.payload
      if (max === 0) return state
      return {
        ...state,
        activeIndex: state.activeIndex < max - 1 ? state.activeIndex + 1 : 0,
      }
    }
    case "MOVE_UP": {
      const max = action.payload
      if (max === 0) return state
      return {
        ...state,
        activeIndex: state.activeIndex > 0 ? state.activeIndex - 1 : max - 1,
      }
    }
    default:
      return state
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSearchState(): [SearchState, Dispatch<SearchAction>] {
  return useReducer(searchReducer, INITIAL_STATE)
}

// Re-export for tests
export { searchReducer, INITIAL_STATE }
