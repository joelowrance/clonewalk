import { test, expect } from '@playwright/test'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './global-setup'

const E2E_TENANT_ID   = 'e2e00000-0000-0000-0000-000000000001'
const E2E_SURVEY_ID   = 'e2e00000-0000-0000-0000-000000000020'
const E2E_INDUSTRY_ID = 'e2e00000-0000-0000-0000-000000000030'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
}

test.describe.serial('Surveys', () => {
  test.beforeEach(async () => {
    await db.delete(schema.surveys).where(eq(schema.surveys.tenantId, E2E_TENANT_ID))
    await db.insert(schema.industries).values({ id: E2E_INDUSTRY_ID, name: 'E2E Blood Bank' }).onConflictDoNothing()
    await db.insert(schema.tenantIndustries).values({ tenantId: E2E_TENANT_ID, industryId: E2E_INDUSTRY_ID }).onConflictDoNothing()
  })

  test.afterEach(async () => {
    await db.delete(schema.surveys).where(eq(schema.surveys.tenantId, E2E_TENANT_ID))
    await db.delete(schema.tenantIndustries).where(eq(schema.tenantIndustries.tenantId, E2E_TENANT_ID))
  })

  test('/surveys shows "No surveys yet" empty state', async ({ page }) => {
    await login(page)
    await page.goto('/surveys')
    await expect(page.locator('text=No surveys yet')).toBeVisible()
  })

  test('/surveys lists surveys with name, industry, and passing score', async ({ page }) => {
    await db.insert(schema.surveys).values({
      id: E2E_SURVEY_ID,
      tenantId: E2E_TENANT_ID,
      industryId: E2E_INDUSTRY_ID,
      name: 'Blood Bank Compliance Survey',
      passingScore: 80,
      isCurrent: true,
    }).onConflictDoNothing()

    await login(page)
    await page.goto('/surveys')

    const table = page.locator('table')
    await expect(table).toBeVisible()
    await expect(table).toContainText('Blood Bank Compliance Survey')
    await expect(table).toContainText('E2E Blood Bank')
    await expect(table).toContainText('80')
  })

  test('clicking a row navigates to /surveys/[id]', async ({ page }) => {
    await db.insert(schema.surveys).values({
      id: E2E_SURVEY_ID,
      tenantId: E2E_TENANT_ID,
      industryId: E2E_INDUSTRY_ID,
      name: 'Blood Bank Compliance Survey',
      passingScore: 80,
      isCurrent: true,
    }).onConflictDoNothing()

    await login(page)
    await page.goto('/surveys')

    await page.locator('tbody tr').first().click()
    await expect(page).toHaveURL(`/surveys/${E2E_SURVEY_ID}`)
  })

  test('"New survey" link navigates to /surveys/new', async ({ page }) => {
    await login(page)
    await page.goto('/surveys')
    await page.click('a:has-text("New survey")')
    await expect(page).toHaveURL('/surveys/new')
  })

  test('/surveys/new has industry select, name field, and passing score field', async ({ page }) => {
    await login(page)
    await page.goto('/surveys/new')
    await expect(page.locator('select')).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="number"]')).toBeVisible()
  })

  test('submitting /surveys/new creates survey and redirects to /surveys/[id]', async ({ page }) => {
    await login(page)
    await page.goto('/surveys/new')

    await page.fill('input[type="text"]', 'My Blood Bank Survey')
    await page.fill('input[type="number"]', '75')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/surveys\/[^/]+$/)
  })

  test('/surveys/new shows error when selected industry already has a survey', async ({ page }) => {
    // Pre-insert a survey for the E2E industry
    await db.insert(schema.surveys).values({
      id: E2E_SURVEY_ID,
      tenantId: E2E_TENANT_ID,
      industryId: E2E_INDUSTRY_ID,
      name: 'Existing Survey',
      passingScore: 70,
      isCurrent: true,
    }).onConflictDoNothing()

    await login(page)
    await page.goto('/surveys/new')

    await page.fill('input[type="text"]', 'Duplicate Survey')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/surveys/new')
    await expect(page.getByText('This industry already has a survey')).toBeVisible()
  })

  test('/surveys/[id]/settings pre-fills current name and passing score', async ({ page }) => {
    await db.insert(schema.surveys).values({
      id: E2E_SURVEY_ID,
      tenantId: E2E_TENANT_ID,
      industryId: E2E_INDUSTRY_ID,
      name: 'Pre-fill Test Survey',
      passingScore: 65,
      isCurrent: true,
    }).onConflictDoNothing()

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}/settings`)

    await expect(page.locator('input[type="text"]')).toHaveValue('Pre-fill Test Survey')
    await expect(page.locator('input[type="number"]')).toHaveValue('65')
  })

  test('submitting /surveys/[id]/settings updates the survey', async ({ page }) => {
    await db.insert(schema.surveys).values({
      id: E2E_SURVEY_ID,
      tenantId: E2E_TENANT_ID,
      industryId: E2E_INDUSTRY_ID,
      name: 'Original Survey Name',
      passingScore: 60,
      isCurrent: true,
    }).onConflictDoNothing()

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}/settings`)

    await page.fill('input[type="text"]', 'Updated Survey Name')
    await page.fill('input[type="number"]', '90')
    await page.click('button[type="submit"]')

    await expect(page.getByText('Saved')).toBeVisible()
  })
})
