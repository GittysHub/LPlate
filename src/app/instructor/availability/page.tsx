"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type WeekDay = {
  key: number; // 1=Mon ... 7=Sun (ISO)
  label: string;
  enabled: boolean;
  start: string; // HH:MM
  end: string;   // HH:MM
};

type Slot = {
  id: string;
  instructor_id: string;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
};

const DEFAULT_WEEK: WeekDay[] = [
  { key: 1, label: "Mon", enabled: true, start: "09:00", end: "17:00" },
  { key: 2, label: "Tue", enabled: true, start: "09:00", end: "17:00" },
  { key: 3, label: "Wed", enabled: true, start: "09:00", end: "17:00" },
  { key: 4, label: "Thu", enabled: true, start: "09:00", end: "17:00" },
  { key: 5, label: "Fri", enabled: true, start: "09:00", end: "17:00" },
  { key: 6, label: "Sat", enabled: false, start: "09:00", end: "17:00" },
  { key: 7, label: "Sun", enabled: false, start: "09:00", end: "17:00" },
];

export default function AvailabilityPage() {
  const sb = createSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekDay[]>(DEFAULT_WEEK);
  const [initialWeek, setInitialWeek] = useState<WeekDay[]>(DEFAULT_WEEK);
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
        .eq("is_recurring", true)
        .order("start_at", { ascending: true });

      interface SupabaseSlot {
        id: string;
        instructor_id: string;
        start_at: string;
        end_at: string;
        is_recurring: boolean;
        created_at: string;
      }

      const slots: Slot[] = (data as SupabaseSlot[]) ?? [];
      if (slots.length > 0) {
        const next = DEFAULT_WEEK.map(d => ({ ...d }));
        for (const s of slots) {
          const start = new Date(s.start_at);
          const end = new Date(s.end_at);
          // JS getDay(): 0 Sun..6 Sat; convert to ISO 1..7
          const iso = ((start.getDay() + 6) % 7) + 1;
          const target = next.find(n => n.key === iso)!;
          target.enabled = true;
          target.start = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" });
          target.end = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" });
        }
        setWeek(next);
        setInitialWeek(next);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDay(idx: number, patch: Partial<WeekDay>) {
    setWeek(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch } as WeekDay;
      return next;
    });
  }

  function nextDateForIsoDow(iso: number) {
    const now = new Date();
    const currentIso = ((now.getDay() + 6) % 7) + 1;
    const diff = (iso - currentIso + 7) % 7 || 7; // next occurrence in the future (at least next week)
    const d = new Date(now);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    setMsg(null);
    try {
      // Replace existing recurring template with new one
      const { error: delErr } = await sb
        .from("availability")
        .delete()
        .eq("instructor_id", userId)
        .eq("is_recurring", true);
      if (delErr) throw delErr;

      const rows: Omit<Slot, "id">[] = [];
      for (const d of week) {
        if (!d.enabled) continue;
        const base = nextDateForIsoDow(d.key);
        const [sh, sm] = d.start.split(":" ).map(Number);
        const [eh, em] = d.end.split(":" ).map(Number);
        const start = new Date(base);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(base);
        end.setHours(eh, em, 0, 0);
        if (end <= start) continue; // skip invalid
        rows.push({
          instructor_id: userId,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          is_recurring: true,
        });
      }

      if (rows.length > 0) {
        const { error: insErr } = await sb.from("availability").insert(rows);
        if (insErr) throw insErr;
      }

      setInitialWeek(week);
      setMsg("Saved");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setWeek(initialWeek);
    setMsg(null);
  }

  if (loading) return <main>Loading…</main>;
  if (!userId) return <main>Please sign in, then return here.</main>;

  return (
    <main className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Diary</h1>

      <div className="bg-white border rounded-2xl overflow-hidden divide-y">
        {week.map((d, i) => (
          <div key={d.key} className="flex items-center justify-between px-4 py-3">
            <div className="w-16 font-medium">{d.label}</div>
            <div className="flex-1 text-center text-gray-700">
              <input
                type="time"
                value={d.start}
                onChange={(e) => updateDay(i, { start: e.target.value })}
                className="border rounded px-2 py-1 mr-2"
                disabled={!d.enabled}
              />
              <span className="mx-1">-</span>
              <input
                type="time"
                value={d.end}
                onChange={(e) => updateDay(i, { end: e.target.value })}
                className="border rounded px-2 py-1 ml-2"
                disabled={!d.enabled}
              />
            </div>
            <label className="ml-4 inline-flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={d.enabled}
                  onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                />
                <div className={`w-12 h-7 rounded-full transition-all duration-300 ease-out ${
                  d.enabled 
                    ? 'bg-green-700' 
                    : 'bg-red-700'
                }`}>
                  <div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 ease-out shadow-md ${
                    d.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} style={{ marginTop: '2px' }}></div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={cancel} className="px-6 py-3 rounded-lg border">Cancel</button>
        <button onClick={save} disabled={saving} className="px-6 py-3 rounded-lg bg-green-600 text-white disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </main>
  );
}
