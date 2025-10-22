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
        const { error: insErr } = await sb.from("availability").insert(rows as any);
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
    <main className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Working Hours</h1>

      <div className="bg-white border rounded-2xl overflow-hidden divide-y shadow-lg">
        {week.map((d, i) => (
          <div key={d.key} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors">
            <div className="w-24 font-semibold text-lg text-gray-800">{d.label}</div>
            <div className="flex-1 flex items-center justify-center space-x-1 text-gray-700">
              <div className="relative">
                <input
                  type="time"
                  value={d.start}
                  onChange={(e) => updateDay(i, { start: e.target.value })}
                  className="border border-gray-300 bg-gray-50 rounded-md px-2 py-1.5 text-base focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                  disabled={!d.enabled}
                />
              </div>
              <span className="text-gray-400 text-sm">to</span>
              <div className="relative">
                <input
                  type="time"
                  value={d.end}
                  onChange={(e) => updateDay(i, { end: e.target.value })}
                  className="border border-gray-300 bg-gray-50 rounded-md px-2 py-1.5 text-base focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                  disabled={!d.enabled}
                />
              </div>
            </div>
            
             {/* Improved Toggle with Text in Track */}
             <div className="ml-4">
               <button
                 type="button"
                 role="switch"
                 aria-checked={d.enabled}
                 aria-label={`${d.label} availability`}
                 onClick={() => updateDay(i, { enabled: !d.enabled })}
                 onKeyDown={(e) => {
                   if (e.key === " " || e.key === "Enter") {
                     e.preventDefault();
                     updateDay(i, { enabled: !d.enabled });
                   }
                 }}
                 className={[
                   "relative w-20 h-10 rounded-full transition-all duration-300 flex items-center",
                   d.enabled ? "bg-green-600" : "bg-red-700",
                   "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/60 focus-visible:ring-offset-2"
                 ].join(" ")}
               >
                 {/* Label inside the track, opposite side of the thumb */}
                 <span
                   className={[
                     "absolute text-white font-semibold text-sm transition-all duration-300",
                     d.enabled ? "left-1" : "right-1"
                   ].join(" ")}
                 >
                   {d.enabled ? "Open" : "Busy"}
                 </span>

                 {/* The sliding white thumb */}
                 <span
                   className={[
                     "absolute bg-white rounded-full w-8 h-8 shadow-md transform transition-transform duration-300",
                     d.enabled ? "translate-x-[44px]" : "translate-x-[4px]"
                   ].join(" ")}
                 ></span>
               </button>
             </div>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      <div className="flex items-center justify-between pt-4">
        <button 
          onClick={cancel} 
          className="px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          Cancel
        </button>
        <button 
          onClick={save} 
          disabled={saving} 
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
