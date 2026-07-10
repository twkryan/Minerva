"use server";

import { auth } from "@clerk/nextjs/server";
import {
  generateWeeklyStudyTasks,
  type ScheduleSubject,
} from "@minerva/core/scheduling/weekly-schedule";
import { revalidatePath } from "next/cache";

import { getPrisma } from "@/lib/prisma";
import { addUtcDays, getSaoPauloDateStart } from "@/lib/schedule-date";

export type ScheduleActionResult =
  | { success: true; taskCount: number }
  | { success: false; message: string };

export type StudyTaskActionResult =
  | { success: true }
  | { success: false; message: string };

export async function generateWeeklySchedule(
  requestedUserId: string
): Promise<ScheduleActionResult> {
  const { userId } = await auth();

  if (!userId || userId !== requestedUserId) {
    return {
      success: false,
      message: "Sua sessão não permite gerar esta agenda.",
    };
  }

  const prisma = getPrisma();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        availability: true,
        difficulties: {
          include: { subject: true },
        },
        targetExams: {
          include: {
            exam: {
              include: {
                subjectWeights: {
                  include: { subject: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.onboardingCompleted) {
      return {
        success: false,
        message: "Conclua o onboarding antes de gerar a agenda.",
      };
    }

    const totalAvailableHours = user.availability.reduce(
      (total, item) => total + item.hours,
      0
    );

    if (totalAvailableHours === 0) {
      return {
        success: false,
        message: "Informe ao menos uma hora disponível no onboarding.",
      };
    }

    const weightsBySubject = new Map<
      string,
      { subjectName: string; weightMultiplier: number }
    >();

    for (const { exam } of user.targetExams) {
      for (const weight of exam.subjectWeights) {
        const currentWeight = weightsBySubject.get(weight.subjectId);

        weightsBySubject.set(weight.subjectId, {
          subjectName: weight.subject.name,
          weightMultiplier:
            (currentWeight?.weightMultiplier ?? 0) + weight.weightMultiplier,
        });
      }
    }

    const subjects: ScheduleSubject[] = user.difficulties.flatMap(
      (difficulty) => {
        const weight = weightsBySubject.get(difficulty.subjectId);

        if (!weight) {
          return [];
        }

        return [
          {
            subjectId: difficulty.subjectId,
            subjectName: weight.subjectName,
            difficultyLevel: difficulty.level,
            weightMultiplier: weight.weightMultiplier,
          },
        ];
      }
    );

    if (subjects.length === 0) {
      return {
        success: false,
        message:
          "Não há pesos de matérias para os vestibulares selecionados ainda.",
      };
    }

    const weekStart = getSaoPauloDateStart();
    const weekEnd = addUtcDays(weekStart, 7);
    const tasks = generateWeeklyStudyTasks({
      startDate: weekStart,
      availability: user.availability,
      distributionStyle: user.aiDistributionStyle,
      subjects,
    });

    if (tasks.length === 0) {
      return {
        success: false,
        message: "Não foi possível distribuir tarefas para a sua agenda.",
      };
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.studyTask.deleteMany({
        where: {
          userId,
          scheduledDate: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });

      await transaction.studyTask.createMany({
        data: tasks.map((task) => ({
          userId,
          subjectId: task.subjectId,
          title: task.title,
          scheduledDate: task.scheduledDate,
        })),
      });
    });

    revalidatePath("/dashboard");

    return { success: true, taskCount: tasks.length };
  } catch (error) {
    console.error("Unable to generate weekly schedule.", error);

    return {
      success: false,
      message: "Não foi possível gerar sua agenda. Tente novamente.",
    };
  }
}

export async function updateStudyTaskCompletion(
  taskId: string,
  isCompleted: boolean
): Promise<StudyTaskActionResult> {
  const { userId } = await auth();

  if (!userId || !taskId || typeof isCompleted !== "boolean") {
    return {
      success: false,
      message: "Não foi possível atualizar esta tarefa.",
    };
  }

  try {
    const result = await getPrisma().studyTask.updateMany({
      where: {
        id: taskId,
        userId,
      },
      data: { isCompleted },
    });

    if (result.count === 0) {
      return {
        success: false,
        message: "Esta tarefa não está disponível para a sua conta.",
      };
    }
  } catch (error) {
    console.error("Unable to update study task.", error);

    return {
      success: false,
      message: "Não foi possível atualizar a tarefa. Tente novamente.",
    };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
