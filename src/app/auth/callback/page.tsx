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
      try {
        // On this page, supabase-js will detect the tokens in the URL hash
        // (because we enabled detectSessionInUrl: true in the client).
        // Give it a tick to process, then read the user.
        const { data: { user }, error: userError } = await sb.auth.getUser();

        if (userError) {
          console.error("Auth error:", userError);
          router.replace("/sign-in?error=auth_failed");
          return;
        }

        if (user?.id && user.email) {
          // Check if user already has a profile
          const { data: existingProfile, error: profileError } = await sb
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Profile error:", profileError);
            router.replace("/sign-in?error=profile_failed");
            return;
          }

          // If no existing profile, create one
          if (!existingProfile) {
            const { error: insertError } = await (sb.from("profiles") as any).insert({
              id: user.id,
              role: (roleParam || "learner") as "learner" | "instructor",
              name: user.email.split("@")[0],
              email: user.email,
            });

            if (insertError) {
              console.error("Insert profile error:", insertError);
              router.replace("/sign-in?error=profile_creation_failed");
              return;
            }
          } else {
            // Update email if it's different (in case user changed email)
            const { error: updateError } = await (sb.from("profiles") as any).update({
              email: user.email,
            }).eq("id", user.id);

            if (updateError) {
              console.error("Update profile error:", updateError);
              // Don't redirect on update error, just log it
            }
          }
        }

        // Go home
        router.replace("/");
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        router.replace("/sign-in?error=unexpected");
      }
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
