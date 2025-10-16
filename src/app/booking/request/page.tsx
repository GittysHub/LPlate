"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Instructor = {
  id: string;
  hourly_rate: number | null;
  vehicle_type: "manual" | "auto" | "both" | null;
  base_postcode: string | null;
  description: string | null;
  profiles?: { name: string | null } | null;
};

function RequestPageContent() {
  const sb = createSupabaseBrowser();
  const params = useSearchParams();
  const router = useRouter();
  const instructorId = params.get("instructor_id") || "";

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [learnerId, setLearnerId] = useState<string | null>(null);

  const [inst, setInst] = useState<Instructor | null>(null);

  // form state
  const [date, setDate] = useState<string>("");            // YYYY-MM-DD
  const [time, setTime] = useState<string>("");            // HH:MM
  const [durationMins, setDurationMins] = useState<number>(120); // 60 or 120
  const [note, setNote] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // ensure user is signed in
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        // not signed in → send to sign-in then back here
        router.push(`/sign-in?next=/booking/request?instructor_id=${encodeURIComponent(instructorId)}`);
        return;
      }
      setLearnerId(user.id);
      setAuthed(true);

      // load instructor basics
      if (!instructorId) {
        setErr("Missing instructor id.");
        setLoading(false);
        return;
      }

      const { data, error } = await sb
        .from("instructors")
        .select("id, hourly_rate, vehicle_type, base_postcode, description, profiles(name)")
        .eq("id", instructorId)
        .maybeSingle();

      if (error) {
        setErr(error.message);
      } else {
        setInst(data as Instructor | null);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const price = useMemo(() => {
    const hr = inst?.hourly_rate ?? 30;
    return Math.round((hr * (durationMins / 60)) * 100) / 100;
  }, [inst?.hourly_rate, durationMins]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!authed || !learnerId) {
      setErr("Please sign in first.");
      return;
    }
    if (!inst) {
      setErr("Instructor not found.");
      return;
    }
    if (!date || !time) {
      setErr("Choose a date and time.");
      return;
    }

    try {
      setSubmitting(true);

      // Compose ISO start/end in Europe/London (client-side)
      const startLocal = new Date(`${date}T${time}:00`);
      const endLocal = new Date(startLocal.getTime() + durationMins * 60 * 1000);

      // Insert booking with status pending
      const { error } = await (sb.from("bookings") as any)
        .insert({
          learner_id: learnerId,
          instructor_id: inst.id,
          status: "pending" as const,
          start_at: startLocal.toISOString(),
          end_at: endLocal.toISOString(),
          price: price,
          note: note || null,
        });

      if (error) throw error;

      setMsg("Request sent! The instructor will be notified to accept.");
      // optional: go to a "my bookings" page later
      // router.push("/dashboard");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  }

  if (err) {
    return <main className="max-w-3xl mx-auto p-6 text-red-600">{err}</main>;
  }

  if (!inst) {
    return <main className="max-w-3xl mx-auto p-6">Instructor not found.</main>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Request a lesson</h1>

      <section className="border rounded-xl p-4">
        <div className="font-medium">{inst.profiles?.name ?? "Instructor"}</div>
        <div className="text-sm text-neutral-600">
          {(inst.vehicle_type === "both" ? "Manual & Auto" : inst.vehicle_type ?? "manual")}
          {" • "}£{inst.hourly_rate ?? 30}/hr
          {inst.base_postcode ? ` • ${inst.base_postcode}` : ""}
        </div>
        {inst.description && <p className="text-sm mt-2">{inst.description}</p>}
      </section>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Date</div>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Start time</div>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Duration</div>
            <select
              className="w-full border rounded p-2"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
            >
              <option value={60}>60 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </label>
        </div>

        <label className="block">
          <div className="text-sm mb-1">Note (optional)</div>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Anything the instructor should know?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-700">
            Estimated price: <span className="font-medium">£{price.toFixed(2)}</span>
          </div>
          <button
            className="bg-black text-white px-4 py-2 rounded"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Sending…" : "Send request"}
          </button>
        </div>

        {msg && <p className="text-green-700 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={
      <main className="max-w-3xl mx-auto p-6">Loading…</main>
    }>
      <RequestPageContent />
    </Suspense>
  );
}
