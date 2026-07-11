import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { CorrectionFlow } from "@/app/simulados/[attemptId]/correcao/_components/correction-flow";
import { getQuestionOptions } from "@/lib/mock-exam";
import { getPrisma } from "@/lib/prisma";

type CorrectionPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function CorrectionPage({ params }: CorrectionPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { attemptId } = await params;
  const attempt = await getPrisma().mockExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: {
            include: {
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { questionId: "asc" },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) {
    notFound();
  }

  if (attempt.completedAt) {
    redirect(`/simulados/${attempt.id}/relatorio`);
  }

  if (attempt.score === null || attempt.responses.length === 0) {
    redirect(`/simulados/${attempt.id}`);
  }

  const responses = attempt.responses.map((response) => ({
    correctOptionIndex: response.question.correctOptionIndex,
    options: getQuestionOptions(response.question.optionsJson),
    questionId: response.questionId,
    questionText: response.question.contentHtml,
    selectedOptionIndex: response.selectedOptionIndex,
    subjectName: response.question.subject.name,
  }));

  if (responses.some((response) => !response.options.length)) {
    notFound();
  }

  return <CorrectionFlow attemptId={attempt.id} responses={responses} />;
}
