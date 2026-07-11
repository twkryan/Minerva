"use server";

import { auth } from "@clerk/nextjs/server";
import {
  completeCorrectionSchema,
  submitMockExamSchema,
} from "@minerva/core/schemas/mock-exam";
import { revalidatePath } from "next/cache";

import type { Classification } from "@/generated/prisma/enums";
import { getPrisma } from "@/lib/prisma";

type ActionFailure = { success: false; message: string };

export type StartMockExamResult =
  | { success: true; attemptId: string }
  | ActionFailure;

export type SubmitMockExamResult =
  | { success: true; score: number; totalQuestions: number }
  | ActionFailure;

export type CompleteCorrectionResult = { success: true } | ActionFailure;

function isValidOptionIndex(optionIndex: number, options: unknown) {
  return (
    optionIndex === -1 ||
    (Array.isArray(options) && optionIndex >= 0 && optionIndex < options.length)
  );
}

export async function startMockExam(examId: string): Promise<StartMockExamResult> {
  const { userId } = await auth();

  if (!userId || !examId) {
    return {
      success: false,
      message: "Sua sessão não permite iniciar este simulado.",
    };
  }

  const prisma = getPrisma();

  try {
    const [user, exam] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { onboardingCompleted: true },
      }),
      prisma.exam.findUnique({
        where: { id: examId },
        select: {
          id: true,
          questions: {
            select: { id: true },
          },
        },
      }),
    ]);

    if (!user?.onboardingCompleted) {
      return {
        success: false,
        message: "Conclua o onboarding antes de iniciar um simulado.",
      };
    }

    if (!exam || exam.questions.length === 0) {
      return {
        success: false,
        message: "Este vestibular ainda não possui questões disponíveis.",
      };
    }

    const attempt = await prisma.mockExamAttempt.create({
      data: {
        userId,
        examId: exam.id,
        startedAt: new Date(),
      },
      select: { id: true },
    });

    return { success: true, attemptId: attempt.id };
  } catch (error) {
    console.error("Unable to start mock exam.", error);

    return {
      success: false,
      message: "Não foi possível iniciar o simulado. Tente novamente.",
    };
  }
}

export async function submitMockExam(
  rawInput: unknown
): Promise<SubmitMockExamResult> {
  const { userId } = await auth();
  const parsedInput = submitMockExamSchema.safeParse(rawInput);

  if (!userId || !parsedInput.success) {
    return {
      success: false,
      message: "Não foi possível enviar as respostas deste simulado.",
    };
  }

  const input = parsedInput.data;
  const prisma = getPrisma();

  try {
    const attempt = await prisma.mockExamAttempt.findUnique({
      where: { id: input.attemptId },
      include: {
        exam: {
          include: {
            questions: {
              select: {
                id: true,
                optionsJson: true,
                correctOptionIndex: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId || attempt.completedAt) {
      return {
        success: false,
        message: "Este simulado não está disponível para envio.",
      };
    }

    const questionIds = new Set(attempt.exam.questions.map((question) => question.id));
    const answersByQuestion = new Map(
      input.responses.map((response) => [
        response.questionId,
        response.selectedOptionIndex,
      ])
    );

    if (
      [...answersByQuestion.keys()].some(
        (questionId) => !questionIds.has(questionId)
      )
    ) {
      return {
        success: false,
        message: "Há respostas que não pertencem a este simulado.",
      };
    }

    const invalidAnswer = attempt.exam.questions.some((question) =>
      !isValidOptionIndex(
        answersByQuestion.get(question.id) ?? -1,
        question.optionsJson
      )
    );

    if (invalidAnswer) {
      return {
        success: false,
        message: "Uma ou mais respostas são inválidas para este simulado.",
      };
    }

    const responses: Array<{
      classification: Classification;
      questionId: string;
      selectedOptionIndex: number;
    }> = attempt.exam.questions.map((question) => {
      const selectedOptionIndex = answersByQuestion.get(question.id) ?? -1;

      return {
        questionId: question.id,
        selectedOptionIndex,
        classification:
          selectedOptionIndex === question.correctOptionIndex
            ? "CORRECT"
            : "INCORRECT",
      };
    });
    const score = responses.filter(
      (response) => response.classification === "CORRECT"
    ).length;

    await prisma.$transaction(async (transaction) => {
      await transaction.questionResponse.deleteMany({
        where: { attemptId: attempt.id },
      });
      await transaction.questionResponse.createMany({
        data: responses.map((response) => ({
          attemptId: attempt.id,
          ...response,
        })),
      });
      await transaction.mockExamAttempt.update({
        where: { id: attempt.id },
        data: { score },
      });
    });

    return {
      success: true,
      score,
      totalQuestions: responses.length,
    };
  } catch (error) {
    console.error("Unable to submit mock exam.", error);

    return {
      success: false,
      message: "Não foi possível corrigir o simulado. Tente novamente.",
    };
  }
}

export async function completeMockExamCorrection(
  rawInput: unknown
): Promise<CompleteCorrectionResult> {
  const { userId } = await auth();
  const parsedInput = completeCorrectionSchema.safeParse(rawInput);

  if (!userId || !parsedInput.success) {
    return {
      success: false,
      message: "Revise todas as classificações antes de concluir.",
    };
  }

  const input = parsedInput.data;
  const prisma = getPrisma();

  try {
    const attempt = await prisma.mockExamAttempt.findUnique({
      where: { id: input.attemptId },
      include: {
        responses: {
          select: { questionId: true },
        },
      },
    });

    if (!attempt || attempt.userId !== userId || attempt.completedAt) {
      return {
        success: false,
        message: "Esta correção não está disponível para a sua conta.",
      };
    }

    const responseQuestionIds = new Set(
      attempt.responses.map((response) => response.questionId)
    );
    const classificationQuestionIds = new Set(
      input.classifications.map((classification) => classification.questionId)
    );

    if (
      responseQuestionIds.size !== classificationQuestionIds.size ||
      [...classificationQuestionIds].some(
        (questionId) => !responseQuestionIds.has(questionId)
      )
    ) {
      return {
        success: false,
        message: "Todas as questões precisam receber uma classificação.",
      };
    }

    await prisma.$transaction(async (transaction) => {
      await Promise.all(
        input.classifications.map((classification) =>
          transaction.questionResponse.update({
            where: {
              attemptId_questionId: {
                attemptId: attempt.id,
                questionId: classification.questionId,
              },
            },
            data: { classification: classification.classification },
          })
        )
      );
      await transaction.mockExamAttempt.update({
        where: { id: attempt.id },
        data: { completedAt: new Date() },
      });
    });

    revalidatePath(`/simulados/${attempt.id}/relatorio`);

    return { success: true };
  } catch (error) {
    console.error("Unable to complete mock exam correction.", error);

    return {
      success: false,
      message: "Não foi possível concluir a correção. Tente novamente.",
    };
  }
}
