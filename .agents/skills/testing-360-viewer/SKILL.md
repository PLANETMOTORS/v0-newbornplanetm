# Testing the 360° Vehicle Spin Viewer

## Overview
The 360° viewer renders vehicle frames as absolutely-positioned images over a canvas overlay (floor, shadow, reflection). The core alignment challenge is making tires appear grounded on the showroom floor across all rotation frames.

## Prerequisites
- Netlify deploy preview URL from PR (format: `deploy-preview-{N}--planetnewborn-v0-newbornplanetm.netlify.app`)
- A vehicle with 360° frames in Supabase storage (Jeep Wrangler `caa5eb3d` is the primary test vehicle)

## Key Architecture
- **Car image**: Absolutely positioned with computed `top/left/width/height` in pixels
- **Canvas overlay**: Renders floor gradient, shadow ellipse, and reflection behind the car
- **Per-frame tire detection**: Scans alpha channel during preload to find actual tire bottom per frame
- **Body-type profiles**: Sedan/SUV/Truck/Oversized each have different anchor constants
- **Config**: `config/overlay/current.json` controls floor colors, shadow parameters

## Test Assertions

### 1. Tire-Floor Contact (PRIMARY)
```javascript
// Run in browser console on the VDP page
const img = document.querySelector('img[src*="supabase"]');
const container = img.closest('[aria-label*="360"]');
const containerH = container.getBoundingClientRect().height;
const imgTop = parseFloat(img.style.top);
const imgH = parseFloat(img.style.height);
const computedTireY = (0.87 * containerH - imgTop) / imgH;
const delta = Math.abs((imgTop + computedTireY * imgH) - (0.87 * containerH));
console.log('Delta:', delta, 'px'); // Should be < 2px
console.log('maxWidth:', img.style.maxWidth); // Must be "none"
console.log('position:', img.style.position); // Must be "absolute"
```

### 2. Floor Color Verification
```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const px = ctx.getImageData(Math.round(canvas.width * 0.5), Math.round(canvas.height * 0.85), 1, 1).data;
console.log('Floor RGB:', px[0], px[1], px[2]); // All should be < 170 (dark gray)
// If R > 200 → stale Netlify cache serving old light-gray config
```

### 3. Rotation Stability
```javascript
// Start auto-spin first, then run this
const log = [];
const interval = setInterval(() => {
  const img = document.querySelector('img[src*="supabase"]');
  if (img) log.push(parseInt(img.style.top));
}, 300);
// After ~15 seconds:
clearInterval(interval);
const range = Math.max(...log) - Math.min(...log);
console.log('Range:', range, 'px'); // Should be < 30px
```

### 4. Fullscreen Mode
- Click fullscreen button → measure delta (should be 0px)
- Press Escape → verify dimensions return to pre-fullscreen values

## Common Failure Modes

### Stale Netlify Build Cache
- **Symptom**: Floor shows light gray (#D3D7D9) instead of dark gray (#5E6064)
- **Cause**: Netlify serves old JS bundle even after new commits
- **Fix**: Push a new commit to trigger fresh build, or clear Netlify build cache
- **Verification**: Sample canvas pixel colors via console

### Tailwind CSS Capping Image Width
- **Symptom**: Car image capped at container width (e.g., 821px instead of 1027px)
- **Cause**: Tailwind preflight sets `img { max-width: 100% }`
- **Fix**: Inline `maxWidth: "none"` on the car image style
- **Check**: `img.style.maxWidth` must be `"none"`

### Per-Frame Tire Detection Not Triggering
- **Symptom**: Car uses fallback TIRE_CONTACT_Y (0.80) instead of detected values
- **Cause**: Ref writes don't trigger re-renders; need state signal
- **Fix**: `tireDataVersion` state counter that increments on each detection
- **Check**: `computedTireY` should differ from 0.80 if detection is working

### CSS Transform Clipping
- **Symptom**: Tires clipped at container bottom edge
- **Cause**: `scale()` + `overflow-hidden` clips the scaled image
- **Fix**: Use absolute pixel positioning instead of CSS transforms
- **Check**: No `transform` property on the car image

### Auto-Calibration Worsening Alignment
- **Symptom**: Base alignment is correct (0px delta) but drifts after resize/recalc
- **Cause**: Wheel anchor X positions fall outside shadow ellipse span; fallback returns wrong Y
- **Fix**: Out-of-range fallback should return `cy - ry` (floor apex), not `cy` (shadow center)

## Devin Secrets Needed
- No secrets required for testing — Netlify preview is public
- Supabase storage URLs are public for vehicle frames

## Tips
- Always check CI status before testing — lint-and-build must be green
- The viewer only appears on vehicle detail pages (VDP), not the inventory list
- Press D key on the viewer for debug overlay (shows active profile, tire Y values)
- Frame count is typically 37 for Drivee-sourced vehicles
- The canvas size matches the container (e.g., 821×615), but the car image is 1.25× larger
