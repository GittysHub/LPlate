"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") ?? "learner").toLowerCase();
  const sb = createSupabaseBrowser();

  useEffect(() => {
    (async () => {
      // On this page, supabase-js will detect the tokens in the URL hash
      // (because we enabled detectSessionInUrl: true in the client).
      // Give it a tick to process, then read the user.
      const { data: { user } } = await sb.auth.getUser();

      if (user?.id && user.email) {
        await sb.from("profiles").upsert(
          {
            id: user.id,
            role,
            name: user.email.split("@")[0],
            email: user.email,
          },
          { onConflict: "id" }
        );
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
