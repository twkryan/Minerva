"use client";

import {
  CLASSIFICATION_OPTIONS,
  CLASSIFICATION_VALUES,
} from "@minerva/core/constants/mock-exam";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { completeMockExamCorrection } from "@/actions/mock-exam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ClassificationValue = (typeof CLASSIFICATION_VALUES)[number];

type CorrectionResponse = {
  correctOptionIndex: number;
  options: string[];
  questionId: string;
  questionText: string;
  selectedOptionIndex: number;
  subjectName: string;
};

type CorrectionFlowProps = {
  attemptId: string;
  responses: CorrectionResponse[];
};

function answerText(options: string[], optionIndex: number) {
  return optionIndex >= 0 ? options[optionIndex] ?? "Resposta indisponível" : "Não respondida";
}

export function CorrectionFlow({ attemptId, responses }: CorrectionFlowProps) {
  const router = useRouter();
  const [classifications, setClassifications] = useState<
    Record<string, ClassificationValue>
  >({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const classifiedCount = Object.keys(classifications).length;
  const isComplete = classifiedCount === responses.length;

  function selectClassification(
    questionId: string,
    classification: ClassificationValue
  ) {
    setClassifications((currentClassifications) => ({
      ...currentClassifications,
      [questionId]: classification,
    }));
  }

  function handleComplete() {
    if (!isComplete) {
      setError("Classifique todas as questões para concluir a correção.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await completeMockExamCorrection({
        attemptId,
        classifications: responses.map((response) => ({
          questionId: response.questionId,
          classification: classifications[response.questionId],
        })),
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push(`/simulados/${attemptId}/relatorio`);
    });
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Correção em 4 etapas</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Revise cada decisão
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A classificação transforma o resultado em prioridades de estudo mais úteis.
            </p>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {classifiedCount} de {responses.length} classificadas
          </p>
        </header>

        <div
          aria-label="Progresso da correção"
          aria-valuemax={responses.length}
          aria-valuemin={0}
          aria-valuenow={classifiedCount}
          className="h-1.5 overflow-hidden rounded-full bg-border"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${(classifiedCount / responses.length) * 100}%` }}
          />
        </div>

        <div className="grid gap-4">
          {responses.map((response, index) => (
            <Card key={response.questionId}>
              <CardHeader>
                <CardTitle>Questão {index + 1}</CardTitle>
                <CardDescription>{response.subjectName}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <p className="text-sm font-medium leading-6">{response.questionText}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <span className="block text-xs font-medium uppercase text-muted-foreground">
                      Sua resposta
                    </span>
                    <p className="mt-1">{answerText(response.options, response.selectedOptionIndex)}</p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                    <span className="block text-xs font-medium uppercase text-muted-foreground">
                      Resposta correta
                    </span>
                    <p className="mt-1">{answerText(response.options, response.correctOptionIndex)}</p>
                  </div>
                </div>

                <fieldset className="grid gap-2">
                  <legend className="text-sm font-medium">Como você classifica esta resposta?</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CLASSIFICATION_OPTIONS.map((option) => {
                      const isSelected =
                        classifications[response.questionId] === option.value;

                      return (
                        <label
                          className={cn(
                            "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/60"
                          )}
                          key={option.value}
                        >
                          <input
                            checked={isSelected}
                            className="mt-0.5 size-4 shrink-0 accent-primary"
                            disabled={isPending}
                            name={`classification-${response.questionId}`}
                            onChange={() =>
                              selectClassification(response.questionId, option.value)
                            }
                            type="radio"
                          />
                          <span>
                            <span className="block text-sm font-medium">{option.label}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-start gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          {error ? <p className="text-sm text-destructive">{error}</p> : <span />}
          <Button disabled={!isComplete || isPending} onClick={handleComplete} type="button">
            {isPending ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Check data-icon="inline-start" />
            )}
            Concluir correção
          </Button>
        </div>
      </section>
    </main>
  );
}
