# 📚 Minerva - Product Requirements Document (MVP)

## 0. Progress Tracker (keep updated)

 - **Last completed milestone:** Milestone 1: Initialization & Tooling
 - **Next up:** Confirmar a conclusao da Milestone 2

 
## 1. Product Overview
*   **Project Name:** Minerva
*   **Target Audience:** Brazilian students preparing for national exams (ENEM, FUVEST, UNICAMP) and high school curricula.
*   **Core Value Proposition:** A smart study platform that generates personalized daily study schedules based on exam weights and user difficulties, combined with a timed mock exam engine featuring a unique 4-step mistake classification system.

---

## 2. Technical Architecture & Strict Constraints
*   **Package Manager:** **`pnpm`** (Strictly required).
*   **Monorepo:** Turborepo (`pnpm workspaces`).
*   **Version Control:** Primary branch must be **`master`** (not `main`).
*   **Framework:** **Next.js (App Router)**. *Constraint: Next.js acts as both the Frontend UI and the Node.js Backend (via Route Handlers / Server Actions).*
*   **UI Stack:** Tailwind CSS + **`shadcn/ui`**.
*   **Database:** Supabase PostgreSQL.
*   **ORM:** Prisma. Must reside inside the Next.js app (`apps/web/prisma`).
*   **Authentication:** Clerk (Next.js SDK). *Constraint: Sign-up/Sign-in handled entirely by Clerk drop-in components. User sync must be handled via a secure Clerk Webhook.*
*   **File Storage:** Supabase Storage (for question images/PDFs). Vercel is strictly for compute/UI.

---

## 3. Lean Monorepo Structure
The project must strictly follow this lean monorepo structure. Do not over-complicate with unnecessary packages.

```text
minerva/
├── apps/
│   └── web/                   # Next.js App (Full-stack MVP)
│       ├── prisma/            # DB schema & migrations
│       ├── src/
│       │   ├── app/           # UI Pages, API Routes, Server Actions
│       │   └── components/ui/ # shadcn/ui components
│       ├── tsconfig.json      
│       └── package.json       
├── packages/
│   └── core/                  # Shared logic for future expansion
│       ├── schemas/           # Zod validation schemas
│       ├── types/             # Shared TypeScript interfaces
│       ├── constants/         # Static data (Exams list, subjects)
│       └── package.json       
├── package.json               # Root config (runs turbo)
├── pnpm-workspace.yaml        # Declares apps/ and packages/
└── turbo.json                 # Build caching rules
```

---

## 4. Core Features (MVP)
1.  **Onboarding:** Captures target exams (multiple), daily study hours per weekday, subject difficulties (0-100 scale), study objective, and distribution style preference.
2.  **Scheduling Algorithm:** Generates a 7-day study plan weighting user difficulty against the target exam's subject weights, respecting per-day availability.
3.  **Student Dashboard:** Tracks daily task completion.
4.  **Mock Exam Engine:** Timed environment simulating real tests.
5.  **4-Step Correction Flow:** Post-exam, users classify mistakes into: Correct, Lucky Guess, Attention Mistake, or Incorrect.
6.  **SEO Infrastructure:** Programmatic pages with JSON-LD for LLM and Google discovery.

---

## 5. Database Schema (Prisma Plan)

*AI Agent: Use this to construct `schema.prisma`.*

> **⚠️ Schema Rules:**
> - `UserDifficulty.level` is a scale of **0-100**
> - Multiple target exams supported via **`UserTargetExam`** 
> - Daily availability supported via **`UserAvailability`** (hours per day of week)
> - `User.id` maps to Clerk's String ID (e.g., `user_2x4k8j...`)

### Enums

*   **Classification:** `CORRECT`, `LUCKY_GUESS`, `ATTENTION_MISTAKE`, `INCORRECT`
*   **StudyObjective:** `PASS_THE_VESTIBULAR`, `IMPROVE_GRADES`, `REVIEW_CONTENT`
*   **DistributionStyle:** `BALANCED`, `FOCUSED`, `INTENSIVE`
*   **DayOfWeek:** `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`

### Models

