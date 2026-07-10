# Minerva Web

Next.js application for the Minerva MVP. It owns the UI, Clerk authentication,
Prisma schema, and all server-side routes/actions.

## Local setup

1. Install dependencies from the monorepo root:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the Supabase and Clerk
   credentials.

3. Generate the Prisma Client:

   ```bash
   pnpm --filter @minerva/web db:generate
   ```

4. After the Supabase project is configured, create and apply the initial
   migration:

   ```bash
   pnpm --filter @minerva/web db:migrate -- --name initial_schema
   ```

5. Start the app:

   ```bash
   pnpm --filter @minerva/web dev
   ```

## Supabase usage

Supabase is used as the PostgreSQL database. `DATABASE_URL` is the pooled
runtime connection string, while `DIRECT_URL` is reserved for Prisma migrations
and administration commands. Supabase Storage will be added later for question
images and PDFs.

## Clerk webhook

Configure a Clerk webhook for `user.created` pointing to
`/api/webhooks/clerk`. The handler verifies the Svix signature and creates the
matching `User` row using the Clerk user ID as the database primary key.
