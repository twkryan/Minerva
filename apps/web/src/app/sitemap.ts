import type { MetadataRoute } from "next";

import { getPrisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [exams, subjects] = await Promise.all([
    getPrisma().exam.findMany({ select: { slug: true } }),
    getPrisma().subject.findMany({ select: { slug: true } }),
  ]);
  const generatedAt = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...exams.map((exam) => ({
      url: absoluteUrl(`/vestibulares/${exam.slug}`),
      lastModified: generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...subjects.map((subject) => ({
      url: absoluteUrl(`/materias/${subject.slug}`),
      lastModified: generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
