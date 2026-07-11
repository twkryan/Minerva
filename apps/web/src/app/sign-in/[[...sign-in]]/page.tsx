import { SignIn } from "@clerk/nextjs";

import { AuthConfigurationRequired } from "@/components/auth-configuration-required";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <AuthConfigurationRequired mode="sign-in" />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
