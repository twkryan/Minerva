BEGIN;

DO $$
BEGIN
  IF to_regclass('public."User"') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'User'
         AND column_name = 'clerkUserId'
     ) THEN
    ALTER TABLE "User" RENAME TO "_LegacyUser";
    ALTER TABLE "_LegacyUser" RENAME CONSTRAINT "User_pkey" TO "_LegacyUser_pkey";
  ELSIF to_regclass('public."User"') IS NOT NULL THEN
    RAISE EXCEPTION 'A non-legacy User table already exists';
  ELSE
    CREATE TABLE "_LegacyUser" (
      "id" TEXT NOT NULL,
      "clerkUserId" TEXT NOT NULL,
      "preferredName" TEXT NOT NULL,
      "hoursPerDay" JSONB NOT NULL,
      "studyObjectives" TEXT[] NOT NULL,
      "studyDifficulties" JSONB NOT NULL,
      "targetMajor" TEXT NOT NULL,
      "aiDistributionStyle" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "_LegacyUser_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

CREATE TYPE "Classification" AS ENUM (
  'CORRECT',
  'LUCKY_GUESS',
  'ATTENTION_MISTAKE',
  'INCORRECT'
);

CREATE TYPE "StudyObjective" AS ENUM (
  'PASS_THE_VESTIBULAR',
  'IMPROVE_GRADES',
  'REVIEW_CONTENT'
);

CREATE TYPE "DistributionStyle" AS ENUM (
  'BALANCED',
  'FOCUSED',
  'INTENSIVE'
);

CREATE TYPE "DayOfWeek" AS ENUM (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "preferredName" TEXT,
  "studyObjective" "StudyObjective",
  "targetMajor" TEXT,
  "aiDistributionStyle" "DistributionStyle" NOT NULL DEFAULT 'BALANCED',
  "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAvailability" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "hours" INTEGER NOT NULL,
  CONSTRAINT "UserAvailability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserAvailability_hours_check" CHECK ("hours" BETWEEN 0 AND 24)
);

CREATE TABLE "UserTargetExam" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  CONSTRAINT "UserTargetExam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Exam" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSubjectWeight" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "weightMultiplier" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "ExamSubjectWeight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserDifficulty" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  CONSTRAINT "UserDifficulty_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserDifficulty_level_check" CHECK ("level" BETWEEN 0 AND 100)
);

CREATE TABLE "StudyTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledDate" DATE NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "contentHtml" TEXT NOT NULL,
  "optionsJson" JSONB NOT NULL,
  "correctOptionIndex" INTEGER NOT NULL,
  "imageUrl" TEXT,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MockExamAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "score" INTEGER,
  CONSTRAINT "MockExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionResponse" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionIndex" INTEGER NOT NULL,
  "classification" "Classification" NOT NULL,
  CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAvailability_userId_dayOfWeek_key"
  ON "UserAvailability"("userId", "dayOfWeek");
CREATE UNIQUE INDEX "UserTargetExam_userId_examId_key"
  ON "UserTargetExam"("userId", "examId");
CREATE UNIQUE INDEX "Exam_slug_key" ON "Exam"("slug");
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");
CREATE UNIQUE INDEX "ExamSubjectWeight_examId_subjectId_key"
  ON "ExamSubjectWeight"("examId", "subjectId");
CREATE UNIQUE INDEX "UserDifficulty_userId_subjectId_key"
  ON "UserDifficulty"("userId", "subjectId");
CREATE INDEX "StudyTask_userId_scheduledDate_idx"
  ON "StudyTask"("userId", "scheduledDate");
CREATE UNIQUE INDEX "QuestionResponse_attemptId_questionId_key"
  ON "QuestionResponse"("attemptId", "questionId");

ALTER TABLE "UserAvailability"
  ADD CONSTRAINT "UserAvailability_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTargetExam"
  ADD CONSTRAINT "UserTargetExam_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTargetExam"
  ADD CONSTRAINT "UserTargetExam_examId_fkey"
  FOREIGN KEY ("examId") REFERENCES "Exam"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamSubjectWeight"
  ADD CONSTRAINT "ExamSubjectWeight_examId_fkey"
  FOREIGN KEY ("examId") REFERENCES "Exam"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamSubjectWeight"
  ADD CONSTRAINT "ExamSubjectWeight_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDifficulty"
  ADD CONSTRAINT "UserDifficulty_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDifficulty"
  ADD CONSTRAINT "UserDifficulty_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyTask"
  ADD CONSTRAINT "StudyTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyTask"
  ADD CONSTRAINT "StudyTask_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_examId_fkey"
  FOREIGN KEY ("examId") REFERENCES "Exam"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockExamAttempt"
  ADD CONSTRAINT "MockExamAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockExamAttempt"
  ADD CONSTRAINT "MockExamAttempt_examId_fkey"
  FOREIGN KEY ("examId") REFERENCES "Exam"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionResponse"
  ADD CONSTRAINT "QuestionResponse_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "MockExamAttempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionResponse"
  ADD CONSTRAINT "QuestionResponse_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "User" (
  "id",
  "preferredName",
  "targetMajor",
  "aiDistributionStyle",
  "onboardingCompleted",
  "createdAt"
)
SELECT
  "clerkUserId",
  NULLIF("preferredName", ''),
  NULLIF("targetMajor", ''),
  CASE lower(trim("aiDistributionStyle"))
    WHEN 'focado e direto' THEN 'FOCUSED'::"DistributionStyle"
    WHEN 'focused' THEN 'FOCUSED'::"DistributionStyle"
    WHEN 'intensivo' THEN 'INTENSIVE'::"DistributionStyle"
    WHEN 'intensive' THEN 'INTENSIVE'::"DistributionStyle"
    ELSE 'BALANCED'::"DistributionStyle"
  END,
  true,
  "createdAt"
