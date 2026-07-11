import { auth } from "@clerk/nextjs/server";
import { CLASSIFICATION_OPTIONS } from "@minerva/core/constants/mock-exam";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ClassificationPieChart } from "@/app/simulados/[attemptId]/relatorio/_components/classification-pie-chart";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";

type ReportPageProps = {
  params: Promise<{ attemptId: string }>;
};

const CLASSIFICATION_COLORS = {
  CORRECT: "#16a34a",
  LUCKY_GUESS: "#2563eb",
  ATTENTION_MISTAKE: "#d97706",
  INCORRECT: "#dc2626",
} as const;

export default async function MockExamReportPage({ params }: ReportPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { attemptId } = await params;
  const attempt = await getPrisma().mockExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { select: { name: true } },
      responses: {
        include: {
          question: {
            include: { subject: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) {
    notFound();
  }

  if (!attempt.completedAt) {
    redirect(`/simulados/${attempt.id}/correcao`);
  }

  const classificationCounts = Object.fromEntries(
    CLASSIFICATION_OPTIONS.map((option) => [option.value, 0])
  ) as Record<(typeof CLASSIFICATION_OPTIONS)[number]["value"], number>;

  for (const response of attempt.responses) {
    classificationCounts[response.classification] += 1;
  }

  const totalQuestions = attempt.responses.length;
  const score = attempt.score ?? 0;
  const scorePercentage = totalQuestions
    ? Math.round((score / totalQuestions) * 100)
    : 0;
  const segments = CLASSIFICATION_OPTIONS.map((option) => ({
    color: CLASSIFICATION_COLORS[option.value],
    label: option.label,
    value: classificationCounts[option.value],
  }));
  const subjectPerformance = [...attempt.responses].reduce<
    Record<string, { correct: number; total: number }>
  >((performance, response) => {
    const subjectName = response.question.subject.name;
    const current = performance[subjectName] ?? { correct: 0, total: 0 };

    performance[subjectName] = {
      correct:
        current.correct +
        (response.selectedOptionIndex === response.question.correctOptionIndex ? 1 : 0),
      total: current.total + 1,
    };

    return performance;
  }, {});

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Relatório do simulado</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{attempt.exam.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Resultado consolidado após sua revisão de cada questão.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/simulados">
            Novo simulado
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Acertos</CardDescription>
              <CardTitle className="text-3xl">{score}/{totalQuestions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Aproveitamento</CardDescription>
              <CardTitle className="text-3xl">{scorePercentage}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Questões revisadas</CardDescription>
              <CardTitle className="text-3xl">{totalQuestions}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Classificação das respostas</CardTitle>
              <CardDescription>O que cada resposta revelou sobre sua preparação.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <ClassificationPieChart segments={segments} />
              <div className="grid gap-2">
                {segments.map((segment) => (
                  <div className="flex items-center justify-between gap-3 text-sm" key={segment.label}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      {segment.label}
                    </span>
                    <span className="font-medium">{segment.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desempenho por matéria</CardTitle>
              <CardDescription>Use estes dados para orientar a próxima revisão.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {Object.entries(subjectPerformance).map(([subjectName, performance]) => {
                const percentage = Math.round(
                  (performance.correct / performance.total) * 100
                );

                return (
                  <div className="grid gap-1.5" key={subjectName}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{subjectName}</span>
                      <span className="text-muted-foreground">
                        {performance.correct}/{performance.total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
