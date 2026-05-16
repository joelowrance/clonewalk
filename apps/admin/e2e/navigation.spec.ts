import { test, expect } from '@playwright/test'

test('home page renders Compliance Tracker in the nav', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('nav')).toContainText('Compliance Tracker')
})

test('unknown route returns a 404 page', async ({ page }) => {
  const response = await page.goto('/nonexistent-route-xyz')
  expect(response?.status()).toBe(404)
})
