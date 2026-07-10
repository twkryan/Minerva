"use client";

import {
  DAY_OF_WEEK_OPTIONS,
  DISTRIBUTION_STYLE_OPTIONS,
  STUDY_OBJECTIVE_OPTIONS,
} from "@minerva/core/constants/onboarding";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@minerva/core/schemas/onboarding";
import { Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";

import { saveOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatalogOption = {
  id: string;
  name: string;
};

type OnboardingFormProps = {
  exams: CatalogOption[];
  subjects: CatalogOption[];
  initialValues: OnboardingInput;
};

const STEP_FIELDS: FieldPath<OnboardingInput>[][] = [
  ["targetExamIds", "studyObjective", "targetMajor", "distributionStyle"],
  ["availability"],
  ["difficulties"],
];

const STEPS = [
  { title: "Objetivo", description: "Vestibulares e preferências" },
  { title: "Tempo", description: "Disponibilidade semanal" },
  { title: "Matérias", description: "Nível de dificuldade" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function OnboardingForm({
  exams,
  subjects,
  initialValues,
}: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<OnboardingInput>({
    defaultValues: initialValues,
    mode: "onTouched",
  });

  const selectedExamIds =
    useWatch({ control: form.control, name: "targetExamIds" }) ?? [];
  const availability =
    useWatch({ control: form.control, name: "availability" }) ?? [];
  const difficulties =
    useWatch({ control: form.control, name: "difficulties" }) ?? [];
  const studyObjective = useWatch({
    control: form.control,
    name: "studyObjective",
  });
  const distributionStyle = useWatch({
    control: form.control,
    name: "distributionStyle",
  });

  function toggleExam(examId: string) {
    const nextExamIds = selectedExamIds.includes(examId)
      ? selectedExamIds.filter((id) => id !== examId)
      : [...selectedExamIds, examId];

    form.setValue("targetExamIds", nextExamIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function validateFields(fields: FieldPath<OnboardingInput>[]) {
    const result = onboardingSchema.safeParse(form.getValues());

    form.clearErrors(fields);

    if (result.success) {
      return true;
    }

    let hasError = false;

    for (const issue of result.error.issues) {
      const fieldName = issue.path[0];

      if (
        typeof fieldName === "string" &&
        fields.includes(fieldName as FieldPath<OnboardingInput>)
      ) {
        form.setError(fieldName as FieldPath<OnboardingInput>, {
          type: "manual",
          message: issue.message,
        });
        hasError = true;
      }
    }

    return !hasError;
  }

  function goToNextStep() {
    const isValid = validateFields(STEP_FIELDS[step]);

    if (isValid) {
      setStep((currentStep) => Math.min(currentStep + 1, STEPS.length - 1));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateFields(STEP_FIELDS.flat())) {
      return;
    }

    setSubmitError(null);
    const values = form.getValues();

    startTransition(async () => {
      const result = await saveOnboarding(values);

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <section className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Minerva</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Monte seu plano inicial
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Estas informações orientam a sua rotina de estudos.
            </p>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Etapa {step + 1} de {STEPS.length}
          </p>
        </header>

        <div
          aria-label="Progresso do onboarding"
          aria-valuemax={STEPS.length}
          aria-valuemin={1}
          aria-valuenow={step + 1}
          className="mb-6 h-1.5 overflow-hidden rounded-full bg-border"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <form noValidate onSubmit={submit}>
          <Card>
            <CardHeader>
              <CardTitle>{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {step === 0 ? (
                <>
                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-medium">
                      Quais vestibulares você quer prestar?
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {exams.map((exam) => {
                        const isSelected = selectedExamIds.includes(exam.id);

                        return (
                          <label
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/60"
                            )}
                            key={exam.id}
                          >
                            <span className="font-medium">{exam.name}</span>
                            <input
                              checked={isSelected}
                              className="size-4 accent-primary"
                              onChange={() => toggleExam(exam.id)}
                              type="checkbox"
                            />
                          </label>
                        );
                      })}
                    </div>
                    {form.formState.errors.targetExamIds?.message ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.targetExamIds.message}
                      </p>
                    ) : null}
                  </fieldset>

                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-medium">Seu objetivo</legend>
                    <div className="grid gap-2">
                      {STUDY_OBJECTIVE_OPTIONS.map((option) => {
                        const isSelected = studyObjective === option.value;

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
                              className="mt-0.5 size-4 accent-primary"
                              onChange={() =>
                                form.setValue("studyObjective", option.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              type="radio"
                            />
                            <span>
                              <span className="block text-sm font-medium">
                                {option.label}
                              </span>
                              <span className="mt-0.5 block text-sm text-muted-foreground">
                                {option.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <label className="grid gap-2 text-sm font-medium">
                    Curso desejado <span className="font-normal text-muted-foreground">(opcional)</span>
                    <Input
                      maxLength={120}
                      placeholder="Ex.: Engenharia de Software"
                      {...form.register("targetMajor")}
                    />
                  </label>

                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-medium">
                      Como você prefere distribuir seus estudos?
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {DISTRIBUTION_STYLE_OPTIONS.map((option) => {
                        const isSelected = distributionStyle === option.value;

                        return (
                          <label
                            className={cn(
                              "flex cursor-pointer gap-2 rounded-lg border p-3 transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/60"
                            )}
                            key={option.value}
                          >
                            <input
                              checked={isSelected}
                              className="mt-0.5 size-4 shrink-0 accent-primary"
                              onChange={() =>
                                form.setValue("distributionStyle", option.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              type="radio"
                            />
                            <span>
                              <span className="block text-sm font-medium">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </>
              ) : null}

              {step === 1 ? (
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-medium">
                    Quantas horas você pode estudar por dia?
                  </legend>
                  <p className="-mt-1 text-sm text-muted-foreground">
                    Use zero nos dias em que você não estuda.
                  </p>
                  <div className="divide-y rounded-lg border">
                    {DAY_OF_WEEK_OPTIONS.map((day, index) => {
                      const entry = availability[index];

                      return (
                        <label
                          className="flex items-center justify-between gap-4 px-3 py-3"
                          key={day.value}
                        >
                          <span className="text-sm font-medium">{day.label}</span>
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Input
                              aria-label={`Horas disponíveis na ${day.label}`}
                              className="w-20 text-right"
                              max={24}
                              min={0}
                              onChange={(event) =>
                                form.setValue(
                                  `availability.${index}.hours`,
                                  clamp(Number(event.target.value) || 0, 0, 24),
                                  { shouldDirty: true, shouldValidate: true }
                                )
                              }
                              type="number"
                              value={entry?.hours ?? 0}
                            />
                            horas
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {form.formState.errors.availability?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.availability.message}
                    </p>
                  ) : null}
                </fieldset>
              ) : null}

              {step === 2 ? (
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-medium">
                    Como você avalia sua dificuldade em cada matéria?
                  </legend>
                  <p className="-mt-1 text-sm text-muted-foreground">
                    0 significa muita segurança; 100 indica a maior prioridade.
                  </p>
                  <div className="grid gap-4">
                    {subjects.map((subject, index) => {
                      const entry = difficulties[index];
                      const level = entry?.level ?? 50;

                      return (
                        <div className="grid gap-2" key={subject.id}>
                          <div className="flex items-center justify-between gap-3">
                            <label
                              className="text-sm font-medium"
                              htmlFor={`difficulty-${subject.id}`}
                            >
                              {subject.name}
                            </label>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Input
                                aria-label={`Dificuldade em ${subject.name}`}
                                className="w-16 text-right"
                                max={100}
                                min={0}
                                onChange={(event) =>
                                  form.setValue(
                                    `difficulties.${index}.level`,
                                    clamp(Number(event.target.value) || 0, 0, 100),
                                    { shouldDirty: true, shouldValidate: true }
                                  )
                                }
                                type="number"
                                value={level}
                              />
                              <span>/ 100</span>
                            </span>
                          </div>
                          <input
                            className="h-2 w-full cursor-pointer accent-primary"
                            id={`difficulty-${subject.id}`}
                            max={100}
                            min={0}
                            onChange={(event) =>
                              form.setValue(
                                `difficulties.${index}.level`,
                                Number(event.target.value),
                                { shouldDirty: true, shouldValidate: true }
                              )
                            }
                            type="range"
                            value={level}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {form.formState.errors.difficulties?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.difficulties.message}
                    </p>
                  ) : null}
                </fieldset>
              ) : null}

              {submitError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              ) : null}
            </CardContent>

            <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3 sm:px-6">
              <Button
                disabled={step === 0 || isPending}
                onClick={() => setStep((currentStep) => currentStep - 1)}
                type="button"
                variant="ghost"
              >
                <ChevronLeft data-icon="inline-start" />
                Voltar
              </Button>

              {step < STEPS.length - 1 ? (
                <Button onClick={goToNextStep} type="button">
                  Continuar
                  <ChevronRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button disabled={isPending} type="submit">
                  {isPending ? (
                    <LoaderCircle className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Check data-icon="inline-start" />
                  )}
                  Salvar e ir ao painel
                </Button>
              )}
            </div>
          </Card>
        </form>
      </section>
    </main>
  );
}
