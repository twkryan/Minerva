"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  CircleCheckBig,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  generateWeeklySchedule,
  updateStudyTaskCompletion,
} from "@/actions/schedule";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TodayTask = {
  id: string;
  isCompleted: boolean;
  subjectName: string;
  title: string;
};

type TodayTasksProps = {
  tasks: TodayTask[];
  userId: string;
};

type StatusMessage = {
  kind: "error" | "success";
  text: string;
};

export function TodayTasks({ tasks, userId }: TodayTasksProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  function refreshAfter(result: { success: boolean; message?: string }) {
    if (!result.success) {
      setStatus({
        kind: "error",
        text: result.message ?? "Não foi possível atualizar a agenda.",
      });
      return;
    }

    router.refresh();
  }

  function handleGenerateSchedule() {
    setStatus(null);

    startTransition(async () => {
      const result = await generateWeeklySchedule(userId);

      if (!result.success) {
        setStatus({ kind: "error", text: result.message });
        return;
      }

      setStatus({
        kind: "success",
        text: `${result.taskCount} blocos foram distribuídos para os próximos sete dias.`,
      });
      router.refresh();
    });
  }

  function handleTaskToggle(task: TodayTask) {
    setStatus(null);

    startTransition(async () => {
      const result = await updateStudyTaskCompletion(task.id, !task.isCompleted);
      refreshAfter(result);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Hoje</CardTitle>
            <CardDescription>
              {tasks.length
                ? `${completedTasks} de ${tasks.length} blocos concluídos`
                : "Gere sua agenda para começar"}
            </CardDescription>
          </div>
          <Button
            disabled={isPending}
            onClick={handleGenerateSchedule}
            size="sm"
            type="button"
            variant={tasks.length ? "outline" : "default"}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            {tasks.length ? "Gerar novamente" : "Gerar agenda"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {tasks.length ? (
          <>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progresso do dia</span>
                <span>{progress}%</span>
              </div>
              <div
                aria-label="Progresso das tarefas de hoje"
                aria-valuemax={tasks.length}
                aria-valuemin={0}
                aria-valuenow={completedTasks}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="divide-y rounded-lg border">
              {tasks.map((task) => (
                <label
                  className="flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50"
                  key={task.id}
                >
                  <input
                    checked={task.isCompleted}
                    className="size-4 shrink-0 accent-primary"
                    disabled={isPending}
                    onChange={() => handleTaskToggle(task)}
                    type="checkbox"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        task.isCompleted
                          ? "block text-sm text-muted-foreground line-through"
                          : "block text-sm font-medium"
                      }
                    >
                      {task.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {task.subjectName}
                    </span>
                  </span>
                  {task.isCompleted ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : null}
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 text-center">
            <CircleCheckBig className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhuma tarefa para hoje.</p>
            <p className="text-sm text-muted-foreground">
              A agenda considera suas horas disponíveis e matérias prioritárias.
            </p>
          </div>
        )}

        {status ? (
          <p
            className={
              status.kind === "error"
                ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                : "rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary"
            }
          >
            {status.text}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
