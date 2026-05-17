import { test, expect } from '@playwright/test'
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './global-setup'

test('unauthenticated visit to / redirects to /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('valid login redirects to dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
  await expect(page.locator('nav')).toContainText('Compliance Tracker')
})

test('invalid login shows inline error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', 'wrong-password')
  await page.click('button[type="submit"]')
  await expect(page.locator('p[role="alert"]')).toContainText('Invalid email or password')
  await expect(page).toHaveURL(/\/login/)
})

test('logout returns to /login and session is cleared', async ({ page }) => {
  // Log in first
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')

  // Log out
  await page.click('button:has-text("Log out")')
  await expect(page).toHaveURL(/\/login/)

  // Confirm session is gone — navigating to / redirects again
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})
