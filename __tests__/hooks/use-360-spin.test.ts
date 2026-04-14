/**
 * Tests for the frame-calculation and auto-play logic used by use360Spin.
 *
 * The hook uses React state/effects that require a DOM environment, so we
 * isolate and verify the pure algorithms directly. All formulas are taken
 * verbatim from hooks/use-360-spin.ts.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Pure helpers — mirrors the logic inside use360Spin
// ---------------------------------------------------------------------------

/**
 * Calculates the new frame index after a pointer drag.
 * Replicates:
 *   let newFrame = (dragStartFrame + Math.floor((clientX - dragStartX) / sensitivity)) % totalFrames
 *   setCurrentFrame(newFrame < 0 ? newFrame + totalFrames : newFrame)
 */
function calcDragFrame(
  dragStartFrame: number,
  deltaX: number,
  sensitivity: number,
  totalFrames: number,
): number {
  let newFrame =
    (dragStartFrame + Math.floor(deltaX / sensitivity)) % totalFrames
  return newFrame < 0 ? newFrame + totalFrames : newFrame
}

/**
 * Calculates the next frame index during auto-play.
 * Replicates:
 *   setCurrentFrame(prev => (prev + 1 >= totalFrames ? (loop ? 0 : prev) : prev + 1))
 */
function calcAutoPlayNext(
  currentFrame: number,
  totalFrames: number,
  loop: boolean,
): number {
  return currentFrame + 1 >= totalFrames
    ? loop
      ? 0
      : currentFrame
    : currentFrame + 1
}

// ---------------------------------------------------------------------------
// Drag frame calculation tests
// ---------------------------------------------------------------------------

describe('calcDragFrame — forward drag', () => {
  it('advances by one frame per unit of sensitivity moved', () => {
    // sensitivity=5, moved 5px → +1 frame
    expect(calcDragFrame(0, 5, 5, 36)).toBe(1)
    expect(calcDragFrame(0, 10, 5, 36)).toBe(2)
    expect(calcDragFrame(0, 50, 5, 36)).toBe(10)
  })

  it('floors fractional frame advances', () => {
    // 7px / sensitivity=5 → floor(1.4) = 1 frame
    expect(calcDragFrame(0, 7, 5, 36)).toBe(1)
    // 4px / sensitivity=5 → floor(0.8) = 0 frames
    expect(calcDragFrame(3, 4, 5, 36)).toBe(3)
  })

  it('wraps forward past the last frame', () => {
    // 36 frames; start at frame 35, move enough for +1 → wraps to 0
    expect(calcDragFrame(35, 5, 5, 36)).toBe(0)
    // start at frame 34, move enough for +3 → 37 % 36 = 1
    expect(calcDragFrame(34, 15, 5, 36)).toBe(1)
  })

  it('wraps forward past multiple rotations', () => {
    // 180px / sensitivity=5 = 36 frames advance → same frame (full rotation)
    expect(calcDragFrame(0, 180, 5, 36)).toBe(0)
    // 185px / 5 = 37 frames → 37 % 36 = 1
    expect(calcDragFrame(0, 185, 5, 36)).toBe(1)
  })
})

describe('calcDragFrame — reverse drag (negative deltaX)', () => {
  it('wraps backward past frame 0', () => {
    // Start at frame 0, move -5px (sensitivity=5) → -1 frame → 36 + (-1) = 35
    expect(calcDragFrame(0, -5, 5, 36)).toBe(35)
  })

  it('wraps backward across multiple frames', () => {
    // Start at frame 2, move -15px → 2 + floor(-3) = -1 → 36 + (-1) = 35
    expect(calcDragFrame(2, -15, 5, 36)).toBe(35)
    // Start at frame 2, move -20px → 2 + (-4) = -2 → 36 + (-2) = 34
    expect(calcDragFrame(2, -20, 5, 36)).toBe(34)
  })

  it('handles a large negative delta wrapping multiple times', () => {
    // Start at 0, move -180px / 5 = -36 → 0 + (-36) % 36 = 0
    expect(calcDragFrame(0, -180, 5, 36)).toBe(0)
  })
})

describe('calcDragFrame — sensitivity variants', () => {
  it('higher sensitivity requires more movement per frame', () => {
    // sensitivity=10: need 10px per frame
    expect(calcDragFrame(0, 9, 10, 36)).toBe(0)
    expect(calcDragFrame(0, 10, 10, 36)).toBe(1)
  })

  it('sensitivity=1 gives maximum responsiveness', () => {
    expect(calcDragFrame(0, 3, 1, 36)).toBe(3)
  })
})

describe('calcDragFrame — edge cases', () => {
  it('zero deltaX keeps the current frame', () => {
    expect(calcDragFrame(7, 0, 5, 36)).toBe(7)
  })

  it('works with totalFrames of 1 (degenerate)', () => {
    // Only one frame — any delta wraps to frame 0
    expect(calcDragFrame(0, 100, 5, 1)).toBe(0)
  })

  it('works with a large number of frames', () => {
    const totalFrames = 360
    expect(calcDragFrame(0, 360, 1, totalFrames)).toBe(0)
    expect(calcDragFrame(0, 361, 1, totalFrames)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Auto-play next frame tests
// ---------------------------------------------------------------------------

describe('calcAutoPlayNext — loop enabled', () => {
  it('advances by one frame per tick', () => {
    expect(calcAutoPlayNext(0, 36, true)).toBe(1)
    expect(calcAutoPlayNext(17, 36, true)).toBe(18)
  })

  it('wraps from the last frame back to frame 0', () => {
    expect(calcAutoPlayNext(35, 36, true)).toBe(0)
  })

  it('wraps back from last frame of a 2-frame sequence', () => {
    expect(calcAutoPlayNext(1, 2, true)).toBe(0)
  })
})

describe('calcAutoPlayNext — loop disabled', () => {
  it('advances normally before the last frame', () => {
    expect(calcAutoPlayNext(0, 36, false)).toBe(1)
    expect(calcAutoPlayNext(34, 36, false)).toBe(35)
  })

  it('stays on the last frame instead of wrapping', () => {
    expect(calcAutoPlayNext(35, 36, false)).toBe(35)
  })
})

describe('calcAutoPlayNext — edge cases', () => {
  it('single frame always stays at 0 (no loop)', () => {
    expect(calcAutoPlayNext(0, 1, false)).toBe(0)
  })

  it('single frame always returns 0 (with loop)', () => {
    expect(calcAutoPlayNext(0, 1, true)).toBe(0)
  })
})