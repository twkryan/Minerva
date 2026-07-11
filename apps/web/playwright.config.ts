import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

process.env.CLERK_PUBLISHABLE_KEY ??=
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  outputDir: "./output/playwright/test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "./output/playwright/report" }],
  ],
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  webServer: {
    command: `pnpm build && pnpm start --hostname localhost --port ${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    url: baseURL,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "clerk setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "student journey",
      dependencies: ["clerk setup"],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
