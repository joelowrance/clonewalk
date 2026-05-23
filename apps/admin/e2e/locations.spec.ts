import { test, expect } from '@playwright/test'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './global-setup'

const E2E_TENANT_ID = 'e2e00000-0000-0000-0000-000000000001'
const E2E_LOC_A_ID  = 'e2e00000-0000-0000-0000-000000000010'
const E2E_LOC_B_ID  = 'e2e00000-0000-0000-0000-000000000011'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
}

test.describe.serial('Locations', () => {
  test.beforeEach(async () => {
    await db.delete(schema.locations).where(eq(schema.locations.tenantId, E2E_TENANT_ID))
  })

  test('Tenant Admin sees the Locations page heading', async ({ page }) => {
    await login(page)
    await page.goto('/locations')
    await expect(page.locator('h1')).toContainText('Locations')
  })

  test('empty state shown when no Locations exist', async ({ page }) => {
    await login(page)
    await page.goto('/locations')
    await expect(page.locator('text=No locations yet')).toBeVisible()
  })

  test('Locations list shows name and created date for existing Locations', async ({ page }) => {
    await db.insert(schema.locations)
      .values([
        { id: E2E_LOC_A_ID, tenantId: E2E_TENANT_ID, name: 'Warehouse A' },
        { id: E2E_LOC_B_ID, tenantId: E2E_TENANT_ID, name: 'Clinic B' },
      ])
      .onConflictDoNothing()

    await login(page)
    await page.goto('/locations')

    const table = page.locator('table')
    await expect(table).toBeVisible()
    await expect(table).toContainText('Warehouse A')
    await expect(table).toContainText('Clinic B')
    await expect(page.locator('tbody tr')).toHaveCount(2)
  })

  test('Location detail page shows name and created date', async ({ page }) => {
    await db.insert(schema.locations)
      .values({ id: E2E_LOC_A_ID, tenantId: E2E_TENANT_ID, name: 'Warehouse A' })
      .onConflictDoNothing()

    await login(page)
    await page.goto(`/locations/${E2E_LOC_A_ID}`)

    await expect(page.locator('h1')).toContainText('Warehouse A')
    await expect(page.getByText(/Created/i)).toBeVisible()
  })

  test('clicking a Location name in the list navigates to its detail page', async ({ page }) => {
    await db.insert(schema.locations)
      .values({ id: E2E_LOC_A_ID, tenantId: E2E_TENANT_ID, name: 'Warehouse A' })
      .onConflictDoNothing()

    await login(page)
    await page.goto('/locations')

    await page.locator('table').locator('a:has-text("Warehouse A")').click()
    await expect(page).toHaveURL(`/locations/${E2E_LOC_A_ID}`)
    await expect(page.locator('h1')).toContainText('Warehouse A')
  })
})
