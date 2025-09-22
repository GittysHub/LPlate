"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Profile = {
  id: string;
  role: "learner" | "instructor" | "driving_school" | "admin";
  name: string | null;
  email: string | null;
  phone: string | null;
  postcode: string | null;
};

type Instructor = {
  id: string; // equals profile id
  description: string | null;
  gender: "male" | "female" | "other" | null;
  base_postcode: string | null;
  vehicle_type: "manual" | "auto" | "both" | null;
  hourly_rate: number | null;
  adi_badge: boolean | null;
  verification_status: "pending" | "approved" | "rejected" | null;
};

export default function InstructorProfilePage() {
  const sb = createSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);

      // load profile
      const { data: prof, error: pErr } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!pErr && prof) setProfile(prof as Profile);

      // load instructor (may not exist yet)
      const { data: inst } = await sb
        .from("instructors")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (inst) setInstructor(inst as Instructor);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg(null);

    // 1) Ensure role is instructor and save basic profile fields
    const { error: pErr } = await sb
      .from("profiles")
      .update({
        role: "instructor",
        name: profile.name,
        phone: profile.phone,
        postcode: profile.postcode,
      })
      .eq("id", profile.id);

    // 2) Upsert instructor row
    const inst = instructor ?? ({} as Instructor);
    const { error: iErr } = await sb.from("instructors").upsert({
      id: profile.id,
      description: inst.description ?? "",
      gender: inst.gender ?? "other",
      base_postcode: inst.base_postcode ?? profile.postcode ?? "",
      vehicle_type: inst.vehicle_type ?? "manual",
      hourly_rate: inst.hourly_rate ?? 30,
      adi_badge: !!inst.adi_badge,
      verification_status: inst.verification_status ?? "pending",
    });

    setSaving(false);
    if (pErr || iErr) {
      setMsg(pErr?.message || iErr?.message || "Save failed");
    } else {
      setMsg("Saved");
    }
  }

  if (loading) return <div>Loading…</div>;

  if (!authed)
    return (
      <div className="space-y-3">
        <p>You need to sign in.</p>
        <Link className="underline" href="/sign-in">Go to sign in</Link>
      </div>
    );

  if (!profile) return <div>No profile found.</div>;

  const inst = instructor ?? ({} as Instructor);

  return (
    <form onSubmit={save} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Your details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm">Name</div>
            <input
              className="w-full border rounded p-2"
              value={profile.name ?? ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label className="block">
            <div className="text-sm">Phone</div>
            <input
              className="w-full border rounded p-2"
              value={profile.phone ?? ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <div className="text-sm">Home postcode</div>
            <input
              className="w-full border rounded p-2"
              placeholder="e.g. SW1A 1AA"
              value={profile.postcode ?? ""}
              onChange={(e) => setProfile({ ...profile, postcode: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Instructor profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <div className="text-sm">Bio</div>
            <textarea
              className="w-full border rounded p-2"
              value={inst.description ?? ""}
              onChange={(e) => setInstructor({ ...(inst as any), description: e.target.value })}
            />
          </label>

          <label className="block">
            <div className="text-sm">Gender</div>
            <select
              className="w-full border rounded p-2"
              value={inst.gender ?? "other"}
              onChange={(e) => setInstructor({ ...(inst as any), gender: e.target.value as any })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm">Vehicle</div>
            <select
              className="w-full border rounded p-2"
              value={inst.vehicle_type ?? "manual"}
              onChange={(e) => setInstructor({ ...(inst as any), vehicle_type: e.target.value as any })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
              <option value="both">Manual & Auto</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm">Hourly rate (£)</div>
            <input
              type="number"
              min={10}
              max={100}
              step="1"
              className="w-full border rounded p-2"
              value={inst.hourly_rate ?? 30}
              onChange={(e) => setInstructor({ ...(inst as any), hourly_rate: Number(e.target.value) })}
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!inst.adi_badge}
              onChange={(e) => setInstructor({ ...(inst as any), adi_badge: e.target.checked })}
            />
            <span>ADI Badge</span>
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          className="bg-black text-white px-4 py-2 rounded"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </form>
  );
}
