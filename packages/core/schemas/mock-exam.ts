import { z } from "zod";

import { CLASSIFICATION_VALUES } from "../constants/mock-exam";

export const questionAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIndex: z.number().int().min(-1),
});

export const submitMockExamSchema = z
  .object({
    attemptId: z.string().min(1),
    responses: z.array(questionAnswerSchema),
  })
  .superRefine((data, context) => {
    const questionIds = data.responses.map((response) => response.questionId);

    if (new Set(questionIds).size !== questionIds.length) {
      context.addIssue({
        code: "custom",
        path: ["responses"],
        message: "Cada questão pode ter apenas uma resposta.",
      });
    }
  });

export const questionClassificationSchema = z.object({
  questionId: z.string().min(1),
  classification: z.enum(CLASSIFICATION_VALUES),
});

export const completeCorrectionSchema = z
  .object({
    attemptId: z.string().min(1),
    classifications: z.array(questionClassificationSchema).min(1),
  })
  .superRefine((data, context) => {
    const questionIds = data.classifications.map(
      (classification) => classification.questionId
    );

    if (new Set(questionIds).size !== questionIds.length) {
      context.addIssue({
        code: "custom",
        path: ["classifications"],
        message: "Cada questão deve receber apenas uma classificação.",
      });
    }
  });

export type SubmitMockExamInput = z.infer<typeof submitMockExamSchema>;
export type CompleteCorrectionInput = z.infer<typeof completeCorrectionSchema>;
