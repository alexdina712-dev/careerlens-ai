import { test, expect, type Page } from '@playwright/test';
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'Uncaught browser exceptions').toEqual([]);
});
const password = 'TestPrivate!2026';
const cvText =
  'Fictional Taylor Example. Software developer with 3 years of experience. Skills include React, TypeScript, Node.js, PostgreSQL, REST APIs and Git. Built internal dashboards and wrote automated tests with Vitest and Playwright.';
const description =
  'We seek a software developer with React, TypeScript, Node.js and PostgreSQL experience. Use Git, build REST APIs, write automated tests and work with Docker and AWS. At least 2 years of experience.';
async function nav(page: Page, label: string) {
  await expect(page.locator('main h1, .report-hero h2').first()).toBeVisible();
  await expect(page.getByRole('status')).not.toBeVisible();
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: label, exact: true })
    .click();
}
async function register(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Full name').fill('Fictional Browser Tester');
  await page
    .getByLabel('Email address')
    .fill(`browser-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: /A clearer next move/ })).toBeVisible();
}
async function clean(page: Page) {
  const origin = new URL(page.url()).origin;
  await page.request.delete('/api/workspace/account', {
    headers: { Origin: origin },
    data: { password },
  });
}
async function addCv(page: Page, upload = false) {
  await nav(page, 'CV library');
  await page.getByRole('button', { name: 'Add CV', exact: true }).click();
  if (upload) {
    await page.getByLabel('Upload CV file').setInputFiles({
      name: 'fictional-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(cvText),
    });
    await expect(page.getByLabel('CV text')).toHaveValue(cvText);
  }
  await page.getByLabel('CV title', { exact: true }).fill('Engineering CV');
  await page.getByLabel('CV text').fill(cvText);
  await page.getByRole('button', { name: 'Save CV', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Engineering CV', exact: true })).toBeVisible();
}
async function addJob(page: Page) {
  await nav(page, 'Applications');
  await page.getByRole('button', { name: 'Add opportunity', exact: true }).first().click();
  await page.getByLabel('Company', { exact: true }).last().fill('Fictional Northstar');
  await page.getByLabel('Position', { exact: true }).fill('Full-stack Developer');
  await page.getByLabel('Location', { exact: true }).fill('Remote');
  await page.getByLabel('Job URL', { exact: true }).fill('https://example.com/jobs/developer');
  await page.getByLabel('Job description', { exact: true }).fill(description);
  await page.getByLabel('Your notes', { exact: true }).fill('Prepare project examples.');
  await page.getByRole('button', { name: 'Save opportunity', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Full-stack Developer Fictional Northstar' }),
  ).toBeVisible();
}
test('demo login, session persistence, protected routes and logout', async ({ page }) => {
  await page.goto('/jobs');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Email address').fill('demo@careerlens.app');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Explore the demo workspace' }).click();
  await expect(page.getByRole('heading', { name: /A clearer next move/ })).toBeVisible();
  await page.reload();
  await nav(page, 'CV library');
  await expect(page.getByRole('button', { name: 'Add CV', exact: true })).toBeDisabled();
  await page.getByLabel('View version').selectOption({ index: 1 });
  await expect(page.locator('.cv-text')).toContainText('Alex Taylor');
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
test('private CV upload, immutable versions and deletion', async ({ page }) => {
  await register(page);
  try {
    await addCv(page, true);
    await expect(
      page.getByText('fictional-cv.txt — text extracted; original file is discarded.'),
    ).not.toBeVisible();
    await expect(page.locator('.panel-bottom')).toContainText('fictional-cv.txt');
    await page.getByRole('button', { name: 'New version', exact: true }).click();
    await page.getByLabel('CV text').fill(cvText + ' Added Docker project evidence.');
    await page.getByRole('button', { name: 'Save new version', exact: true }).click();
    await expect(page.getByLabel('View version')).toContainText('Version 2');
    await page.getByLabel('View version').selectOption({ index: 1 });
    await expect(page.locator('.cv-text')).not.toContainText('Added Docker');
    await page.getByRole('button', { name: 'Delete Engineering CV', exact: true }).click();
    await page.getByRole('button', { name: 'Delete CV permanently' }).click();
    await expect(page.getByRole('heading', { name: 'Start with your experience' })).toBeVisible();
  } finally {
    await clean(page);
  }
});
test('create and edit job, track status history and filter', async ({ page }) => {
  await register(page);
  try {
    await addJob(page);
    await page.getByLabel('Status for Full-stack Developer').selectOption('APPLIED');
    await expect(page.getByLabel('Status for Full-stack Developer')).toHaveValue('APPLIED');
    await page.getByLabel('Status for Full-stack Developer').selectOption('INTERVIEW');
    await page.getByRole('button', { name: 'Full-stack Developer Fictional Northstar' }).click();
    await expect(page.locator('.timeline-row')).toHaveCount(3);
    await page.getByRole('button', { name: 'Edit opportunity', exact: true }).click();
    await page.getByLabel('Your notes', { exact: true }).fill('Interview Thursday.');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.getByLabel('Search applications').fill('Thursday');
    await expect(
      page.getByRole('button', { name: 'Full-stack Developer Fictional Northstar' }),
    ).toBeVisible();
    await page.getByLabel('Search applications').fill('no-match');
    await expect(
      page.getByRole('heading', { name: 'No opportunities match these filters' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
    await page.getByRole('button', { name: 'Delete Full-stack Developer', exact: true }).click();
    await page.getByRole('button', { name: 'Delete opportunity permanently' }).click();
    await expect(
      page.getByRole('heading', { name: 'Your next chapter starts with one role' }),
    ).toBeVisible();
  } finally {
    await clean(page);
  }
});
test('complete advisory analysis, export and CV deletion cascade', async ({ page }) => {
  await register(page);
  try {
    await addCv(page);
    await addJob(page);
    await nav(page, 'Analysis studio');
    await page.getByRole('button', { name: 'Analyze this role', exact: true }).click();
    await expect(page).toHaveURL(/analyses\//);
    await expect(
      page.getByRole('heading', { name: 'Full-stack Developer', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Docker', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('React', { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Prepare for the conversation' }).first(),
    ).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export/ }).click();
    await expect((await download).suggestedFilename()).toMatch(/\.json$/);
    await nav(page, 'CV library');
    await page.getByRole('button', { name: 'Delete Engineering CV', exact: true }).click();
    await page.getByRole('button', { name: 'Delete CV permanently' }).click();
    await nav(page, 'Analysis studio');
    await expect(
      page.getByRole('heading', { name: 'Your first insight is one comparison away' }),
    ).toBeVisible();
    await nav(page, 'Applications');
    await expect(
      page.getByRole('button', { name: 'Full-stack Developer Fictional Northstar' }),
    ).toBeVisible();
  } finally {
    await clean(page);
  }
});
test('responsive demo pages have no page overflow or browser exceptions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/login');
  await page.getByRole('button', { name: 'Explore the demo workspace' }).click();
  await expect(page.getByRole('heading', { name: /A clearer next move/ })).toBeVisible();
  for (const label of [
    'CV library',
    'Applications',
    'Analysis studio',
    'Privacy & account',
    'Overview',
  ]) {
    await nav(page, label);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
test('password-confirmed account deletion revokes the session', async ({ page }) => {
  await register(page);
  await nav(page, 'Privacy & account');
  await page.getByRole('button', { name: 'Delete my account', exact: true }).click();
  await page.getByLabel('Confirm your password').fill('incorrect-password');
  await page.getByRole('button', { name: 'Delete my account permanently' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Confirm your password').fill(password);
  await page.getByRole('button', { name: 'Delete my account permanently' }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto('/cvs');
  await expect(page).toHaveURL(/login/);
});
