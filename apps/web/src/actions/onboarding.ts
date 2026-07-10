"use server";

import { auth } from "@clerk/nextjs/server";
import { onboardingSchema } from "@minerva/core/schemas/onboarding";
import { revalidatePath } from "next/cache";

import { getPrisma } from "@/lib/prisma";

export type OnboardingActionResult =
  | { success: true }
  | { success: false; message: string };

export async function saveOnboarding(
  rawInput: unknown
): Promise<OnboardingActionResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const parsedInput = onboardingSchema.safeParse(rawInput);

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Revise os dados do onboarding e tente novamente.",
    };
  }

  const input = parsedInput.data;
  const examIds = [...new Set(input.targetExamIds)];
  const subjectIds = [...new Set(input.difficulties.map((item) => item.subjectId))];
  const prisma = getPrisma();

  const [examCount, subjectCount] = await Promise.all([
    prisma.exam.count({ where: { id: { in: examIds } } }),
    prisma.subject.count({ where: { id: { in: subjectIds } } }),
  ]);

  if (examCount !== examIds.length || subjectCount !== subjectIds.length) {
    return {
      success: false,
      message: "Alguns vestibulares ou matérias não estão mais disponíveis.",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          studyObjective: input.studyObjective,
          targetMajor: input.targetMajor || null,
          aiDistributionStyle: input.distributionStyle,
          onboardingCompleted: true,
        },
        update: {
          studyObjective: input.studyObjective,
          targetMajor: input.targetMajor || null,
          aiDistributionStyle: input.distributionStyle,
          onboardingCompleted: true,
        },
      });

      await Promise.all([
        transaction.userAvailability.deleteMany({ where: { userId } }),
        transaction.userTargetExam.deleteMany({ where: { userId } }),
        transaction.userDifficulty.deleteMany({ where: { userId } }),
      ]);

      await Promise.all([
        transaction.userAvailability.createMany({
          data: input.availability.map((item) => ({
            userId,
            dayOfWeek: item.dayOfWeek,
            hours: item.hours,
          })),
        }),
        transaction.userTargetExam.createMany({
          data: examIds.map((examId) => ({ userId, examId })),
        }),
        transaction.userDifficulty.createMany({
          data: input.difficulties.map((item) => ({
            userId,
            subjectId: item.subjectId,
            level: item.level,
          })),
        }),
      ]);
    });
  } catch (error) {
    console.error("Unable to save onboarding data.", error);

    return {
      success: false,
      message: "Não foi possível salvar seu onboarding. Tente novamente.",
    };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");

  return { success: true };
}
