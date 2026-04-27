const LICENSE_PATH_PATTERN = /^[a-zA-Z0-9_-]+\/\d+_license\.(jpg|png|webp|pdf)$/

export function isValidLicensePath(path: string, vehicleId: string): boolean {
  if (!LICENSE_PATH_PATTERN.test(path)) return false
  const sanitizedVehicleId = vehicleId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return path.startsWith(`${sanitizedVehicleId}/`)
}
