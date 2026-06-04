import { test, expect } from '@playwright/test'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './global-setup'

const E2E_TENANT_ID   = 'e2e00000-0000-0000-0000-000000000001'
const E2E_SURVEY_ID   = 'e2e00000-0000-0000-0000-000000000040'
const E2E_INDUSTRY_ID = 'e2e00000-0000-0000-0000-000000000030'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
}

test.describe.serial('Question CRUD in survey builder', () => {
  test.beforeEach(async () => {
    await db.delete(schema.questions).where(eq(schema.questions.surveyId, E2E_SURVEY_ID))
    await db.delete(schema.surveys).where(eq(schema.surveys.id, E2E_SURVEY_ID))
    await db.insert(schema.industries).values({ id: E2E_INDUSTRY_ID, name: 'E2E Blood Bank' }).onConflictDoNothing()
    await db.insert(schema.tenantIndustries).values({ tenantId: E2E_TENANT_ID, industryId: E2E_INDUSTRY_ID }).onConflictDoNothing()
    await db.insert(schema.surveys).values({
      id: E2E_SURVEY_ID,
      tenantId: E2E_TENANT_ID,
      industryId: E2E_INDUSTRY_ID,
      name: 'E2E Questions Survey',
      passingScore: 80,
      isCurrent: true,
    })
  })

  test.afterEach(async () => {
    await db.delete(schema.questions).where(eq(schema.questions.surveyId, E2E_SURVEY_ID))
    await db.delete(schema.surveys).where(eq(schema.surveys.id, E2E_SURVEY_ID))
    await db.delete(schema.tenantIndustries).where(eq(schema.tenantIndustries.tenantId, E2E_TENANT_ID))
  })

  test('survey builder shows empty question list', async ({ page }) => {
    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)
    await expect(page.getByText('No questions yet')).toBeVisible()
  })

  test('survey builder lists questions with text, answer type, point value, and critical flag', async ({ page }) => {
    await db.insert(schema.questions).values({
      tenantId: E2E_TENANT_ID,
      surveyId: E2E_SURVEY_ID,
      text: 'Is the facility licensed?',
      answerType: 'true_false',
      pointValue: 10,
      isCritical: true,
      position: 1,
    })

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    const row = page.locator('[data-testid="question-row"]').first()
    await expect(row).toContainText('Is the facility licensed?')
    await expect(row).toContainText('True/False')
    await expect(row).toContainText('10')
    await expect(row).toContainText('Critical')
    await expect(page.getByTestId('question-range').first()).toContainText('—')
  })

  test('admin can add a new question', async ({ page }) => {
    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    await page.click('button:has-text("Add question")')
    await page.fill('[data-testid="question-text-input"]', 'Is the facility licensed?')
    await page.selectOption('[data-testid="answer-type-select"]', 'true_false')
    await page.fill('[data-testid="point-value-input"]', '10')
    await page.check('[data-testid="is-critical-checkbox"]')
    await page.click('button:has-text("Save")')

    await expect(page.locator('[data-testid="question-row"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="question-row"]').first()).toContainText('Is the facility licensed?')
  })

  test('admin can edit a question via modal', async ({ page }) => {
    await db.insert(schema.questions).values({
      tenantId: E2E_TENANT_ID,
      surveyId: E2E_SURVEY_ID,
      text: 'Original question text',
      answerType: 'true_false',
      pointValue: 5,
      isCritical: false,
      position: 1,
    })

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    await page.locator('[data-testid="question-row"]').first().getByRole('button', { name: 'Edit' }).click()
    await page.fill('[data-testid="question-text-input"]', 'Updated question text')
    await page.fill('[data-testid="point-value-input"]', '20')
    await page.click('button:has-text("Save")')

    await expect(page.locator('[data-testid="question-row"]').first()).toContainText('Updated question text')
    await expect(page.locator('[data-testid="question-row"]').first()).toContainText('20')
  })

  test('admin can delete a question with confirmation', async ({ page }) => {
    await db.insert(schema.questions).values({
      tenantId: E2E_TENANT_ID,
      surveyId: E2E_SURVEY_ID,
      text: 'Question to delete',
      answerType: 'file',
      pointValue: 0,
      isCritical: false,
      position: 1,
    })

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    await page.locator('[data-testid="question-row"]').first().getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.locator('[data-testid="question-row"]')).toHaveCount(0)
    await expect(page.getByText('No questions yet')).toBeVisible()
  })

  test('selecting Scored answer type reveals min/max inputs; other types hide them', async ({ page }) => {
    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    await page.click('button:has-text("Add question")')
    await expect(page.getByTestId('scored-min-input')).not.toBeVisible()
    await expect(page.getByTestId('scored-max-input')).not.toBeVisible()

    await page.selectOption('[data-testid="answer-type-select"]', 'scored')
    await expect(page.getByTestId('scored-min-input')).toBeVisible()
    await expect(page.getByTestId('scored-max-input')).toBeVisible()

    await page.selectOption('[data-testid="answer-type-select"]', 'true_false')
    await expect(page.getByTestId('scored-min-input')).not.toBeVisible()
    await expect(page.getByTestId('scored-max-input')).not.toBeVisible()
  })

  test('admin can add a scored question with min/max range', async ({ page }) => {
    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    await page.click('button:has-text("Add question")')
    await page.fill('[data-testid="question-text-input"]', 'Rate the cleanliness')
    await page.selectOption('[data-testid="answer-type-select"]', 'scored')
    await page.fill('[data-testid="point-value-input"]', '10')
    await page.fill('[data-testid="scored-min-input"]', '0')
    await page.fill('[data-testid="scored-max-input"]', '5')
    await page.click('button:has-text("Save")')

    const row = page.locator('[data-testid="question-row"]').first()
    await expect(row).toContainText('Rate the cleanliness')
    await expect(row).toContainText('Scored')
    await expect(row).toContainText('0–5')
  })

  test('editing a scored question prefills existing min/max in the modal', async ({ page }) => {
    await db.insert(schema.questions).values({
      tenantId: E2E_TENANT_ID,
      surveyId: E2E_SURVEY_ID,
      text: 'Rate the facility',
      answerType: 'scored',
      pointValue: 20,
      scoredMinValue: 1,
      scoredMaxValue: 100,
      isCritical: false,
      position: 1,
    })

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    await page.locator('[data-testid="question-row"]').first().getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByTestId('scored-min-input')).toHaveValue('1')
    await expect(page.getByTestId('scored-max-input')).toHaveValue('100')

    await page.fill('[data-testid="scored-max-input"]', '50')
    await page.click('button:has-text("Save")')

    await expect(page.locator('[data-testid="question-row"]').first()).toContainText('1–50')
  })

  test('reordering via drag-and-drop persists on page refresh', async ({ page }) => {
    await db.insert(schema.questions).values([
      { tenantId: E2E_TENANT_ID, surveyId: E2E_SURVEY_ID, text: 'First question', answerType: 'true_false', pointValue: 0, isCritical: false, position: 1 },
      { tenantId: E2E_TENANT_ID, surveyId: E2E_SURVEY_ID, text: 'Second question', answerType: 'scored', pointValue: 5, isCritical: false, position: 2 },
    ])

    await login(page)
    await page.goto(`/surveys/${E2E_SURVEY_ID}`)

    const rows = page.locator('[data-testid="question-row"]')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('First question')

    // Drag the first row handle to after the second row
    const firstHandle = rows.first().locator('[data-testid="drag-handle"]')
    const secondRow = rows.nth(1)
    const secondBox = await secondRow.boundingBox()
    if (!secondBox) throw new Error('Cannot get bounding box')

    await firstHandle.dragTo(secondRow, {
      targetPosition: { x: secondBox.width / 2, y: secondBox.height * 0.75 },
    })

    // After drop the order should be reversed
    await expect(rows.first()).toContainText('Second question')

    // Refresh and verify persistence
    await page.reload()
    await expect(page.locator('[data-testid="question-row"]').first()).toContainText('Second question')
  })
})
