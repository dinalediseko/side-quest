"use client";

import ProfileChip from "@/components/auth/ProfileChip";

import PersonalBests from "@/components/profile/PersonalBests";

import BackButton from "@/components/ui/BackButton";

export default function ProfilePage() {
  return (
    <main className="min-h-screen px-8 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] space-y-8">
      <BackButton />
      <h1
        className="
pixel
text-3xl
"
      >
        Profile
      </h1>

      <ProfileChip />

      <PersonalBests />
    </main>
  );
}
