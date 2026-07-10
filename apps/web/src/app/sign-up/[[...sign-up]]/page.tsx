import { SignUp } from "@clerk/nextjs";

import { AuthConfigurationRequired } from "@/components/auth-configuration-required";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <AuthConfigurationRequired mode="sign-up" />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <SignUp fallbackRedirectUrl="/app" signInUrl="/sign-in" />
    </main>
  );
}
