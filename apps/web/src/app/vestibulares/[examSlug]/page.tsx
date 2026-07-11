import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { JsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

type ExamPageProps = {
  params: Promise<{ examSlug: string }>;
};

const getExam = cache((slug: string) =>
  getPrisma().exam.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { questions: true },
      },
      subjectWeights: {
        include: {
          subject: {
            select: { name: true, slug: true },
          },
        },
        orderBy: { weightMultiplier: "desc" },
      },
    },
  })
);

export async function generateStaticParams() {
  const exams = await getPrisma().exam.findMany({ select: { slug: true } });

  return exams.map((exam) => ({ examSlug: exam.slug }));
}

export async function generateMetadata({ params }: ExamPageProps): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = await getExam(examSlug);

  if (!exam) {
    return { title: "Vestibular não encontrado" };
  }

  const description = `Estude para o ${exam.name} com matérias prioritárias, questões e simulados personalizados na Minerva.`;

  return {
    title: `Estude para ${exam.name}`,
    description,
    alternates: {
      canonical: `/vestibulares/${exam.slug}`,
    },
    openGraph: {
      type: "website",
      title: `Estude para ${exam.name} | Minerva`,
      description,
      url: `/vestibulares/${exam.slug}`,
    },
  };
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { examSlug } = await params;
  const exam = await getExam(examSlug);

  if (!exam) {
    notFound();
  }

  const description = `Prepare-se para o ${exam.name} com uma rotina orientada por peso das matérias e pelas suas dificuldades.`;
  const faqs = [
    {
      question: `Como estudar para o ${exam.name}?`,
      answer:
        "Combine uma rotina semanal realista com prática de questões e revisão dos assuntos em que você encontra mais dificuldade.",
    },
    {
      question: `A Minerva oferece questões do ${exam.name}?`,
      answer: `Sim. O banco atual possui ${exam._count.questions} questão(ões) vinculada(s) ao ${exam.name} e pode crescer com novos conteúdos.`,
    },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalApplication",
      name: `Minerva para ${exam.name}`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description,
      url: absoluteUrl(`/vestibulares/${exam.slug}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <JsonLd data={jsonLd} />
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="grid gap-4">
          <p className="text-sm font-medium text-muted-foreground">Minerva / Vestibulares</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold">{exam.name}</h1>
              <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
            </div>
            <Link className={buttonVariants()} href="/simulados">
              Fazer simulado
            </Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Questões disponíveis</CardDescription>
              <CardTitle className="text-3xl">{exam._count.questions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Matérias ponderadas</CardDescription>
              <CardTitle className="text-3xl">{exam.subjectWeights.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pesos por matéria</CardTitle>
            <CardDescription>
              Estes multiplicadores ajudam a orientar a distribuição da agenda semanal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exam.subjectWeights.map((weight) => (
              <Link
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
                href={`/materias/${weight.subject.slug}`}
                key={weight.subject.slug}
              >
                <span className="font-medium">{weight.subject.name}</span>
                <span className="text-sm text-muted-foreground">
                  {weight.weightMultiplier.toFixed(1)}x
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <section aria-labelledby="exam-faq-title" className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold" id="exam-faq-title">
              Dúvidas sobre o {exam.name}
            </h2>
          </div>
          <div className="divide-y rounded-lg border bg-background">
            {faqs.map((faq) => (
              <details className="px-4 py-3" key={faq.question}>
                <summary className="cursor-pointer font-medium">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
