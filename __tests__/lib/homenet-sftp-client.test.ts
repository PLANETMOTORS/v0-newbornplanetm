import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = [
  "HOMENET_SFTP_HOST",
  "HOMENET_SFTP_USER",
  "HOMENET_SFTP_USERNAME",
  "HOMENET_SFTP_PASS",
  "HOMENET_SFTP_PASSWORD",
  "HOMENET_SFTP_PORT",
] as const

const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

interface SftpFileEntry {
  type: "-" | "d"
  name: string
  size: number
  modifyTime: number
}

const sftpInstance = {
  connect: vi.fn(async () => undefined),
  list: vi.fn(async (_dir: string): Promise<SftpFileEntry[]> => []),
  get: vi.fn(async (_path: string) => Buffer.from("")),
  end: vi.fn(async () => undefined),
}

vi.mock("ssh2-sftp-client", () => {
  function FakeSftpClient(this: typeof sftpInstance) {
    Object.assign(this, sftpInstance)
  }
  return { default: FakeSftpClient }
})

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  process.env.HOMENET_SFTP_HOST = "sftp.homenet.test"
  process.env.HOMENET_SFTP_USER = "feeder"
  process.env.HOMENET_SFTP_PASS = "secret"
  vi.clearAllMocks()
  // Silence info logs
  vi.spyOn(console, "info").mockImplementation(() => undefined)
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

describe("lib/homenet/sftp-client downloadLatestCSV — credential validation", () => {
  it("throws when HOMENET_SFTP_HOST is missing", async () => {
    delete process.env.HOMENET_SFTP_HOST
    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await expect(downloadLatestCSV()).rejects.toThrow(/Missing SFTP credentials/)
  })

  it("throws when neither USER nor USERNAME is set", async () => {
    delete process.env.HOMENET_SFTP_USER
    delete process.env.HOMENET_SFTP_USERNAME
    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await expect(downloadLatestCSV()).rejects.toThrow(/Missing SFTP credentials/)
  })

  it("throws when neither PASS nor PASSWORD is set", async () => {
    delete process.env.HOMENET_SFTP_PASS
    delete process.env.HOMENET_SFTP_PASSWORD
    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await expect(downloadLatestCSV()).rejects.toThrow(/Missing SFTP credentials/)
  })

  it("accepts USERNAME/PASSWORD as fallback credential names", async () => {
    delete process.env.HOMENET_SFTP_USER
    delete process.env.HOMENET_SFTP_PASS
    process.env.HOMENET_SFTP_USERNAME = "alt-user"
    process.env.HOMENET_SFTP_PASSWORD = "alt-pass"
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "feed.csv", size: 4, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("data"))

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    const out = await downloadLatestCSV()
    expect(out.filename).toBe("feed.csv")
    expect(sftpInstance.connect).toHaveBeenCalledWith(
      expect.objectContaining({ username: "alt-user", password: "alt-pass" }),
    )
  })

  it("uses default port 22 when HOMENET_SFTP_PORT is unset", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "f.csv", size: 1, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("x"))
    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await downloadLatestCSV()
    expect(sftpInstance.connect).toHaveBeenCalledWith(
      expect.objectContaining({ port: 22 }),
    )
  })

  it("respects an explicit HOMENET_SFTP_PORT", async () => {
    process.env.HOMENET_SFTP_PORT = "2222"
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "f.csv", size: 1, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("x"))
    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await downloadLatestCSV()
    expect(sftpInstance.connect).toHaveBeenCalledWith(
      expect.objectContaining({ port: 2222 }),
    )
  })
})

describe("lib/homenet/sftp-client downloadLatestCSV — file selection & download", () => {
  it("filters listing to .csv regular files and picks the most recently modified", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "d", name: "subdir", size: 0, modifyTime: 100 },
      { type: "-", name: "old.csv", size: 10, modifyTime: 1 },
      { type: "-", name: "newest.csv", size: 20, modifyTime: 999 },
      { type: "-", name: "image.jpg", size: 5, modifyTime: 100 },
      { type: "-", name: "MID.CSV", size: 15, modifyTime: 500 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("hello,world", "utf-8"))

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    const out = await downloadLatestCSV("/feeds")

    expect(out.filename).toBe("newest.csv")
    expect(out.content).toBe("hello,world")
    expect(out.filesFound).toEqual(["newest.csv", "MID.CSV", "old.csv"])
  })

  it("matches case-insensitively on the .csv suffix", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "INVENTORY.CSV", size: 4, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("data"))

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    const out = await downloadLatestCSV()
    expect(out.filename).toBe("INVENTORY.CSV")
  })

  it("throws when no CSV files are found in the directory", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "image.jpg", size: 5, modifyTime: 100 },
    ])

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await expect(downloadLatestCSV("/feeds")).rejects.toThrow(/No CSV files found/)
    expect(sftpInstance.end).toHaveBeenCalled()
  })

  it("appends a slash when feedDir does NOT end with /", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "f.csv", size: 1, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("x"))

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await downloadLatestCSV("/feeds")
    expect(sftpInstance.get).toHaveBeenCalledWith("/feeds/f.csv")
  })

  it("does NOT double-slash when feedDir already ends with /", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "f.csv", size: 1, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("x"))

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await downloadLatestCSV("/feeds/")
    expect(sftpInstance.get).toHaveBeenCalledWith("/feeds/f.csv")
  })

  it("always closes the SFTP connection (even when downstream throws)", async () => {
    sftpInstance.list.mockRejectedValueOnce(new Error("network down"))
    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    await expect(downloadLatestCSV("/feeds")).rejects.toThrow("network down")
    expect(sftpInstance.end).toHaveBeenCalled()
  })

  it("swallows errors thrown by sftp.end() in the finally block", async () => {
    sftpInstance.list.mockResolvedValueOnce([
      { type: "-", name: "f.csv", size: 1, modifyTime: 1 },
    ])
    sftpInstance.get.mockResolvedValueOnce(Buffer.from("x"))
    sftpInstance.end.mockRejectedValueOnce(new Error("close failed"))

    const { downloadLatestCSV } = await import("@/lib/homenet/sftp-client")
    const out = await downloadLatestCSV("/feeds/")
    expect(out.filename).toBe("f.csv")
  })
})
