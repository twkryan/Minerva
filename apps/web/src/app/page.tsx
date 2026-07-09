import { PRODUCT_NAME } from "@minerva/core";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const setupItems = [
  "Next.js App Router",
  "Tailwind CSS v4",
  "shadcn/ui base",
  "@minerva/core workspace",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Front-end de teste
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight">
                {PRODUCT_NAME}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Base web inicial para validar onboarding, dashboard e simulados
                nas próximas milestones.
              </p>
            </div>
            <Button type="button">Setup pronto</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Status da Milestone 1</CardTitle>
              <CardDescription>
                Estrutura mínima do monorepo e UI configurada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {setupItems.map((item) => (
                  <div
                    className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teste rápido de UI</CardTitle>
              <CardDescription>
                Componentes shadcn básicos renderizando juntos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input placeholder="Nome preferido do aluno" />
              <Button type="button" variant="secondary">
                Simular entrada
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