*   **User:**
    *   `id` (String, PK — ClerkID, e.g. `"user_2x4k8j..."`)
    *   `preferredName` (String, Optional)
    *   `studyObjective` (Enum StudyObjective, Optional)
    *   `targetMajor` (String, Optional)
    *   `aiDistributionStyle` (Enum DistributionStyle, Default: `BALANCED`)
    *   `onboardingCompleted` (Boolean, Default: `false`)
    *   `createdAt` (DateTime, Default: `now()`)
    *   *Relations:* `targetExams` → UserTargetExam[], `availability` → UserAvailability[], `difficulties` → UserDifficulty[], `studyTasks` → StudyTask[], `mockExamAttempts` → MockExamAttempt[]

*   **UserAvailability:**
    *   `id` (String, PK, cuid)
    *   `userId` (String, FK → User)
    *   `dayOfWeek` (Enum DayOfWeek)
    *   `hours` (Int — 0-24)
    *   *Constraint:* `@@unique([userId, dayOfWeek])`

*   **UserTargetExam:**
    *   `id` (String, PK, cuid)
    *   `userId` (String, FK → User)
    *   `examId` (String, FK → Exam)
    *   *Constraint:* `@@unique([userId, examId])`

*   **Exam:**
    *   `id` (String, PK, cuid)
    *   `name` (String)
    *   `slug` (String, Unique)
    *   *Relations:* `subjectWeights` → ExamSubjectWeight[], `userTargetExams` → UserTargetExam[], `questions` → Question[], `mockExamAttempts` → MockExamAttempt[]

*   **Subject:**
    *   `id` (String, PK, cuid)
    *   `name` (String)
    *   `slug` (String, Unique)
    *   *Relations:* `examWeights` → ExamSubjectWeight[], `userDifficulties` → UserDifficulty[], `studyTasks` → StudyTask[], `questions` → Question[]

*   **ExamSubjectWeight:**
    *   `id` (String, PK, cuid)
    *   `examId` (String, FK → Exam)
    *   `subjectId` (String, FK → Subject)
    *   `weightMultiplier` (Float)
    *   *Constraint:* `@@unique([examId, subjectId])`

*   **UserDifficulty:**
    *   `id` (String, PK, cuid)
    *   `userId` (String, FK → User)
    *   `subjectId` (String, FK → Subject)
    *   `level` (Int — 0-100)
    *   *Constraint:* `@@unique([userId, subjectId])`

*   **StudyTask:**
    *   `id` (String, PK, cuid)
    *   `userId` (String, FK → User)
    *   `subjectId` (String, FK → Subject)
    *   `title` (String)
    *   `scheduledDate` (DateTime — date only)
    *   `isCompleted` (Boolean, Default: `false`)

*   **Question:**
    *   `id` (String, PK, cuid)
    *   `examId` (String, FK → Exam)
    *   `subjectId` (String, FK → Subject)
    *   `contentHtml` (String)
    *   `optionsJson` (Json)
    *   `correctOptionIndex` (Int)
    *   `imageUrl` (String, Optional — URL to Supabase Storage)

*   **MockExamAttempt:**
    *   `id` (String, PK, cuid)
    *   `userId` (String, FK → User)
    *   `examId` (String, FK → Exam)
    *   `startedAt` (DateTime)
    *   `completedAt` (DateTime, Optional)
    *   `score` (Int, Optional)

*   **QuestionResponse:**
    *   `id` (String, PK, cuid)
    *   `attemptId` (String, FK → MockExamAttempt)
    *   `questionId` (String, FK → Question)
    *   `selectedOptionIndex` (Int)
    *   `classification` (Enum Classification)

---

## 6. Implementation Milestones & Tasks

### Milestone 1: Initialization & Tooling
- [x] Use the existing Git repository on the `webfront` branch for the user's fork workflow.
- [x] Create `pnpm-workspace.yaml` and initialize Turborepo (`turbo.json`).
- [x] Create `packages/core` with a basic `package.json` and `tsconfig.json`.
- [x] Initialize Next.js App Router inside `apps/web` (TypeScript, Tailwind included).
- [x] Install and configure `shadcn/ui` in `apps/web` (configure `components.json`).
- [x] Add basic `shadcn/ui` components needed for setup (Button, Input, Form, Card).
- [x] Link `packages/core` as a dependency inside `apps/web`'s `package.json`.

