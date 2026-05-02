// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeleteRowButton } from "@/components/admin/delete-row-button"

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)
  vi.stubGlobal("confirm", vi.fn(() => true))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderButton(extraProps: Partial<React.ComponentProps<typeof DeleteRowButton>> = {}) {
  const onDeleted = vi.fn()
  const utils = render(
    <DeleteRowButton
      endpoint="/api/v1/admin/leads/abc"
      id="abc"
      label="lead from Alice"
      onDeleted={onDeleted}
      {...extraProps}
    />,
  )
  return { onDeleted, ...utils }
}

describe("DeleteRowButton", () => {
  it("renders an aria-labelled trash button", () => {
    renderButton()
    expect(screen.getByRole("button", { name: /delete lead from alice/i })).toBeTruthy()
  })

  it("calls fetch DELETE and onDeleted on success", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ deletedId: "abc" }),
    })
    const { onDeleted } = renderButton()
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("abc"))
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/leads/abc", {
      method: "DELETE",
    })
  })

  it("does not call fetch when confirm returns false", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false))
    const { onDeleted } = renderButton()
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it("skips confirmation when skipConfirm=true", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ deletedId: "abc" }),
    })
    const confirmSpy = vi.fn(() => true)
    vi.stubGlobal("confirm", confirmSpy)
    const { onDeleted } = renderButton({ skipConfirm: true })
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it("shows the structured error message on failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "RLS denied" } }),
    })
    const { onDeleted } = renderButton()
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    await waitFor(() => expect(screen.getByText(/rls denied/i)).toBeTruthy())
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it("shows the string error message on failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    })
    renderButton()
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    await waitFor(() => expect(screen.getByText(/unauthorized/i)).toBeTruthy())
  })

  it("falls back to a status-coded message when error body is empty", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    })
    renderButton()
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    await waitFor(() =>
      expect(screen.getByText(/delete failed.*503/i)).toBeTruthy(),
    )
  })

  it("disables the button while the request is pending", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    renderButton()
    const btn = screen.getByRole("button", { name: /delete lead/i }) as HTMLButtonElement
    fireEvent.click(btn)
    await waitFor(() => expect(btn.disabled).toBe(true))
    resolveFetch?.({
      ok: true,
      status: 200,
      json: async () => ({ deletedId: "abc" }),
    })
  })

  it("respects the disabled prop", () => {
    renderButton({ disabled: true })
    const btn = screen.getByRole("button", { name: /delete lead/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("stops parent click bubbling so the row's outer click doesn't fire", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ deletedId: "abc" }),
    })
    const onParentClick = vi.fn()
    const { container } = render(
      <div role="button" tabIndex={0} onClick={onParentClick} aria-label="row">
        <DeleteRowButton
          endpoint="/api/v1/admin/leads/abc"
          id="abc"
          onDeleted={() => {}}
        />
      </div>,
    )
    const deleteBtn = container.querySelector("[aria-label='Delete row']") as HTMLButtonElement
    fireEvent.click(deleteBtn)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it("treats a JSON parse failure on the error body as a generic message", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("body parse")
      },
    })
    renderButton()
    fireEvent.click(screen.getByRole("button", { name: /delete lead/i }))
    await waitFor(() =>
      expect(screen.getByText(/delete failed.*502/i)).toBeTruthy(),
    )
  })
})
