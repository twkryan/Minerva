import { z } from "zod";

import {
  DAY_OF_WEEK_VALUES,
  DISTRIBUTION_STYLE_VALUES,
  STUDY_OBJECTIVE_VALUES,
} from "../constants/onboarding";

export const dayOfWeekSchema = z.enum(DAY_OF_WEEK_VALUES);
export const studyObjectiveSchema = z.enum(STUDY_OBJECTIVE_VALUES);
export const distributionStyleSchema = z.enum(DISTRIBUTION_STYLE_VALUES);

const availabilitySchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  hours: z.number().int().min(0).max(24),
});

const difficultySchema = z.object({
  subjectId: z.string().min(1),
  level: z.number().int().min(0).max(100),
});

export const onboardingSchema = z
  .object({
    targetExamIds: z
      .array(z.string().min(1))
      .min(1, "Selecione pelo menos um vestibular."),
    availability: z
      .array(availabilitySchema)
      .length(7, "Informe sua disponibilidade para todos os dias."),
    difficulties: z
      .array(difficultySchema)
      .min(1, "Informe pelo menos uma dificuldade."),
    studyObjective: studyObjectiveSchema,
    targetMajor: z.string().trim().max(120).optional().or(z.literal("")),
    distributionStyle: distributionStyleSchema,
  })
  .superRefine((data, context) => {
    if (new Set(data.targetExamIds).size !== data.targetExamIds.length) {
      context.addIssue({
        code: "custom",
        path: ["targetExamIds"],
        message: "Cada vestibular pode ser selecionado apenas uma vez.",
      });
    }

    const availabilityDays = data.availability.map((item) => item.dayOfWeek);

    if (new Set(availabilityDays).size !== availabilityDays.length) {
      context.addIssue({
        code: "custom",
        path: ["availability"],
        message: "Cada dia da semana deve aparecer uma única vez.",
      });
    }

    const difficultySubjects = data.difficulties.map((item) => item.subjectId);

    if (new Set(difficultySubjects).size !== difficultySubjects.length) {
      context.addIssue({
        code: "custom",
        path: ["difficulties"],
        message: "Cada matéria deve aparecer uma única vez.",
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
