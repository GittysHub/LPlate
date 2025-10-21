"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { absUrl } from "@/lib/baseUrl";

// Prevent prerender errors
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const sb = createSupabaseBrowser();

  useEffect(() => {
    (async () => {
      try {
        console.log('[AUTH] Starting callback processing...');
        
        // On this page, supabase-js will detect the tokens in the URL hash
        // (because we enabled detectSessionInUrl: true in the client).
        // Give it a tick to process, then read the user.
        const { data: { user }, error: userError } = await sb.auth.getUser();

        if (userError) {
          console.error('[AUTH] Auth error:', userError);
          router.replace("/sign-in?error=auth_failed");
          return;
        }

        if (!user?.id || !user.email) {
          console.error('[AUTH] No user or missing user data:', { user });
          router.replace("/sign-in?error=no_user");
          return;
        }

        console.log('[AUTH] User authenticated:', { id: user.id, email: user.email });

        // Check if user already has a profile
        const { data: existingProfile, error: profileError } = await sb
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[AUTH] Profile error:', profileError);
          router.replace("/sign-in?error=profile_failed");
          return;
        }

        // If no existing profile, create one
        if (!existingProfile) {
          console.log('[AUTH] Creating new profile for user:', user.id);
          const { error: insertError } = await (sb.from("profiles") as any).insert({
            id: user.id,
            role: (roleParam || "learner") as "learner" | "instructor",
            name: user.email.split("@")[0],
            email: user.email,
          });

          if (insertError) {
            console.error('[AUTH] Insert profile error:', insertError);
            router.replace("/sign-in?error=profile_creation_failed");
            return;
          }
          console.log('[AUTH] Profile created successfully');
        } else {
          console.log('[AUTH] Profile exists, updating email if needed');
          // Update email if it's different (in case user changed email)
          const { error: updateError } = await (sb.from("profiles") as any).update({
            email: user.email,
          }).eq("id", user.id);

          if (updateError) {
            console.error('[AUTH] Update profile error:', updateError);
            // Don't redirect on update error, just log it
          }
        }

        console.log('[AUTH] Callback processing complete, redirecting to profile setup');
        console.log('[AUTH] Role param:', roleParam);
        
        // Small delay to ensure profile creation is complete before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Always redirect new users to profile setup - let the profile page handle the completion check
        if (roleParam === "instructor") {
          console.log('[AUTH] Redirecting to instructor profile');
          console.log('[AUTH] About to call router.replace("/instructor/profile")');
          router.replace("/instructor/profile");
          console.log('[AUTH] router.replace called for instructor');
        } else {
          console.log('[AUTH] Redirecting to learner profile');
          console.log('[AUTH] About to call router.replace("/learner/profile")');
          router.replace("/learner/profile");
          console.log('[AUTH] router.replace called for learner');
        }
      } catch (error) {
        console.error('[AUTH] Unexpected error in auth callback:', error);
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
