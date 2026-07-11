import { expect, test } from "@playwright/test";

test("public catalog pages expose metadata and structured data", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vestibulares/enem");

  await expect(page.getByRole("heading", { level: 1, name: "ENEM" })).toBeVisible();
  await expect(page).toHaveTitle("Estude para ENEM | Minerva");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/vestibulares\/enem$/
  );

  const examStructuredData = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const parsedExamData = JSON.parse(examStructuredData ?? "[]") as Array<{
    "@type"?: string;
  }>;

  expect(parsedExamData.map((item) => item["@type"])).toEqual([
    "EducationalApplication",
    "FAQPage",
  ]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth
    )
  ).toBe(true);

  await page.goto("/materias/math");
  await expect(page.getByRole("heading", { level: 1, name: "Math" })).toBeVisible();
  await expect(page).toHaveTitle("Estude Math | Minerva");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/materias\/math$/
  );

  const sitemapResponse = await page.request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  expect(await sitemapResponse.text()).toContain("/vestibulares/enem");

  const robotsResponse = await page.request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  expect(await robotsResponse.text()).toContain("Sitemap:");
});
