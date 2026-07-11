import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type QuestionsPageProps = {
  searchParams: Promise<{
    exam?: string;
    subject?: string;
  }>;
};

export default async function QuestionsPage({
  searchParams,
}: QuestionsPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { exam: selectedExamId, subject: selectedSubjectId } = await searchParams;
  const prisma = getPrisma();
  const [exams, subjects, questions] = await Promise.all([
    prisma.exam.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.question.findMany({
      where: {
        ...(selectedExamId ? { examId: selectedExamId } : {}),
        ...(selectedSubjectId ? { subjectId: selectedSubjectId } : {}),
      },
      include: {
        exam: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: [{ exam: { name: "asc" } }, { subject: { name: "asc" } }],
    }),
  ]);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Minerva</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Banco de questões
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Explore as questões disponíveis antes de iniciar um simulado.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/simulados">
            Ir para simulados
          </Link>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Combine vestibular e matéria para refinar a lista.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" method="get">
              <label className="grid gap-1.5 text-sm font-medium">
                Vestibular
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={selectedExamId ?? ""}
                  name="exam"
                >
                  <option value="">Todos</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Matéria
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={selectedSubjectId ?? ""}
                  name="subject"
                >
                  <option value="">Todas</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button className="self-end" type="submit">
                Filtrar
              </Button>
              <Link
                className={cn(buttonVariants({ variant: "ghost" }), "self-end")}
                href="/questions"
              >
                Limpar
              </Link>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{questions.length} questões encontradas</CardTitle>
            <CardDescription>
              As alternativas corretas só são reveladas no fluxo de correção.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length ? (
              <div className="divide-y rounded-lg border">
                {questions.map((question) => (
                  <article className="grid gap-2 px-4 py-4" key={question.id}>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md border bg-muted px-2 py-1">
                        {question.exam.name}
                      </span>
                      <span className="rounded-md border bg-muted px-2 py-1">
                        {question.subject.name}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{question.contentHtml}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma questão corresponde aos filtros selecionados.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
