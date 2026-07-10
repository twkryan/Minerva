type AuthConfigurationRequiredProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthConfigurationRequired({
  mode,
}: AuthConfigurationRequiredProps) {
  const title = mode === "sign-in" ? "Entrar" : "Criar conta";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-xl font-semibold">{title} indisponivel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure as chaves do Clerk em <code>.env.local</code> para ativar a
          autenticacao.
        </p>
      </div>
    </main>
  );
}
