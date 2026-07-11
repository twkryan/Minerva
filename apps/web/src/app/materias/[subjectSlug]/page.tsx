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

type SubjectPageProps = {
  params: Promise<{ subjectSlug: string }>;
};

const getSubject = cache((slug: string) =>
  getPrisma().subject.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { questions: true },
      },
      examWeights: {
        include: {
          exam: {
            select: { name: true, slug: true },
          },
        },
        orderBy: { weightMultiplier: "desc" },
      },
    },
  })
);

export async function generateStaticParams() {
  const subjects = await getPrisma().subject.findMany({ select: { slug: true } });

  return subjects.map((subject) => ({ subjectSlug: subject.slug }));
}

export async function generateMetadata({
  params,
}: SubjectPageProps): Promise<Metadata> {
  const { subjectSlug } = await params;
  const subject = await getSubject(subjectSlug);

  if (!subject) {
    return { title: "Matéria não encontrada" };
  }

  const description = `Estude ${subject.name} para vestibulares com questões, pesos por prova e uma agenda personalizada na Minerva.`;

  return {
    title: `Estude ${subject.name}`,
    description,
    alternates: {
      canonical: `/materias/${subject.slug}`,
    },
    openGraph: {
      type: "website",
      title: `Estude ${subject.name} | Minerva`,
      description,
      url: `/materias/${subject.slug}`,
    },
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subjectSlug } = await params;
  const subject = await getSubject(subjectSlug);

  if (!subject) {
    notFound();
  }

  const description = `Pratique ${subject.name}, compare a relevância entre vestibulares e transforme dificuldades em uma rotina de estudo objetiva.`;
  const faqs = [
    {
      question: `Como melhorar em ${subject.name}?`,
      answer:
        "Alterne revisão conceitual e resolução de questões, registrando os erros para decidir o que precisa de mais tempo na semana seguinte.",
    },
    {
      question: `Em quais vestibulares ${subject.name} aparece na Minerva?`,
      answer: `${subject.name} possui pesos cadastrados em ${subject.examWeights.length} vestibular(es) no catálogo atual.`,
    },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalApplication",
      name: `Minerva para estudar ${subject.name}`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description,
      url: absoluteUrl(`/materias/${subject.slug}`),
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
          <p className="text-sm font-medium text-muted-foreground">Minerva / Matérias</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold">{subject.name}</h1>
              <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
            </div>
            <Link className={buttonVariants({ variant: "outline" })} href="/questions">
              Ver questões
            </Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Questões disponíveis</CardDescription>
              <CardTitle className="text-3xl">{subject._count.questions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Vestibulares relacionados</CardDescription>
              <CardTitle className="text-3xl">{subject.examWeights.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Relevância por vestibular</CardTitle>
            <CardDescription>
              Compare o multiplicador usado para priorizar esta matéria na agenda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subject.examWeights.map((weight) => (
              <Link
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
                href={`/vestibulares/${weight.exam.slug}`}
                key={weight.exam.slug}
              >
                <span className="font-medium">{weight.exam.name}</span>
                <span className="text-sm text-muted-foreground">
                  {weight.weightMultiplier.toFixed(1)}x
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <section aria-labelledby="subject-faq-title" className="grid gap-4">
          <h2 className="text-xl font-semibold" id="subject-faq-title">
            Dúvidas sobre {subject.name}
          </h2>
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
