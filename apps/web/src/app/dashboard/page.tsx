import { auth } from "@clerk/nextjs/server";
import {
  DAY_OF_WEEK_OPTIONS,
  DISTRIBUTION_STYLE_OPTIONS,
  STUDY_OBJECTIVE_OPTIONS,
} from "@minerva/core/constants/onboarding";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TodayTasks } from "@/app/dashboard/_components/today-tasks";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";
import { addUtcDays, getSaoPauloDateStart } from "@/lib/schedule-date";

function formatHours(hours: number) {
  return `${hours} ${hours === 1 ? "hora" : "horas"}`;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const today = getSaoPauloDateStart();
  const tomorrow = addUtcDays(today, 1);

  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    include: {
      availability: true,
      difficulties: {
        include: { subject: true },
      },
      targetExams: {
        include: { exam: true },
      },
      studyTasks: {
        where: {
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          subject: {
            select: { name: true },
          },
        },
        orderBy: [{ isCompleted: "asc" }, { title: "asc" }],
      },
    },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const availabilityByDay = new Map(
    user.availability.map((item) => [item.dayOfWeek, item.hours])
  );
  const totalWeeklyHours = user.availability.reduce(
    (total, item) => total + item.hours,
    0
  );
  const objectiveLabel =
    STUDY_OBJECTIVE_OPTIONS.find((option) => option.value === user.studyObjective)
      ?.label ?? "Objetivo não definido";
  const distributionLabel =
    DISTRIBUTION_STYLE_OPTIONS.find(
      (option) => option.value === user.aiDistributionStyle
    )?.label ?? "Equilibrado";
  const prioritySubjects = [...user.difficulties]
    .sort((first, second) => second.level - first.level)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Minerva</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Olá{user.preferredName ? `, ${user.preferredName}` : ""}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Seu painel de estudo está pronto para receber a primeira agenda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href="/simulados">
              Simulados
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/onboarding">
              Editar preferências
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
          <TodayTasks
            tasks={user.studyTasks.map((task) => ({
              id: task.id,
              isCompleted: task.isCompleted,
              subjectName: task.subject.name,
              title: task.title,
            }))}
            userId={user.id}
          />

          <Card>
            <CardHeader>
              <CardTitle>Ritmo semanal</CardTitle>
              <CardDescription>Tempo disponível informado no onboarding.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-1">
              <p className="text-3xl font-semibold">{formatHours(totalWeeklyHours)}</p>
              <p className="text-sm text-muted-foreground">por semana</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Seu perfil</CardTitle>
              <CardDescription>{objectiveLabel}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Vestibulares
                </span>
                <div className="flex flex-wrap gap-2">
                  {user.targetExams.map(({ exam }) => (
                    <span
                      className="rounded-md border bg-muted px-2 py-1 text-sm"
                      key={exam.id}
                    >
                      {exam.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Curso desejado
                </span>
                <p className="text-sm">{user.targetMajor ?? "Não informado"}</p>
              </div>
              <div className="grid gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Estilo de distribuição
                </span>
                <p className="text-sm">{distributionLabel}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilidade</CardTitle>
              <CardDescription>Horas reservadas por dia.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {DAY_OF_WEEK_OPTIONS.map((day) => (
                <div className="grid gap-0.5" key={day.value}>
                  <span className="text-sm font-medium">{day.shortLabel}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatHours(availabilityByDay.get(day.value) ?? 0)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matérias prioritárias</CardTitle>
            <CardDescription>Baseado na dificuldade que você informou.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {prioritySubjects.map(({ subject, level }) => (
              <div className="grid gap-2 rounded-lg border p-3" key={subject.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-sm text-muted-foreground">{level}/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${level}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
