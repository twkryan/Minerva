BEGIN;

INSERT INTO "Exam" ("id", "name", "slug")
SELECT 'seed_exam_enem', 'ENEM', 'enem'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Exam"
  WHERE "slug" = 'enem' OR "name" = 'ENEM'
);

INSERT INTO "Exam" ("id", "name", "slug")
SELECT 'seed_exam_fuvest', 'FUVEST', 'fuvest'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Exam"
  WHERE "slug" = 'fuvest' OR "name" = 'FUVEST'
);

INSERT INTO "Subject" ("id", "name", "slug")
SELECT 'seed_subject_math', 'Math', 'math'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Subject"
  WHERE "slug" = 'math' OR "name" = 'Math'
);

INSERT INTO "Subject" ("id", "name", "slug")
SELECT 'seed_subject_history', 'History', 'history'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Subject"
  WHERE "slug" = 'history' OR "name" = 'History'
);

INSERT INTO "Subject" ("id", "name", "slug")
SELECT 'seed_subject_physics', 'Physics', 'physics'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Subject"
  WHERE "slug" = 'physics' OR "name" = 'Physics'
);

WITH weights (exam_slug, exam_name, subject_slug, subject_name, multiplier) AS (
  VALUES
    ('enem', 'ENEM', 'math', 'Math', 1.2::double precision),
    ('enem', 'ENEM', 'history', 'History', 0.9::double precision),
    ('enem', 'ENEM', 'physics', 'Physics', 1.1::double precision),
    ('fuvest', 'FUVEST', 'math', 'Math', 1.3::double precision),
    ('fuvest', 'FUVEST', 'history', 'History', 1.0::double precision),
    ('fuvest', 'FUVEST', 'physics', 'Physics', 1.2::double precision)
)
INSERT INTO "ExamSubjectWeight" (
  "id",
  "examId",
  "subjectId",
  "weightMultiplier"
)
SELECT
  concat('seed_weight_', weights.exam_slug, '_', weights.subject_slug),
  exam."id",
  subject."id",
  weights.multiplier
FROM weights
JOIN "Exam" AS exam
  ON exam."slug" = weights.exam_slug OR exam."name" = weights.exam_name
JOIN "Subject" AS subject
  ON subject."slug" = weights.subject_slug OR subject."name" = weights.subject_name
ON CONFLICT ("examId", "subjectId")
DO UPDATE SET "weightMultiplier" = EXCLUDED."weightMultiplier";

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM "ExamSubjectWeight" AS weight
    JOIN "Exam" AS exam ON exam."id" = weight."examId"
    JOIN "Subject" AS subject ON subject."id" = weight."subjectId"
    WHERE exam."slug" IN ('enem', 'fuvest')
      AND subject."slug" IN ('math', 'history', 'physics')
  ) < 6 THEN
    RAISE EXCEPTION 'Seed did not establish the expected exam subject weights';
  END IF;
END $$;

WITH question_seed (
  id,
  exam_slug,
  subject_slug,
  content_html,
  options_json,
  correct_option_index
) AS (
  VALUES
    (
      'seed_question_enem_math_1',
      'enem',
      'math',
      'Quanto é 2 + 2?',
      '["3", "4", "5", "6"]'::jsonb,
      1
    ),
    (
      'seed_question_enem_history_1',
      'enem',
      'history',
      'Em que ano foi proclamada a Independência do Brasil?',
      '["1500", "1822", "1889", "1988"]'::jsonb,
      1
    ),
    (
      'seed_question_enem_physics_1',
      'enem',
      'physics',
      'Qual é a unidade de força no Sistema Internacional?',
      '["Joule", "Watt", "Newton", "Pascal"]'::jsonb,
      2
    ),
    (
      'seed_question_fuvest_math_1',
      'fuvest',
      'math',
      'Se 3x = 15, qual é o valor de x?',
      '["3", "5", "8", "12"]'::jsonb,
      1
    ),
    (
      'seed_question_fuvest_history_1',
      'fuvest',
      'history',
      'O Renascimento cultural europeu começou principalmente em qual região?',
      '["Península Ibérica", "Itália", "Escandinávia", "Rússia"]'::jsonb,
      1
    ),
    (
      'seed_question_fuvest_physics_1',
      'fuvest',
      'physics',
      'Qual grandeza resulta da divisão entre deslocamento e intervalo de tempo?',
      '["Aceleração", "Velocidade média", "Força", "Energia"]'::jsonb,
      1
    )
)
INSERT INTO "Question" (
  "id",
  "examId",
  "subjectId",
  "contentHtml",
  "optionsJson",
  "correctOptionIndex"
)
SELECT
  question_seed.id,
  exam."id",
  subject."id",
  question_seed.content_html,
  question_seed.options_json,
  question_seed.correct_option_index
FROM question_seed
JOIN "Exam" AS exam ON exam."slug" = question_seed.exam_slug
JOIN "Subject" AS subject ON subject."slug" = question_seed.subject_slug
ON CONFLICT ("id")
DO UPDATE SET
  "contentHtml" = EXCLUDED."contentHtml",
  "optionsJson" = EXCLUDED."optionsJson",
  "correctOptionIndex" = EXCLUDED."correctOptionIndex";

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "Question" WHERE "id" LIKE 'seed_question_%') < 6 THEN
    RAISE EXCEPTION 'Seed did not establish the expected mock questions';
  END IF;
END $$;

COMMIT;
