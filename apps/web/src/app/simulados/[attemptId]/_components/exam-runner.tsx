"use client";

import { ChevronLeft, ChevronRight, Clock3, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { submitMockExam } from "@/actions/mock-exam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ExamQuestion = {
  content: string;
  id: string;
  options: string[];
  subjectName: string;
};

type ExamRunnerProps = {
  attemptId: string;
  durationMinutes: number;
  examName: string;
  questions: ExamQuestion[];
  startedAt: string;
};

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function ExamRunner({
  attemptId,
  durationMinutes,
  examName,
  questions,
  startedAt,
}: ExamRunnerProps) {
  const router = useRouter();
  const deadline = useMemo(
    () => new Date(startedAt).getTime() + durationMinutes * 60 * 1000,
    [durationMinutes, startedAt]
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const currentQuestion = questions[currentQuestionIndex];
  const unansweredCount = questions.filter(
    (question) => answers[question.id] === undefined
  ).length;
  const isExpired = remainingSeconds === 0;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deadline]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitMockExam({
        attemptId,
        responses: questions
          .filter((question) => answers[question.id] !== undefined)
          .map((question) => ({
            questionId: question.id,
            selectedOptionIndex: answers[question.id],
          })),
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push(`/simulados/${attemptId}/correcao`);
    });
  }

  function goToNextQuestion(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setCurrentQuestionIndex((index) => index + 1);
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 text-foreground sm:px-6 lg:py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Simulado {examName}</p>
              <h1 className="mt-1 text-2xl font-semibold">Questão {currentQuestionIndex + 1}</h1>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums",
                isExpired ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-background"
              )}
            >
              <Clock3 className="size-4" />
              {formatRemainingTime(remainingSeconds)}
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{currentQuestion.subjectName}</CardTitle>
              <CardDescription>
                {isExpired
                  ? "O tempo encerrou. Envie as respostas para iniciar a correção."
                  : "Escolha uma alternativa para continuar."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <p className="text-base leading-7 font-medium">{currentQuestion.content}</p>
              <fieldset className="grid gap-2">
                <legend className="sr-only">Alternativas da questão atual</legend>
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = answers[currentQuestion.id] === optionIndex;

                  return (
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/60",
                        isExpired && "cursor-not-allowed opacity-60"
                      )}
                      key={option}
                    >
                      <input
                        checked={isSelected}
                        className="mt-0.5 size-4 accent-primary"
                        disabled={isExpired || isPending}
                        name={currentQuestion.id}
                        onChange={() =>
                          setAnswers((currentAnswers) => ({
                            ...currentAnswers,
                            [currentQuestion.id]: optionIndex,
                          }))
                        }
                        type="radio"
                      />
                      <span>
                        <span className="mr-2 font-medium">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {option}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button
              disabled={currentQuestionIndex === 0 || isPending}
              onClick={() => setCurrentQuestionIndex((index) => index - 1)}
              type="button"
              variant="ghost"
            >
              <ChevronLeft data-icon="inline-start" />
              Anterior
            </Button>
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                disabled={isPending}
                onClick={goToNextQuestion}
                type="button"
              >
                Próxima
                <ChevronRight data-icon="inline-end" />
              </Button>
            ) : (
              <Button disabled={isPending} type="submit">
                {isPending ? (
                  <LoaderCircle className="animate-spin" data-icon="inline-start" />
                ) : null}
                Enviar respostas
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {unansweredCount
              ? `${unansweredCount} questão(ões) em branco serão contabilizadas como não respondidas.`
              : "Todas as questões receberam uma resposta."}
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

        <aside className="h-fit lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Questões</CardTitle>
              <CardDescription>
                {questions.length - unansweredCount} respondidas de {questions.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-5 gap-2">
              {questions.map((question, index) => (
                <Button
                  aria-label={`Ir para a questão ${index + 1}`}
                  className={cn(
                    "px-0",
                    currentQuestionIndex === index && "ring-2 ring-ring ring-offset-2"
                  )}
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  size="sm"
                  type="button"
                  variant={answers[question.id] === undefined ? "outline" : "secondary"}
                >
                  {index + 1}
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
