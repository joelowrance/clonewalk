import { test, expect } from '@playwright/test'
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './global-setup'

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('h1')).toContainText('Sign in')
})

test('unknown route returns a 404 page for authenticated users', async ({ page }) => {
  // Log in so middleware lets the request through to Next.js route resolution
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')

  const response = await page.goto('/nonexistent-route-xyz')
  expect(response?.status()).toBe(404)
})
