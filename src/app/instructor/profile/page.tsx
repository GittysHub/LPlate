"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Profile = {
  id: string;
  role: "learner" | "instructor" | "driving_school" | "admin";
  name: string | null;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  avatar_url: string | null;
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
  lat: number | null;
  lng: number | null;
  service_radius_miles: number | null;
  languages: string[] | null;
};

export default function InstructorProfilePage() {
  const sb = createSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    // 0) Geocode postcode via postcodes.io (UK)
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pc = (profile.postcode ?? "").trim();
      if (pc) {
        const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
        const j = await r.json();
        if (j && j.status === 200 && j.result) {
          lat = j.result.latitude ?? null;
          lng = j.result.longitude ?? null;
        }
      }
    } catch {
      // non-fatal, continue without lat/lng
    }

    // 1) Save profile basics + ensure role
    const { error: pErr } = await (sb.from("profiles") as any)
      .update({
        role: "instructor",
        name: profile.name,
        phone: profile.phone,
        postcode: profile.postcode,
        avatar_url: profile.avatar_url,
      })
      .eq("id", profile.id);

    // 2) Upsert instructor row (store lat/lng if we have them)
    const inst = instructor ?? ({} as Instructor);
    const { error: iErr } = await (sb.from("instructors") as any).upsert({
      id: profile.id,
      description: inst.description ?? "",
      gender: (inst.gender ?? "other") as "male" | "female" | "other",
      base_postcode: inst.base_postcode ?? profile.postcode ?? "",
      vehicle_type: (inst.vehicle_type ?? "manual") as "manual" | "auto" | "both",
      hourly_rate: inst.hourly_rate ?? 30,
      adi_badge: !!inst.adi_badge,
      verification_status: (inst.verification_status ?? "pending") as "pending" | "approved" | "rejected",
      lat: lat ?? inst?.lat ?? null,
      lng: lng ?? inst?.lng ?? null,
      service_radius_miles: inst.service_radius_miles ?? 10,
      languages: inst.languages ?? ["English"],
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
    <main className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">Edit Profile</h1>

      <form onSubmit={save} className="space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer" title="Change photo">
            <div className="w-32 h-32 rounded-full ring-2 ring-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              {previewUrl || profile.avatar_url ? (
                <Image
                  src={(previewUrl || profile.avatar_url) as string}
                  alt="Avatar preview"
                  width={128}
                  height={128}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-3xl">
                  {(profile.name ?? "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !profile) return;
                const localUrl = URL.createObjectURL(file);
                setPreviewUrl(localUrl);
                setUploading(true);
                try {
                  const ext = file.name.split(".").pop() || "jpg";
                  const path = `${profile.id}-${Date.now()}.${ext}`;
                  const { error: upErr } = await sb.storage
                    .from("avatars")
                    .upload(path, file, { cacheControl: "3600" });
                  if (upErr) throw upErr;
                  const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
                  setProfile({ ...profile, avatar_url: pub.publicUrl });
                  setMsg("Photo uploaded");
                } catch (er: unknown) {
                  setMsg(er instanceof Error ? er.message : "Upload failed");
                } finally {
                  setUploading(false);
                  setTimeout(() => localUrl && URL.revokeObjectURL(localUrl), 1000);
                }
              }}
            />
          </label>
        </div>
        {uploading && <p className="text-center text-xs text-gray-500">Uploading…</p>}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3"
            value={profile.name ?? ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
            value={profile.email ?? ""}
            readOnly
          />
        </div>

        {/* Three columns: Hourly rate, Service radius, and Location (postcode) */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£)</label>
            <input
              type="number"
              min={10}
              max={100}
              step="1"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={inst.hourly_rate ?? 30}
              onChange={(e) => setInstructor({ ...instructor!, hourly_rate: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Radius (miles)</label>
            <input
              type="number"
              min={1}
              max={50}
              step="1"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={inst.service_radius_miles ?? 10}
              onChange={(e) => setInstructor({ ...instructor!, service_radius_miles: Number(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">How far you&apos;re willing to travel to meet learners</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Bristol or postcode"
              value={profile.postcode ?? ""}
              onChange={(e) => setProfile({ ...profile, postcode: e.target.value })}
            />
          </div>
        </div>

        {/* Vehicle & Gender inline (kept simple) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={inst.vehicle_type ?? "manual"}
              onChange={(e) => setInstructor({ ...instructor!, vehicle_type: e.target.value as "manual" | "auto" | "both" })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
              <option value="both">Manual & Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={inst.gender ?? "other"}
              onChange={(e) => setInstructor({ ...instructor!, gender: e.target.value as "male" | "female" | "other" })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-28"
            value={inst.description ?? ""}
            onChange={(e) => setInstructor({ ...instructor!, description: e.target.value })}
          />
        </div>

        {/* ADI toggle */}
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!inst.adi_badge}
            onChange={(e) => setInstructor({ ...instructor!, adi_badge: e.target.checked })}
          />
          <span>ADI Badge</span>
        </label>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages (max 3)</label>
          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <select
                key={index}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                value={inst.languages?.[index] || ""}
                onChange={(e) => {
                  const newLanguages = [...(inst.languages || [])];
                  if (e.target.value) {
                    newLanguages[index] = e.target.value;
                  } else {
                    newLanguages.splice(index, 1);
                  }
                  setInstructor({ ...instructor!, languages: newLanguages });
                }}
              >
                <option value="">Select language...</option>
                <option value="English">English</option>
                <option value="Welsh">Welsh</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Spanish">Spanish</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Polish">Polish</option>
                <option value="Romanian">Romanian</option>
                <option value="Bulgarian">Bulgarian</option>
                <option value="Lithuanian">Lithuanian</option>
                <option value="Latvian">Latvian</option>
                <option value="Estonian">Estonian</option>
                <option value="Czech">Czech</option>
                <option value="Slovak">Slovak</option>
                <option value="Hungarian">Hungarian</option>
                <option value="Slovenian">Slovenian</option>
                <option value="Croatian">Croatian</option>
                <option value="Serbian">Serbian</option>
                <option value="Bosnian">Bosnian</option>
                <option value="Macedonian">Macedonian</option>
                <option value="Albanian">Albanian</option>
                <option value="Turkish">Turkish</option>
                <option value="Arabic">Arabic</option>
                <option value="Urdu">Urdu</option>
                <option value="Hindi">Hindi</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Bengali">Bengali</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Kannada">Kannada</option>
                <option value="Marathi">Marathi</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Thai">Thai</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Russian">Russian</option>
                <option value="Ukrainian">Ukrainian</option>
                <option value="Belarusian">Belarusian</option>
                <option value="Moldovan">Moldovan</option>
                <option value="Georgian">Georgian</option>
                <option value="Armenian">Armenian</option>
                <option value="Azerbaijani">Azerbaijani</option>
                <option value="Kazakh">Kazakh</option>
                <option value="Kyrgyz">Kyrgyz</option>
                <option value="Tajik">Tajik</option>
                <option value="Turkmen">Turkmen</option>
                <option value="Uzbek">Uzbek</option>
                <option value="Mongolian">Mongolian</option>
                <option value="Hebrew">Hebrew</option>
                <option value="Persian">Persian</option>
                <option value="Dari">Dari</option>
                <option value="Pashto">Pashto</option>
                <option value="Kurdish">Kurdish</option>
                <option value="Amharic">Amharic</option>
                <option value="Swahili">Swahili</option>
                <option value="Yoruba">Yoruba</option>
                <option value="Igbo">Igbo</option>
                <option value="Hausa">Hausa</option>
                <option value="Zulu">Zulu</option>
                <option value="Afrikaans">Afrikaans</option>
                <option value="Dutch">Dutch</option>
                <option value="Flemish">Flemish</option>
                <option value="Danish">Danish</option>
                <option value="Norwegian">Norwegian</option>
                <option value="Swedish">Swedish</option>
                <option value="Finnish">Finnish</option>
                <option value="Icelandic">Icelandic</option>
                <option value="Greek">Greek</option>
                <option value="Maltese">Maltese</option>
                <option value="Irish">Irish</option>
                <option value="Scottish Gaelic">Scottish Gaelic</option>
                <option value="Cornish">Cornish</option>
                <option value="Manx">Manx</option>
              </select>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Select up to 3 languages you can teach in</p>
        </div>

        {/* Save */}
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {msg && <p className="text-center text-sm">{msg}</p>}
      </form>
    </main>
  );
}
