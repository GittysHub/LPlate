"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const sb = createSupabaseBrowser();

  useEffect(() => {
    (async () => {
      // On this page, supabase-js will detect the tokens in the URL hash
      // (because we enabled detectSessionInUrl: true in the client).
      // Give it a tick to process, then read the user.
      const { data: { user } } = await sb.auth.getUser();

      if (user?.id && user.email) {
        // Check if user already has a profile
        const { data: existingProfile } = await sb
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        // If no existing profile, create one
        if (!existingProfile) {
          await sb.from("profiles").insert({
            id: user.id,
            role: roleParam || "learner", // Use role from sign-up or default to learner
            name: user.email.split("@")[0],
            email: user.email,
          });
        } else {
          // Update email if it's different (in case user changed email)
          await sb.from("profiles").update({
            email: user.email,
          }).eq("id", user.id);
        }
      }

      // Go home
      router.replace("/");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-md mx-auto p-6">
      <p>Signing you in…</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="max-w-md mx-auto p-6">
        <p>Signing you in…</p>
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
