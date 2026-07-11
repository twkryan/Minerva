import { auth } from "@clerk/nextjs/server";
import { MOCK_EXAM_DURATION_MINUTES } from "@minerva/core/constants/mock-exam";
import { notFound, redirect } from "next/navigation";

import { ExamRunner } from "@/app/simulados/[attemptId]/_components/exam-runner";
import { getQuestionOptions } from "@/lib/mock-exam";
import { getPrisma } from "@/lib/prisma";

type MockExamPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function MockExamPage({ params }: MockExamPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { attemptId } = await params;
  const attempt = await getPrisma().mockExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: {
              subject: { select: { name: true } },
            },
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) {
    notFound();
  }

  if (attempt.completedAt) {
    redirect(`/simulados/${attempt.id}/relatorio`);
  }

  if (attempt.score !== null) {
    redirect(`/simulados/${attempt.id}/correcao`);
  }

  const questions = attempt.exam.questions.map((question) => ({
    id: question.id,
    content: question.contentHtml,
    options: getQuestionOptions(question.optionsJson),
    subjectName: question.subject.name,
  }));

  if (!questions.length || questions.some((question) => !question.options.length)) {
    notFound();
  }

  return (
    <ExamRunner
      attemptId={attempt.id}
      durationMinutes={MOCK_EXAM_DURATION_MINUTES}
      examName={attempt.exam.name}
      questions={questions}
      startedAt={attempt.startedAt.toISOString()}
    />
  );
}
