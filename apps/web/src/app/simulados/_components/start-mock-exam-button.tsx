"use client";

import { LoaderCircle, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startMockExam } from "@/actions/mock-exam";
import { Button } from "@/components/ui/button";

type StartMockExamButtonProps = {
  examId: string;
};

export function StartMockExamButton({ examId }: StartMockExamButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    setError(null);

    startTransition(async () => {
      const result = await startMockExam(examId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push(`/simulados/${result.attemptId}`);
    });
  }

  return (
    <div className="grid gap-2">
      <Button disabled={isPending} onClick={handleStart} type="button">
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <Play data-icon="inline-start" />
        )}
        Iniciar simulado
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
