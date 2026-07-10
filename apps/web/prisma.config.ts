import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js uses .env.local in development, while Prisma CLI only loads .env by default.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI commands such as migrations must bypass Supavisor's transaction pooler.
    url: env("DIRECT_URL"),
  },
});
