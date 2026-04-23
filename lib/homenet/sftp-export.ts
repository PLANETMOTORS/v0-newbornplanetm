import SftpClient from "ssh2-sftp-client"

/**
 * HomeNet Outbound Image Export
 *
 * Pushes processed 360° images from Supabase Storage to HomeNet's FTP server
 * (iol.homenetinc.com) for syndication to AutoTrader, CarGurus, Kijiji, etc.
 *
 * This replicates the Glo3D → HomeNet pattern:
 * - Images only, no VDP data alterations
 * - CSV manifest file accompanies the images
 * - Uses the same credentials: hndatafeed @ iol.homenetinc.com
 */

export interface ExportConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface ExportResult {
  success: boolean
  imagesUploaded: number
  csvUploaded: boolean
  errors: string[]
  duration_ms: number
}

interface ImageEntry {
  vin: string
  stockNumber: string
  imageUrl: string
  imageIndex: number
  is360: boolean
}

function getExportConfig(): ExportConfig {
  const host = process.env.HOMENET_EXPORT_FTP_HOST || "iol.homenetinc.com"
  const port = parseInt(process.env.HOMENET_EXPORT_FTP_PORT || "22", 10)
  const username = process.env.HOMENET_EXPORT_FTP_USER || "hndatafeed"
  const password = process.env.HOMENET_EXPORT_FTP_PASS || ""

  if (!password) {
    throw new Error(
      "Missing HOMENET_EXPORT_FTP_PASS. Set this env var with the FTP password for iol.homenetinc.com"
    )
  }

  return { host, port, username, password }
}

/**
 * Build a CSV manifest for HomeNet image import.
 * Format matches HomeNet's expected image feed structure.
 * Only images are updated — no VDP data alterations (per HomeNet integration rules).
 */
function buildImageCSV(entries: ImageEntry[]): string {
  const header = "VIN,StockNumber,ImageURL,ImageSequence,ImageType"
  const rows = entries.map(e =>
    `"${e.vin}","${e.stockNumber}","${e.imageUrl}",${e.imageIndex},"${e.is360 ? "360" : "Photo"}"`
  )
  return [header, ...rows].join("\n")
}

/**
 * Export vehicle images to HomeNet's FTP server.
 *
 * @param images - Array of image entries to export
 * @param csvFilename - Name for the CSV manifest file (default: glo_282961.csv per existing convention)
 */
export async function exportImagesToHomeNet(
  images: ImageEntry[],
  csvFilename: string = "planetmotors_export.csv"
): Promise<ExportResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let imagesUploaded = 0
  let csvUploaded = false

  if (images.length === 0) {
    return {
      success: true,
      imagesUploaded: 0,
      csvUploaded: false,
      errors: [],
      duration_ms: Date.now() - startTime,
    }
  }

  const config = getExportConfig()
  const sftp = new SftpClient()

  try {
    console.info(`[HomeNet Export] Connecting to ${config.host}:${config.port}`)
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      readyTimeout: 15_000,
      algorithms: {
        serverHostKey: ["ssh-rsa", "ssh-ed25519", "ecdsa-sha2-nistp256"],
      },
    })

    console.info(`[HomeNet Export] Connected. Uploading CSV manifest: ${csvFilename}`)

    // Upload CSV manifest
    const csvContent = buildImageCSV(images)
    const csvBuffer = Buffer.from(csvContent, "utf-8")
    await sftp.put(csvBuffer, `/${csvFilename}`)
    csvUploaded = true
    console.info(`[HomeNet Export] CSV manifest uploaded (${images.length} entries)`)

    // Download each image from URL and upload to HomeNet FTP
    for (const entry of images) {
      try {
        const response = await fetch(entry.imageUrl)
        if (!response.ok) {
          errors.push(`Failed to download ${entry.imageUrl}: HTTP ${response.status}`)
          continue
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Naming convention: VIN_sequenceNumber.ext
        const ext = entry.imageUrl.split(".").pop()?.split("?")[0] || "jpg"
        const remoteName = `/${entry.vin}_${String(entry.imageIndex).padStart(3, "0")}.${ext}`

        await sftp.put(buffer, remoteName)
        imagesUploaded++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Error uploading image for ${entry.vin}#${entry.imageIndex}: ${message}`)
      }
    }

    console.info(`[HomeNet Export] Done. ${imagesUploaded}/${images.length} images uploaded, ${errors.length} errors`)

    return {
      success: errors.length === 0,
      imagesUploaded,
      csvUploaded,
      errors,
      duration_ms: Date.now() - startTime,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[HomeNet Export] Connection error: ${message}`)
    return {
      success: false,
      imagesUploaded,
      csvUploaded,
      errors: [...errors, `Connection error: ${message}`],
      duration_ms: Date.now() - startTime,
    }
  } finally {
    try {
      await sftp.end()
    } catch {
      // Ignore close errors
    }
  }
}
