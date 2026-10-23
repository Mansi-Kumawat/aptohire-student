import { test, expect } from '@playwright/test';

test.describe('Student Portal Core User Flows', () => {
  test('signs in as Aarav Sharma using demo quick-select and verifies dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Demo accounts')).toBeVisible();

    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    await expect(page.getByText(/What to do next/i)).toBeVisible();
    await expect(page.getByText(/React/i).first()).toBeVisible();
    await expect(page.getByText(/Proficient/i).first()).toBeVisible();
  });

  test('navigates to Skills Scorecard and checks skill proof details', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    await page.goto('/scorecard');
    await expect(page.getByRole('heading', { name: /Verified scorecard/i })).toBeVisible();

    // Click skill link to open detail
    await page.locator('a[href="/scorecard/react"]').first().click();
    await page.waitForURL('/scorecard/react');
    await expect(page.getByRole('heading', { name: /Evidence trail/i })).toBeVisible();
  });

  test('reviews active access requests on Sharing page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    await page.goto('/sharing');
    await expect(page.getByRole('heading', { name: /Sharing & opportunities/i })).toBeVisible();
  });

  test('checks responsive navigation elements across breakpoints', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    const viewportSize = page.viewportSize();
    const width = viewportSize?.width || 1024;

    if (width < 768) {
      // Bottom navigation bar visible on mobile
      const bottomNav = page.getByRole('navigation', { name: 'Mobile Navigation' });
      await expect(bottomNav).toBeVisible();

      // Hamburger menu button also accessible on mobile top bar
      const menuBtn = page.getByRole('button', { name: 'Open navigation drawer' });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
      const drawer = page.getByRole('dialog', { name: 'Navigation drawer' });
      await expect(drawer).toBeVisible();
      // Close drawer via close button inside drawer
      await drawer.getByRole('button', { name: 'Close navigation drawer' }).click();
      await expect(drawer).not.toBeVisible();
    } else if (width >= 1024) {
      // Side rail visible on desktop
      const sideRail = page.locator('aside');
      await expect(sideRail.first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Scorecard' }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Resume' }).first()).toBeVisible();
    } else {
      // Hamburger menu button visible on tablet
      const menuBtn = page.getByRole('button', { name: 'Open navigation drawer' });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
      const drawer = page.getByRole('dialog', { name: 'Navigation drawer' });
      await expect(drawer).toBeVisible();
      // Click a navigation link in the drawer
      await page.getByRole('link', { name: 'Scorecard' }).click();
      await page.waitForURL('/scorecard');
      await expect(drawer).not.toBeVisible();
    }
  });

  test('enforces noindex robots meta tag across routes', async ({ page }) => {
    // Check login route
    await page.goto('/login');
    const robotsLogin = page.locator('meta[name="robots"]').first();
    await expect(robotsLogin).toHaveAttribute('content', /noindex/);
    const helmetLogin = page.locator('meta[name="robots"][data-rh="true"]');
    await expect(helmetLogin).toHaveAttribute('content', /noindex, nofollow/);

    // Sign in and check authenticated routes
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    const helmetHome = page.locator('meta[name="robots"][data-rh="true"]');
    await expect(helmetHome).toHaveAttribute('content', /noindex, nofollow/);

    // Check scorecard route
    await page.goto('/scorecard');
    const helmetScorecard = page.locator('meta[name="robots"][data-rh="true"]');
    await expect(helmetScorecard).toHaveAttribute('content', /noindex, nofollow/);
  });

  test('allows account data export and clean sign out', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /Account & security/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export all data/i })).toBeVisible();

    // Sign out
    await page.getByRole('button', { name: /Sign out of all devices/i }).click();
    await page.waitForURL('/login');
    await expect(page.getByText('Demo accounts')).toBeVisible();
  });

  test('does not auto-direct to Aarav Sharma on clean visit and lets user pick persona', async ({ page }) => {
    // Clear any local storage/cookies
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    // Must redirect to /login?redirect=%2F rather than logging into Aarav automatically
    await page.waitForURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible();
    await expect(page.getByText('Avi Verma')).toBeVisible();
    await expect(page.getByText('Aarav Sharma')).toBeVisible();
  });

  test('signs in as Avi Verma, clicks SQL 88, and inspects scorecard detail without glitch', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');

    // Click Avi Verma demo persona
    await page.getByRole('button', { name: /Avi Verma/i }).click();
    await page.waitForURL('/');

    // Dashboard should show his verified SQL 88 skill
    await expect(page.getByText(/What to do next/i)).toBeVisible();
    await expect(page.getByText(/SQL/i).first()).toBeVisible();

    // Click on SQL to go to scorecard detail
    await page.goto('/scorecard/sql');
    await page.waitForURL('/scorecard/sql');

    // Must NOT show "Skill not assessed yet"
    await expect(page.getByText('Skill not assessed yet')).not.toBeVisible();

    // Must show verified score 88 and evidence trail
    await expect(page.getByText('88').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Advanced SQL developer/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Evidence trail/i })).toBeVisible();
    await expect(page.getByText(/Schema Design & Normalization/i)).toBeVisible();

    // Check BackButton works
    const backBtn = page.getByRole('button', { name: /Back to scorecard/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL('/scorecard');
  });

  test('validates Project Assistant modernized target level dropdown and back button', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    await page.goto('/projects/new');
    await expect(page.getByRole('heading', { name: /What do you want to get hired for\?/i })).toBeVisible();

    // Back to projects button
    const backBtn = page.getByRole('button', { name: /Back to projects/i });
    await expect(backBtn).toBeVisible();

    // Target competency level cards
    await expect(page.getByText('Target competency level')).toBeVisible();
    const profCard = page.getByRole('button', { name: /Proficient/i });
    const advCard = page.getByRole('button', { name: /Advanced/i });
    await expect(profCard).toBeVisible();
    await expect(advCard).toBeVisible();

    // Click Advanced card
    await advCard.click();

    // Check styled select is also present
    const selectElem = page.locator('#target-level-select');
    await expect(selectElem).toBeVisible();
    await expect(selectElem).toHaveValue('Advanced');
  });

  test('validates Go Back buttons across sub-pages', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    // Resume page
    await page.goto('/resume');
    await expect(page.getByRole('button', { name: /Back to scorecard/i })).toBeVisible();

    // Notifications page
    await page.goto('/notifications');
    await expect(page.getByRole('button', { name: /Back to dashboard/i })).toBeVisible();

    // Help page
    await page.goto('/help');
    await expect(page.getByRole('button', { name: /Back to dashboard/i })).toBeVisible();

    // Submissions new page
    await page.goto('/submissions/new');
    await expect(page.getByRole('button', { name: /Back to projects/i })).toBeVisible();
  });

  test('verifies persistent session and cookies across page refreshes and new tabs', async ({ context, page }) => {
    // 1. Sign in as Aarav
    await page.goto('/login');
    await page.getByRole('button', { name: /Aarav Sharma/i }).click();
    await page.waitForURL('/');

    // 2. Check cookies are set
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'aptohire_session');
    const tokenCookie = cookies.find((c) => c.name === 'aptohire_token');
    expect(sessionCookie).toBeDefined();
    expect(tokenCookie).toBeDefined();

    // 3. Refresh page and verify session is still active
    await page.reload();
    await expect(page.getByText(/What to do next/i)).toBeVisible();

    // 4. Open in new tab in the same context and verify session persists
    const newPage = await context.newPage();
    await newPage.goto('/');
    await expect(newPage.getByText(/What to do next/i)).toBeVisible();
    await newPage.close();

    // 5. Sign out and verify cookies are flushed
    await page.goto('/account');
    await page.getByRole('button', { name: /Sign out of all devices/i }).click();
    await page.waitForURL(/\/login/);

    const postCookies = await context.cookies();
    const flushedSessionCookie = postCookies.find((c) => c.name === 'aptohire_session');
    expect(flushedSessionCookie).toBeUndefined();
  });
});
