import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StartMockExamButton } from "@/app/simulados/_components/start-mock-exam-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";

export default async function MockExamsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [user, exams] = await Promise.all([
    getPrisma().user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    }),
    getPrisma().exam.findMany({
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const availableExams = exams.filter((exam) => exam._count.questions > 0);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Minerva</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Simulados</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Escolha um vestibular, responda no tempo proposto e revise cada decisão.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/questions">
            Ver banco de questões
          </Link>
        </header>

        {availableExams.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {availableExams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.name}</CardTitle>
                  <CardDescription>
                    {exam._count.questions} questões disponíveis
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm text-muted-foreground">
                    Você terá um cronômetro e poderá revisar as respostas antes de enviar.
                  </p>
                  <StartMockExamButton examId={exam.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Questões em preparação</CardTitle>
              <CardDescription>
                Ainda não há simulados disponíveis para iniciar.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}
