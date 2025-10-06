"use client";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function SignIn() {
  const sb = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"learner"|"instructor"|"driving_school">("learner");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?role=${role}` }
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in / Join</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border rounded p-2"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="w-full border rounded p-2"
            value={role}
            onChange={(e) => setRole(e.target.value as "learner" | "instructor" | "driving_school")}
          >
            <option value="learner">Learner</option>
            <option value="instructor">Instructor</option>
            <option value="driving_school">Driving School</option>
          </select>
          <button className="w-full bg-black text-white rounded p-2">Continue</button>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      )}
    </main>
  );
}
