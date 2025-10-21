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
          .single();

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

        console.log('[AUTH] Callback processing complete, checking profile completion');
        
        // Check if user needs to complete profile setup
        const { data: profileData } = await (sb.from("profiles") as any)
          .select("name, phone, postcode, avatar_url")
          .eq("id", user.id)
          .single();

        console.log('[AUTH] Profile data:', profileData);
        console.log('[AUTH] Role param:', roleParam);
        
        // If user is missing essential profile info, redirect to appropriate profile page
        // Check for meaningful profile completion (not just email-derived name)
        const hasCompleteProfile = profileData?.name && 
                                 profileData?.phone && 
                                 profileData?.postcode &&
                                 profileData?.name !== user.email.split("@")[0]; // Not just email-derived name

        console.log('[AUTH] Has complete profile:', hasCompleteProfile);
        console.log('[AUTH] Profile check details:', {
          hasName: !!profileData?.name,
          hasPhone: !!profileData?.phone,
          hasPostcode: !!profileData?.postcode,
          nameNotEmail: profileData?.name !== user.email.split("@")[0]
        });

        if (!hasCompleteProfile) {
          console.log('[AUTH] User needs to complete profile setup');
          // Redirect to role-specific profile page
          if (roleParam === "instructor") {
            console.log('[AUTH] Redirecting to instructor profile');
            router.replace("/instructor/profile");
          } else {
            console.log('[AUTH] Redirecting to learner profile');
            router.replace("/learner/profile");
          }
        } else {
          console.log('[AUTH] User profile complete, redirecting to dashboard');
          router.replace("/dashboard");
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
