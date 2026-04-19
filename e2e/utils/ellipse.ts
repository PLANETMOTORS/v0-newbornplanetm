/**
 * Ellipse math utilities for tire-shadow alignment E2E tests.
 */

/**
 * y on ellipse boundary at x (lower half — floor contact zone):
 * ((x-cx)^2/rx^2) + ((y-cy)^2/ry^2) = 1
 */
export function ellipseYAtXLower(
  x: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number {
  const dx = x - cx
  const inside = 1 - (dx * dx) / (rx * rx)
  if (inside <= 0) return cy
  return cy + Math.sqrt(inside) * ry
}

export function centerOfRect(r: {
  x: number
  y: number
  width: number
  height: number
}) {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}
