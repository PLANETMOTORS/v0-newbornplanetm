import SftpClient from "ssh2-sftp-client"

export interface SftpConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface DownloadResult {
  filename: string
  content: string
  filesFound: string[]
}

function getSftpConfig(): SftpConfig {
  const host = process.env.HOMENET_SFTP_HOST
  // Accept both naming conventions: USER/PASS and USERNAME/PASSWORD
  const user = process.env.HOMENET_SFTP_USER || process.env.HOMENET_SFTP_USERNAME
  const pass = process.env.HOMENET_SFTP_PASS || process.env.HOMENET_SFTP_PASSWORD
  const port = parseInt(process.env.HOMENET_SFTP_PORT || "22", 10)

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SFTP credentials. Set HOMENET_SFTP_HOST, HOMENET_SFTP_USER(NAME), and HOMENET_SFTP_PASS(WORD). " +
      `Found: host=${!!host}, user=${!!user}, pass=${!!pass}`
    )
  }

  return { host, port, username: user, password: pass }
}

/**
 * Connect to HomenetIOL SFTP, find the latest CSV in the feed directory,
 * and return its content as a string (in-memory, no disk writes).
 */
export async function downloadLatestCSV(
  feedDir: string = "/"
): Promise<DownloadResult> {
  const config = getSftpConfig()
  const sftp = new SftpClient()

  try {
    console.log(`[HomenetIOL SFTP] Connecting to ${config.host}:${config.port}`)
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      readyTimeout: 15_000,
      // Accept any host key — HomenetIOL's key may not be in known_hosts
      algorithms: {
        serverHostKey: ["ssh-rsa", "ssh-ed25519", "ecdsa-sha2-nistp256"],
      },
    })

    console.log(`[HomenetIOL SFTP] Connected. Listing files in ${feedDir}`)
    const listing = await sftp.list(feedDir)

    // Filter to CSV files only
    const csvFiles = listing
      .filter((f) => f.type === "-" && f.name.toLowerCase().endsWith(".csv"))
      .sort((a, b) => b.modifyTime - a.modifyTime)

    const allFilenames = csvFiles.map((f) => f.name)
    console.log(`[HomenetIOL SFTP] Found ${csvFiles.length} CSV files: ${allFilenames.join(", ")}`)

    if (csvFiles.length === 0) {
      throw new Error(`No CSV files found in SFTP directory: ${feedDir}`)
    }

    // Download the most recently modified CSV
    const latestFile = csvFiles[0]
    const remotePath = feedDir.endsWith("/")
      ? `${feedDir}${latestFile.name}`
      : `${feedDir}/${latestFile.name}`

    console.log(`[HomenetIOL SFTP] Downloading ${latestFile.name} (${latestFile.size} bytes)`)

    // Download to a Buffer (in-memory, no disk writes for serverless)
    const buffer = (await sftp.get(remotePath)) as Buffer
    const content = buffer.toString("utf-8")

    console.log(`[HomenetIOL SFTP] Downloaded ${content.length} characters`)

    return {
      filename: latestFile.name,
      content,
      filesFound: allFilenames,
    }
  } finally {
    try {
      await sftp.end()
    } catch {
      // Ignore close errors
    }
  }
}
