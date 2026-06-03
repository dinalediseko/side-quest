import SignupForm from "@/components/auth/SignupForm";

import BackButton from "@/components/ui/BackButton";

export default function SignupPage() {
  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <BackButton />
      <SignupForm />
    </main>
  );
}
