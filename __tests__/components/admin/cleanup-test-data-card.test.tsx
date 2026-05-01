// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CleanupTestDataCard } from "@/components/admin/cleanup-test-data-card"

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)
  vi.stubGlobal("confirm", vi.fn(() => true))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function dryRunResponse(summary: Record<string, number>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      ok: true,
      mode: "test-pattern",
      dryRun: true,
      matches: {},
      summary,
    }),
  }
}

function destructiveResponse(deleted: Record<string, number>, errors?: string[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      ok: errors === undefined,
      mode: "test-pattern",
      dryRun: false,
      deleted,
      ...(errors ? { errors } : {}),
    }),
  }
}

describe("CleanupTestDataCard", () => {
  it("renders the title and preview button initially", () => {
    render(<CleanupTestDataCard />)
    expect(screen.getByText(/cleanup test data/i)).toBeTruthy()
    expect(screen.getByRole("button", { name: /preview rows/i })).toBeTruthy()
  })

  it("shows preview counts after clicking preview", async () => {
    fetchMock.mockResolvedValueOnce(
      dryRunResponse({ leads: 5, reservations: 2, trade_in_quotes: 1 }),
    )
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    await waitFor(() =>
      expect(screen.getByText(/dry-run/i)).toBeTruthy(),
    )
    expect(screen.getByText("8")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: /delete 8 rows/i }),
    ).toBeTruthy()
  })

  it("disables delete button when no rows match", async () => {
    fetchMock.mockResolvedValueOnce(
      dryRunResponse({ leads: 0, reservations: 0, trade_in_quotes: 0 }),
    )
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    const btn = (await screen.findByRole("button", {
      name: /delete 0 rows/i,
    })) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("returns to idle when cancel is clicked", async () => {
    fetchMock.mockResolvedValueOnce(
      dryRunResponse({ leads: 1, reservations: 0, trade_in_quotes: 0 }),
    )
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    await screen.findByRole("button", { name: /delete 1 rows/i })
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }))
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /preview rows/i }),
      ).toBeTruthy(),
    )
  })

  it("executes the delete and shows the result count", async () => {
    fetchMock.mockResolvedValueOnce(
      dryRunResponse({ leads: 3, reservations: 1, trade_in_quotes: 0 }),
    )
    fetchMock.mockResolvedValueOnce(
      destructiveResponse({ leads: 3, reservations: 1, trade_in_quotes: 0 }),
    )
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    fireEvent.click(await screen.findByRole("button", { name: /delete 4 rows/i }))
    await waitFor(() =>
      expect(screen.getByText(/deleted/i)).toBeTruthy(),
    )
    expect(screen.getByRole("button", { name: /done/i })).toBeTruthy()
  })

  it("renders a structured error from the API", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "RLS denied" } }),
    })
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    await waitFor(() =>
      expect(screen.getByText(/rls denied/i)).toBeTruthy(),
    )
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy()
  })

  it("renders a string error from the API", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    })
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    await waitFor(() =>
      expect(screen.getByText(/unauthorized/i)).toBeTruthy(),
    )
  })

  it("renders a generic message when error body is unparseable", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => {
        throw new Error("body parse")
      },
    })
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    await waitFor(() =>
      expect(screen.getByText(/cleanup failed.*503/i)).toBeTruthy(),
    )
  })

  it("recovers after error via Try again", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    })
    render(<CleanupTestDataCard />)
    fireEvent.click(screen.getByRole("button", { name: /preview rows/i }))
    fireEvent.click(await screen.findByRole("button", { name: /try again/i }))
    expect(
      screen.getByRole("button", { name: /preview rows/i }),
    ).toBeTruthy()
  })
})
