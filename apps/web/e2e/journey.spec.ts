import { createClerkClient } from "@clerk/backend";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

const TEST_PASSWORD = "Minerva-E2E-2026!";

type ClerkWindow = Window & {
  Clerk?: {
    user?: {
      id?: string;
    };
  };
};

async function expectNoHorizontalOverflow(page: Page) {
  const hasNoOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth
  );

  expect(hasNoOverflow).toBe(true);
}

async function cleanupTestUser(emailAddress: string, knownUserId?: string) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const connectionString = process.env.DATABASE_URL;

  if (!secretKey || !connectionString) {
    return;
  }

  const clerkClient = createClerkClient({ secretKey });
  const { data: matchingUsers } = await clerkClient.users.getUserList({
    emailAddress: [emailAddress],
  });
  const userIds = new Set(
    [knownUserId, ...matchingUsers.map((user) => user.id)].filter(
      (userId): userId is string => Boolean(userId)
    )
  );
  const pool = new Pool({ connectionString });

  try {
    if (userIds.size) {
      await pool.query('DELETE FROM "User" WHERE id = ANY($1::text[])', [
        [...userIds],
      ]);
    }
  } finally {
    await pool.end();
  }

  await Promise.all(
    [...userIds].map((userId) =>
      clerkClient.users.deleteUser(userId).catch(() => undefined)
    )
  );
}

test("student completes the MVP journey", async ({ page }, testInfo) => {
  test.setTimeout(300_000);

  const timestamp = Date.now();
  const emailAddress = `minerva-e2e-${timestamp}+clerk_test@example.com`;
  let clerkUserId: string | undefined;

  await setupClerkTestingToken({ page });

  try {
    await page.goto("/sign-up");
    await page.locator(".cl-signUp-root").waitFor({ state: "attached" });

    const firstName = page.locator('input[name="firstName"]');
    if (await firstName.isVisible()) {
      await firstName.fill("Teste");
    }

    const lastName = page.locator('input[name="lastName"]');
    if (await lastName.isVisible()) {
      await lastName.fill("Minerva");
    }

    const username = page.locator('input[name="username"]');
    if (await username.isVisible()) {
      await username.fill(`minerva_e2e_${timestamp}`);
    }

    await page.locator('input[name="emailAddress"]').fill(emailAddress);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);

    const legalAccepted = page.locator('input[name="legalAccepted"]');
    if (await legalAccepted.isVisible()) {
      await legalAccepted.check();
    }

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Enter verification code" })
      .pressSequentially("424242");
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, {
      timeout: 30_000,
    });

    clerkUserId = await page.evaluate(
      () => (window as ClerkWindow).Clerk?.user?.id
    );
    expect(clerkUserId).toBeTruthy();

    await clerk.signOut({ page });
    await clerk.signIn({ emailAddress, page });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/onboarding");
    await page.getByRole("checkbox", { name: "ENEM" }).check();
    await page.getByPlaceholder("Ex.: Engenharia de Software").fill("Engenharia");
    await page.getByRole("button", { name: "Continuar" }).click();

    const availabilityInputs = page.locator(
      'input[type="number"][aria-label^="Horas"]'
    );
    await expect(availabilityInputs).toHaveCount(7);
    for (let index = 0; index < 7; index += 1) {
      await availabilityInputs.nth(index).fill("1");
    }
    await page.getByRole("button", { name: "Continuar" }).click();
    const saveOnboardingButton = page.getByRole("button", {
      name: "Salvar e ir ao painel",
    });
    await expect(saveOnboardingButton).toBeEnabled();
    await saveOnboardingButton.evaluate((button: HTMLButtonElement) =>
      button.click()
    );
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 120_000 });
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("dashboard-mobile.png"),
    });

    await page
      .getByRole("button", { name: /Gerar agenda|Gerar novamente/ })
      .click();
    const firstTask = page.locator('input[type="checkbox"]').first();
    await expect(firstTask).toBeVisible({ timeout: 30_000 });
    await firstTask.click();
    await expect(firstTask).toBeChecked({ timeout: 30_000 });

    await page.getByRole("link", { name: "Simulados" }).click();
    const enemCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "ENEM" });
    await enemCard.getByRole("button", { name: "Iniciar simulado" }).click();
    await expect(page).toHaveURL(/\/simulados\/[^/]+$/);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("exam-mobile.png"),
    });

    for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
      await page.getByRole("radio").first().check();

      if (questionIndex < 2) {
        await page.getByRole("button", { name: "Próxima" }).click();
      }
    }
    const submitAnswersButton = page.getByRole("button", {
      name: "Enviar respostas",
    });
    await expect(submitAnswersButton).toBeEnabled();
    await submitAnswersButton.evaluate((button: HTMLButtonElement) =>
      button.click()
    );
    await expect(page).toHaveURL(/\/correcao$/, { timeout: 30_000 });
    await expectNoHorizontalOverflow(page);

    const classificationRadios = page.locator(
      'input[type="radio"][name^="classification-"]'
    );
    await expect(classificationRadios).toHaveCount(12);
    for (let index = 0; index < 12; index += 4) {
      await classificationRadios.nth(index).check();
    }
    const completeCorrectionButton = page.getByRole("button", {
      name: /Concluir/,
    });
    await expect(completeCorrectionButton).toBeEnabled();
    await completeCorrectionButton.evaluate((button: HTMLButtonElement) =>
      button.click()
    );
    await expect(page).toHaveURL(/\/relatorio$/, { timeout: 30_000 });
    await expect(page.getByText("Relatório do simulado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ENEM" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  } finally {
    await cleanupTestUser(emailAddress, clerkUserId);
  }
});