FROM "_LegacyUser";

INSERT INTO "Exam" ("id", "name", "slug")
SELECT
  gen_random_uuid()::text,
  exam_name,
  trim(both '-' from lower(regexp_replace(exam_name, '[^a-zA-Z0-9]+', '-', 'g')))
FROM (
  SELECT DISTINCT unnest("studyObjectives") AS exam_name
  FROM "_LegacyUser"
) AS legacy_exams;

INSERT INTO "Subject" ("id", "name", "slug")
SELECT
  gen_random_uuid()::text,
  subject_name,
  trim(both '-' from lower(regexp_replace(subject_name, '[^a-zA-Z0-9]+', '-', 'g')))
FROM (
  SELECT DISTINCT jsonb_object_keys("studyDifficulties") AS subject_name
  FROM "_LegacyUser"
) AS legacy_subjects;

WITH normalized_availability AS (
  SELECT
    legacy."clerkUserId" AS user_id,
    day_entry.value::integer AS hours,
    CASE lower(day_entry.key)
      WHEN 'monday' THEN 'MONDAY'
      WHEN 'tuesday' THEN 'TUESDAY'
      WHEN 'wednesday' THEN 'WEDNESDAY'
      WHEN 'thursday' THEN 'THURSDAY'
      WHEN 'friday' THEN 'FRIDAY'
      WHEN 'saturday' THEN 'SATURDAY'
      WHEN 'sunday' THEN 'SUNDAY'
      WHEN 'segunda' THEN 'MONDAY'
      WHEN 'segunda-feira' THEN 'MONDAY'
      WHEN 'terca' THEN 'TUESDAY'
      WHEN 'terca-feira' THEN 'TUESDAY'
      WHEN 'quarta' THEN 'WEDNESDAY'
      WHEN 'quarta-feira' THEN 'WEDNESDAY'
      WHEN 'quinta' THEN 'THURSDAY'
      WHEN 'quinta-feira' THEN 'THURSDAY'
      WHEN 'sexta' THEN 'FRIDAY'
      WHEN 'sexta-feira' THEN 'FRIDAY'
      WHEN 'sabado' THEN 'SATURDAY'
      WHEN 'domingo' THEN 'SUNDAY'
    END AS day_of_week
  FROM "_LegacyUser" AS legacy
  CROSS JOIN LATERAL jsonb_each_text(legacy."hoursPerDay") AS day_entry
)
INSERT INTO "UserAvailability" ("id", "userId", "dayOfWeek", "hours")
SELECT
  gen_random_uuid()::text,
  user_id,
  day_of_week::"DayOfWeek",
  LEAST(24, GREATEST(0, hours))
FROM normalized_availability
WHERE day_of_week IS NOT NULL;

INSERT INTO "UserTargetExam" ("id", "userId", "examId")
SELECT
  gen_random_uuid()::text,
  legacy."clerkUserId",
  exam."id"
FROM "_LegacyUser" AS legacy
CROSS JOIN LATERAL unnest(legacy."studyObjectives") AS objective(exam_name)
JOIN "Exam" AS exam
  ON exam."slug" = trim(
    both '-'
    from lower(regexp_replace(objective.exam_name, '[^a-zA-Z0-9]+', '-', 'g'))
  );

INSERT INTO "UserDifficulty" ("id", "userId", "subjectId", "level")
SELECT
  gen_random_uuid()::text,
  legacy."clerkUserId",
  subject."id",
  LEAST(100, GREATEST(0, difficulty.value::integer))
FROM "_LegacyUser" AS legacy
CROSS JOIN LATERAL jsonb_each_text(legacy."studyDifficulties") AS difficulty
JOIN "Subject" AS subject
  ON subject."slug" = trim(
    both '-'
    from lower(regexp_replace(difficulty.key, '[^a-zA-Z0-9]+', '-', 'g'))
  );

DO $$
DECLARE
  legacy_count INTEGER;
  normalized_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO legacy_count FROM "_LegacyUser";
  SELECT COUNT(*) INTO normalized_count FROM "User";

  IF legacy_count <> normalized_count THEN
    RAISE EXCEPTION 'User migration count mismatch: legacy %, normalized %',
      legacy_count,
      normalized_count;
  END IF;
END $$;

DROP TABLE "_LegacyUser";

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAvailability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserTargetExam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExamSubjectWeight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserDifficulty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MockExamAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuestionResponse" ENABLE ROW LEVEL SECURITY;

COMMIT;
