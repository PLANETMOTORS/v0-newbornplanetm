import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Percy Visual Regression Tests', () => {
  test('Homepage - Desktop', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Homepage - Desktop')
  })

  test('Homepage - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Homepage - Mobile')
  })

  test('Inventory Page', async ({ page }) => {
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Inventory Page')
  })

  test('Login Page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Login Page')
  })

  test('Signup Page', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Signup Page')
  })
})