### Milestone 2: Supabase Database & Clerk Auth Setup
- [x] Create a Supabase project and map the PostgreSQL connection strings to `.env` in `apps/web`.
- [x] Install Prisma in `apps/web` and configure `schema.prisma` using the Data Schema from Section 5.
- [x] Run the initial database migration (`prisma migrate deploy`) to Supabase.
- [x] Install `@clerk/nextjs` and `svix` (for webhook verification) in `apps/web`.
- [x] Configure `proxy.ts` using `clerkMiddleware()` to protect all `/app` routes except public SEO pages and webhooks. (Next.js 16 replacement for `middleware.ts`.)
- [x] Build the `/sign-in` and `/sign-up` routing using Clerk's pre-built components.
- [x] Create a webhook Route Handler (`POST /api/webhooks/clerk`) that listens for Clerk's `user.created` event, verifies the signature using Svix through Clerk's verification helper, and creates a new `User` record in the Supabase database using Prisma.
- [x] Enable RLS on the existing public tables and verify the Supabase security advisor.

### Milestone 3: Onboarding & Dashboard Foundation
- [ ] Define Zod schemas in `packages/core/schemas/onboarding.ts` (target exams array, per-day availability, 0-100 difficulty ratings, study objective, distribution style).
- [ ] Build the multi-step Onboarding UI in `apps/web/src/app/onboarding` using React Hook Form + `shadcn/ui`.
- [ ] Create a Server Action (`apps/web/src/actions/onboarding.ts`) to validate and save Onboarding data (`UserDifficulty`, `UserAvailability`, `UserTargetExam`, profile fields) to the DB, and set `onboardingCompleted = true`.
- [ ] Build the basic Student Dashboard UI (`/dashboard`) showing a placeholder for today's tasks and overall profile data.

### Milestone 4: The Scheduling Algorithm (Core Engine)
- [ ] Seed the DB with mock data for Exams (e.g., "ENEM"), Subjects (e.g., "Math", "History"), and ExamSubjectWeights.
- [ ] Create a Node.js Server Action: `generateWeeklySchedule(userId)`.
- [ ] Implement the logic: Calculate task distribution using `(UserDifficulty.level * ExamSubjectWeight.weightMultiplier)`. Distribute tasks across a 7-day period respecting each day's `UserAvailability.hours` and the user's `DistributionStyle`.
- [ ] Save the generated schedule as `StudyTask` rows in the database.
- [ ] Update the Dashboard UI to fetch and display `StudyTask` rows where `scheduledDate == today`.
- [ ] Implement a checkbox interaction on the Dashboard to toggle a task's `isCompleted` status in the DB via a Server Action.

### Milestone 5: Question Bank & Mock Exams (The Core USP)
- [ ] Seed the DB with a small set of mock `Question` data (including JSON options and correct indices).
- [ ] Build the Question Bank UI (`/questions`): A table/list of questions filterable by Subject and Exam.
- [ ] Build the Pre-Exam Screen (`/simulados`): Select an exam to start, creating a `MockExamAttempt` in the DB with `startedAt`.
- [ ] Build the Timed Exam UI: Renders questions sequentially or in a grid, tracks selected options in local state, and includes a countdown timer.
- [ ] Build the Exam Submission Server Action: Evaluates selected options against `correctOptionIndex`, calculates `score`, and saves `QuestionResponse` rows.
- [ ] **Build the 4-Step Correction Flow UI**: Forces the user to review every answered question and select the `classification` Enum (`CORRECT`, `LUCKY_GUESS`, `ATTENTION_MISTAKE`, `INCORRECT`).
- [ ] Build the Post-Exam Performance Report UI: Displays pie charts/stats of the 4-step classification.

### Milestone 6: SEO & Polish
- [ ] Create programmatic Server Components for SEO: `/vestibulares/[examSlug]` and `/materias/[subjectSlug]`.
- [ ] Implement Next.js `generateMetadata` for dynamic page titles and descriptions based on the database (e.g., "Study for ENEM: Weights and Questions").
- [ ] Inject valid Schema.org `JSON-LD` (`EducationalApplication`, `FAQPage`) into the `<head>` of public programmatic pages.
- [ ] Final UI Polish: Ensure responsive design works flawlessly on mobile viewports for the Dashboard and Exam interfaces.
- [ ] Perform a full end-to-end test of the user journey (Sign up → Onboard → Generate Schedule → Complete Task → Take Mock Exam → Classify Mistakes).
```
