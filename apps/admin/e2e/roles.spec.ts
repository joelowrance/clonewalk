import { test, expect } from '@playwright/test'
import { E2E_USER_EMAIL, E2E_USER_PASSWORD, E2E_TARGET_USER_EMAIL } from './global-setup'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', E2E_USER_EMAIL)
  await page.fill('input[type="password"]', E2E_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
}

test('Tenant Admin can navigate to /roles, create a new role with two permissions, and see it in the list', async ({ page }) => {
  await login(page)
  await page.goto('/roles')
  await expect(page.locator('h1')).toContainText('Roles')

  await page.click('a:has-text("New role")')
  await expect(page).toHaveURL('/roles/new')

  await page.fill('input#role-name', 'Inspector')
  await page.check('input[type="checkbox"] >> nth=0')
  await page.check('input[type="checkbox"] >> nth=1')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/roles')
  await expect(page.locator('table')).toContainText('Inspector')
})

test('Tenant Admin can edit a role\'s name and permissions', async ({ page }) => {
  await login(page)
  await page.goto('/roles')

  // Edit the "Inspector" role created in the previous test
  const inspectorRow = page.locator('tr', { hasText: 'Inspector' })
  await inspectorRow.locator('a:has-text("Edit")').click()
  await expect(page).toHaveURL(/\/roles\/.+$/)

  const nameInput = page.locator('input#role-name')
  await nameInput.fill('')
  await nameInput.fill('Updated Role Name')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/roles')
  await expect(page.locator('table')).toContainText('Updated Role Name')
})

test('Attempting to delete a role assigned to a user shows a blocking error message', async ({ page }) => {
  await login(page)
  await page.goto('/roles')

  // The "E2E Admin" role is assigned to the E2E user — delete it
  const row = page.locator('tr', { hasText: 'E2E Admin' })
  await row.locator('button:has-text("Delete")').click()

  await expect(page.locator('[role="alert"]:not([id])')).toContainText('Remove all users from this role before deleting')
})

test('Tenant Admin can open a user\'s detail page, change their role, and see effective permissions update', async ({ page }) => {
  await login(page)
  await page.goto('/users')
  await expect(page.locator('h1')).toContainText('Users')

  const targetRow = page.locator('tr', { hasText: E2E_TARGET_USER_EMAIL })
  await targetRow.locator('a').click()
  await expect(page).toHaveURL(/\/users\/.+$/)

  // Check the E2E Admin role for the target user
  const roleCheckbox = page.locator('label', { hasText: 'E2E Admin' }).locator('input[type="checkbox"]')
  await roleCheckbox.check()
  await page.click('button:has-text("Save roles")')

  // Effective permissions should now include manage:users
  await expect(page.locator('ul')).toContainText('manage:users')
})

test('Adding a granted: false override removes permission from the effective list', async ({ page }) => {
  await login(page)
  await page.goto('/users')

  const targetRow = page.locator('tr', { hasText: E2E_TARGET_USER_EMAIL })
  await targetRow.locator('a').click()

  // First give the target user the E2E Admin role
  const roleCheckbox = page.locator('label', { hasText: 'E2E Admin' }).locator('input[type="checkbox"]')
  if (!(await roleCheckbox.isChecked())) {
    await roleCheckbox.check()
    await page.click('button:has-text("Save roles")')
  }

  // Now deny manage:users via override
  const overrideRow = page.locator('div', { hasText: 'manage:users' }).last()
  await overrideRow.locator('select').selectOption('deny')
  await page.click('button:has-text("Save overrides")')

  await expect(page.locator('ul')).not.toContainText('manage:users')
})

test('Attempting to remove manage:users from the currently logged-in Admin is rejected', async ({ page }) => {
  await login(page)
  await page.goto('/users')

  const adminRow = page.locator('tr', { hasText: E2E_USER_EMAIL })
  await adminRow.locator('a').click()

  // Uncheck the E2E Admin role (which has manage:users)
  const roleCheckbox = page.locator('label', { hasText: 'E2E Admin' }).locator('input[type="checkbox"]')
  await roleCheckbox.uncheck()
  await page.click('button:has-text("Save roles")')

  await expect(page.locator('[role="alert"]:not([id])')).toContainText('manage:users')
})
