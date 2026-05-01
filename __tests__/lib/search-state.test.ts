import { describe, it, expect } from "vitest"
import {
  searchReducer,
  INITIAL_STATE,
  type SearchState,
  type SearchAction,
} from "@/lib/hooks/use-search-state"

function apply(actions: SearchAction[], state: SearchState = INITIAL_STATE): SearchState {
  return actions.reduce(searchReducer, state)
}

describe("searchReducer", () => {
  it("returns initial state for unknown action", () => {
    const result = searchReducer(INITIAL_STATE, { type: "UNKNOWN" } as unknown as SearchAction)
    expect(result).toBe(INITIAL_STATE)
  })

  it("OPEN sets isOpen true and resets activeIndex", () => {
    const state = apply([{ type: "SET_ACTIVE_INDEX", payload: 3 }, { type: "OPEN" }])
    expect(state.isOpen).toBe(true)
    expect(state.activeIndex).toBe(-1)
  })

  it("CLOSE resets all transient state", () => {
    const opened = apply([
      { type: "OPEN" },
      { type: "SET_QUERY", payload: "tesla" },
      { type: "SET_GROUPS", payload: [{ heading: "Makes", items: [] }] },
      { type: "SET_LOADING", payload: true },
      { type: "SET_ACTIVE_INDEX", payload: 2 },
    ])
    const closed = searchReducer(opened, { type: "CLOSE" })
    expect(closed.isOpen).toBe(false)
    expect(closed.query).toBe("")
    expect(closed.groups).toEqual([])
    expect(closed.isLoading).toBe(false)
    expect(closed.activeIndex).toBe(-1)
    // popular should be preserved across close
    expect(closed.popular).toEqual(opened.popular)
  })

  it("SET_QUERY updates query and resets activeIndex", () => {
    const state = apply([
      { type: "SET_ACTIVE_INDEX", payload: 2 },
      { type: "SET_QUERY", payload: "bm" },
    ])
    expect(state.query).toBe("bm")
    expect(state.activeIndex).toBe(-1)
  })

  it("SET_POPULAR stores popular data", () => {
    const popular = [
      { label: "SUVs", type: "body_style" as const, count: 5, href: "/", score: 0.8 },
    ]
    const state = apply([{ type: "SET_POPULAR", payload: popular }])
    expect(state.popular).toBe(popular)
  })

  it("SET_GROUPS stores groups and clears loading", () => {
    const groups = [{ heading: "Makes", items: [{ label: "Tesla", href: "/" }] }]
    const state = apply([
      { type: "SET_LOADING", payload: true },
      { type: "SET_GROUPS", payload: groups },
    ])
    expect(state.groups).toBe(groups)
    expect(state.isLoading).toBe(false)
  })

  it("SET_LOADING sets isLoading and resets activeIndex", () => {
    const state = apply([
      { type: "SET_ACTIVE_INDEX", payload: 1 },
      { type: "SET_LOADING", payload: true },
    ])
    expect(state.isLoading).toBe(true)
    expect(state.activeIndex).toBe(-1)
  })

  it("MOVE_DOWN cycles through items", () => {
    let state = apply([{ type: "MOVE_DOWN", payload: 3 }])
    expect(state.activeIndex).toBe(0)
    state = searchReducer(state, { type: "MOVE_DOWN", payload: 3 })
    expect(state.activeIndex).toBe(1)
    state = searchReducer(state, { type: "MOVE_DOWN", payload: 3 })
    expect(state.activeIndex).toBe(2)
    state = searchReducer(state, { type: "MOVE_DOWN", payload: 3 })
    expect(state.activeIndex).toBe(0) // wraps
  })

  it("MOVE_DOWN with 0 items is a no-op", () => {
    const state = apply([{ type: "MOVE_DOWN", payload: 0 }])
    expect(state.activeIndex).toBe(-1)
  })

  it("MOVE_UP cycles through items backwards", () => {
    let state = apply([{ type: "MOVE_UP", payload: 3 }])
    expect(state.activeIndex).toBe(2) // wraps from -1 to last
    state = searchReducer(state, { type: "MOVE_UP", payload: 3 })
    expect(state.activeIndex).toBe(1)
    state = searchReducer(state, { type: "MOVE_UP", payload: 3 })
    expect(state.activeIndex).toBe(0)
    state = searchReducer(state, { type: "MOVE_UP", payload: 3 })
    expect(state.activeIndex).toBe(2) // wraps
  })

  it("MOVE_UP with 0 items is a no-op", () => {
    const state = apply([{ type: "MOVE_UP", payload: 0 }])
    expect(state.activeIndex).toBe(-1)
  })
})
