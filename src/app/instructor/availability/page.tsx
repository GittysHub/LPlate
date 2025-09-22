"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

// Helpers for <input type="datetime-local">
function toLocalInputValue(d: Date) {
  // returns "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function fromLocalInputValue(s: string) {
  // treat as local time
  return new Date(s);
}

type Slot = {
  id: string;
  instructor_id: string;
  start_at: string; // ISO
  end_at: string;   // ISO
  is_recurring: boolean;
};

export default function AvailabilityPage() {
  const sb = createSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [start, setStart] = useState(toLocalInputValue(new Date()));
  const [durationMins, setDurationMins] = useState<60 | 120>(120);
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await sb
        .from("availability")
        .select("*")
        .eq("instructor_id", user.id)
        .order("start_at", { ascending: true });

      setSlots((data as any) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const end = useMemo(() => {
    const s = fromLocalInputValue(start);
    const e = new Date(s.getTime() + durationMins * 60 * 1000);
    return toLocalInputValue(e);
  }, [start, durationMins]);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setMsg(null);

    const startAt = fromLocalInputValue(start);
    const endAt = fromLocalInputValue(end);

    if (endAt <= startAt) {
      setMsg("End must be after start.");
      setSaving(false);
      return;
    }

    const { error, data } = await sb
      .from("availability")
      .insert({
        instructor_id: userId,
        start_at: startAt.toISOString(), // store as UTC
        end_at: endAt.toISOString(),
        is_recurring: recurring,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }
    setSlots(prev => [...prev, data as any].sort((a, b) => a.start_at.localeCompare(b.start_at)));
    setMsg("Added");
  }

  async function removeSlot(id: string) {
    const previous = slots;
    setSlots(prev => prev.filter(s => s.id !== id));
    const { error } = await sb.from("availability").delete().eq("id", id);
    if (error) {
      // rollback on failure
      setSlots(previous);
      setMsg(error.message);
    }
  }

  if (loading) return <main>Loading…</main>;
  if (!userId) return <main>Please sign in, then return here.</main>;

  return (
    <main className="space-y-8">
      <section>
        <h2 className="text-lg font-medium mb-3">Add available slot</h2>
        <form onSubmit={addSlot} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <label className="block">
            <div className="text-sm">Start (local time)</div>
            <input
              type="datetime-local"
              className="w-full border rounded p-2"
              value={start}
              onChange={e => setStart(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm">Duration</div>
            <select
              className="w-full border rounded p-2"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value) as 60 | 120)}
            >
              <option value={60}>60 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            <span>Recurring</span>
          </label>

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
            disabled={saving}
          >
            {saving ? "Adding…" : "Add slot"}
          </button>
        </form>
        {msg && <p className="text-sm mt-2">{msg}</p>}
        <p className="text-xs text-neutral-500 mt-2">
          Stored in UTC; displayed/entered in your local time. Default timezone: London.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Your availability</h2>
        {slots.length === 0 ? (
          <p>No slots yet.</p>
        ) : (
          <ul className="divide-y border rounded-2xl overflow-hidden">
            {slots.map((s) => {
              const startLocal = new Date(s.start_at);
              const endLocal = new Date(s.end_at);
              return (
                <li key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm">
                    <div>
                      {startLocal.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}
                      {" — "}
                      {endLocal.toLocaleTimeString("en-GB", { timeStyle: "short", timeZone: "Europe/London" })}
                    </div>
                    {s.is_recurring && <div className="text-xs text-neutral-500">Recurring</div>}
                  </div>
                  <button
                    className="text-sm underline"
                    onClick={() => removeSlot(s.id)}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
