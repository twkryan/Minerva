import { auth } from "@clerk/nextjs/server";
import { DAY_OF_WEEK_OPTIONS } from "@minerva/core/constants/onboarding";
import type { OnboardingInput } from "@minerva/core/schemas/onboarding";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/onboarding/_components/onboarding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const prisma = getPrisma();
  const [user, exams, subjects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        availability: true,
        difficulties: true,
        targetExams: true,
      },
    }),
    prisma.exam.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (exams.length === 0 || subjects.length === 0) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:py-12">
        <Card className="mx-auto w-full max-w-xl">
          <CardHeader>
            <CardTitle>Catálogo em preparação</CardTitle>
            <CardDescription>
              Ainda faltam vestibulares ou matérias para montar seu plano.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Assim que o catálogo estiver disponível, o onboarding poderá ser concluído.
          </CardContent>
        </Card>
      </main>
    );
  }

  const availabilityByDay = new Map(
    user?.availability.map((item) => [item.dayOfWeek, item.hours])
  );
  const difficultyBySubject = new Map(
    user?.difficulties.map((item) => [item.subjectId, item.level])
  );

  const initialValues: OnboardingInput = {
    targetExamIds: user?.targetExams.map((item) => item.examId) ?? [],
    availability: DAY_OF_WEEK_OPTIONS.map((day) => ({
      dayOfWeek: day.value,
      hours: availabilityByDay.get(day.value) ?? 0,
    })),
    difficulties: subjects.map((subject) => ({
      subjectId: subject.id,
      level: difficultyBySubject.get(subject.id) ?? 50,
    })),
    studyObjective: user?.studyObjective ?? "PASS_THE_VESTIBULAR",
    targetMajor: user?.targetMajor ?? "",
    distributionStyle: user?.aiDistributionStyle ?? "BALANCED",
  };

  return (
    <OnboardingForm
      exams={exams}
      initialValues={initialValues}
      subjects={subjects}
    />
  );
}
