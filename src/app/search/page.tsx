"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import SearchBar from "@/components/ui/SearchBar";
import { FilterChips } from "@/components/ui/FilterChips";
import InstructorCard from "@/components/ui/InstructorCard";

type InstructorCard = {
  id: string;
  description: string | null;
  base_postcode: string | null;
  vehicle_type: "manual" | "auto" | "both" | null;
  hourly_rate: number | null;
  gender: "male" | "female" | "other" | null;
  lat: number | null;
  lng: number | null;
  name?: string | null;
  avatar_url?: string | null;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function SearchPage() {
  const sb = createSupabaseBrowser();

  const [postcode, setPostcode] = useState("");
  const [radiusKm, setRadiusKm] = useState(20);
  const [vehicle, setVehicle] = useState<"any" | "manual" | "auto" | "both">("any");
  const [gender, setGender] = useState<"any" | "male" | "female" | "other">("any");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [timeOfDay, setTimeOfDay] = useState<string>("");
  const [lessonDurationMins, setLessonDurationMins] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Array<InstructorCard & { distanceKm?: number }>>([]);

  // Filter chips configuration
  const vehicleFilters = [
    { id: "any", label: "Any Vehicle", active: vehicle === "any" },
    { id: "manual", label: "Manual", active: vehicle === "manual" },
    { id: "auto", label: "Auto", active: vehicle === "auto" },
    { id: "both", label: "Both", active: vehicle === "both" }
  ];

  const genderFilters = [
    { id: "any", label: "Any Gender", active: gender === "any" },
    { id: "male", label: "Male", active: gender === "male" },
    { id: "female", label: "Female", active: gender === "female" },
    { id: "other", label: "Other", active: gender === "other" }
  ];

  const dayFilters = [
    { id: "", label: "Any Day", active: dayOfWeek === "" },
    { id: "1", label: "Mon", active: dayOfWeek === "1" },
    { id: "2", label: "Tue", active: dayOfWeek === "2" },
    { id: "3", label: "Wed", active: dayOfWeek === "3" },
    { id: "4", label: "Thu", active: dayOfWeek === "4" },
    { id: "5", label: "Fri", active: dayOfWeek === "5" },
    { id: "6", label: "Sat", active: dayOfWeek === "6" },
    { id: "7", label: "Sun", active: dayOfWeek === "7" }
  ];

  const timeFilters = [
    { id: "", label: "Any Time", active: timeOfDay === "" },
    { id: "morning", label: "Morning", active: timeOfDay === "morning" },
    { id: "afternoon", label: "Afternoon", active: timeOfDay === "afternoon" },
    { id: "evening", label: "Evening", active: timeOfDay === "evening" }
  ];

  const durationFilters = [
    { id: "60", label: "1 Hour", active: lessonDurationMins === 60 },
    { id: "120", label: "2 Hours", active: lessonDurationMins === 120 }
  ];

  const distanceFilters = [
    { id: "5", label: "5km", active: radiusKm === 5 },
    { id: "10", label: "10km", active: radiusKm === 10 },
    { id: "15", label: "15km", active: radiusKm === 15 },
    { id: "20", label: "20km", active: radiusKm === 20 },
    { id: "30", label: "30km", active: radiusKm === 30 }
  ];

  function normalisePostcode(pc: string) {
    let s = pc.trim().toUpperCase().replace(/\s+/g, "");
    if (s.length > 3) s = s.slice(0, s.length - 3) + " " + s.slice(-3);
    return s;
  }

  async function geocode(pc: string) {
    const norm = normalisePostcode(pc);
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(norm)}`);
    const j = await r.json();
    if (j.status !== 200 || !j.result) throw new Error("Postcode not found");
    return { lat: j.result.latitude as number, lng: j.result.longitude as number };
  }

  async function search(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErr(null);
    setLoading(true);
    setResults([]);

    try {
      const origin = await geocode(postcode);

      const { data, error } = await sb
        .from("instructors")
        .select(`
          id, 
          description, 
          base_postcode, 
          vehicle_type, 
          hourly_rate, 
          gender, 
          lat, 
          lng, 
          profiles(name, avatar_url)
        `)
        .eq("verification_status", "approved")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (error) throw error;

      interface SupabaseRow {
        id: string;
        description: string | null;
        base_postcode: string | null;
        vehicle_type: "manual" | "auto" | "both" | null;
        hourly_rate: number | null;
        gender: "male" | "female" | "other" | null;
        lat: number | null;
        lng: number | null;
        profiles: { name: string | null; avatar_url: string | null }[] | null;
      }

      let rows: InstructorCard[] =
        (data as SupabaseRow[])?.map((r: SupabaseRow) => ({
          id: r.id,
          description: r.description,
          base_postcode: r.base_postcode,
          vehicle_type: r.vehicle_type,
          hourly_rate: r.hourly_rate,
          gender: r.gender,
          lat: r.lat,
          lng: r.lng,
          name: r.profiles && r.profiles.length > 0 ? r.profiles[0].name ?? null : null,
          avatar_url: r.profiles && r.profiles.length > 0 ? r.profiles[0].avatar_url ?? null : null,
        })) ?? [];

      if (vehicle !== "any") rows = rows.filter(r => (r.vehicle_type ?? "manual") === vehicle);
      if (gender !== "any") rows = rows.filter(r => (r.gender ?? "other") === gender);

      let filtered = rows;

      // Optional availability filter
      if (dayOfWeek && timeOfDay) {
        let startHour: number, endHour: number;
        switch (timeOfDay) {
          case "morning":
            startHour = 7;
            endHour = 12;
            break;
          case "afternoon":
            startHour = 12;
            endHour = 17;
            break;
          case "evening":
            startHour = 17;
            endHour = 23;
            break;
          default:
            startHour = 9;
            endHour = 17;
        }

        const reqIsoDow = parseInt(dayOfWeek);

        if (filtered.length > 0) {
          const instructorIds = filtered.map(r => r.id);
          const { data: avail, error: availErr } = await sb
            .from("availability")
            .select("instructor_id, start_at, end_at, is_recurring")
            .in("instructor_id", instructorIds)
            .eq("is_recurring", true);
          if (availErr) throw availErr;

          interface AvailabilitySlot {
            instructor_id: string;
            start_at: string;
            end_at: string;
            is_recurring: boolean;
          }

          filtered = filtered.filter(inst => {
            const slots = (avail as AvailabilitySlot[])?.filter(a => a.instructor_id === inst.id) || [];
            return slots.some(s => {
              const sStart = new Date(s.start_at);
              const sEnd = new Date(s.end_at);
              const slotIsoDow = ((sStart.getDay() + 6) % 7) + 1;
              if (slotIsoDow !== reqIsoDow) return false;
              
              const sStartMinutes = sStart.getHours() * 60 + sStart.getMinutes();
              const sEndMinutes = sEnd.getHours() * 60 + sEnd.getMinutes();
              const reqStartMinutes = startHour * 60;
              const reqEndMinutes = endHour * 60;
              
              return reqStartMinutes >= sStartMinutes && reqEndMinutes <= sEndMinutes;
            });
          });
        }
      }

      const withDistance = filtered
        .map(r => {
          const d = r.lat != null && r.lng != null ? haversineKm(origin.lat, origin.lng, r.lat, r.lng) : Infinity;
          return { ...r, distanceKm: d };
        })
        .filter(r => r.distanceKm! <= radiusKm)
        .sort((a, b) => (a.distanceKm! - b.distanceKm!));

      setResults(withDistance);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (filterType: string, filterId: string) => {
    switch (filterType) {
      case "vehicle":
        setVehicle(filterId as "any" | "manual" | "auto" | "both");
        break;
      case "gender":
        setGender(filterId as "any" | "male" | "female" | "other");
        break;
      case "day":
        setDayOfWeek(filterId);
        break;
      case "time":
        setTimeOfDay(filterId);
        break;
      case "duration":
        setLessonDurationMins(Number(filterId));
        break;
      case "distance":
        setRadiusKm(Number(filterId));
        break;
    }
    // Auto-search when filters change
    if (postcode) {
      search();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Mobile First */}
      <div className="px-6 py-6 bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Your Perfect Instructor</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar 
              placeholder="Enter postcode"
              onSearch={(query) => {
                setPostcode(query);
                search();
              }}
              loading={loading}
            />
          </div>

          {/* Filter Chips - Mobile Optimized */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Type</h3>
              <FilterChips 
                filters={vehicleFilters}
                onFilterChange={(id) => handleFilterChange("vehicle", id)}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Gender</h3>
              <FilterChips 
                filters={genderFilters}
                onFilterChange={(id) => handleFilterChange("gender", id)}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Availability</h3>
              <div className="space-y-2">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Day of Week</h4>
                  <FilterChips 
                    filters={dayFilters}
                    onFilterChange={(id) => handleFilterChange("day", id)}
                  />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Time of Day</h4>
                  <FilterChips 
                    filters={timeFilters}
                    onFilterChange={(id) => handleFilterChange("time", id)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Lesson Details</h3>
              <div className="space-y-2">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Duration</h4>
                  <FilterChips 
                    filters={durationFilters}
                    onFilterChange={(id) => handleFilterChange("duration", id)}
                  />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Distance</h4>
                  <FilterChips 
                    filters={distanceFilters}
                    onFilterChange={(id) => handleFilterChange("distance", id)}
                  />
                </div>
              </div>
            </div>
          </div>

          {err && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{err}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results - Mobile First */}
      <div className="px-6 py-6">
        <div className="max-w-md mx-auto">
          {results.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-300 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No instructors found</h3>
              <p className="text-gray-500 text-sm">Try widening your search radius or adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {(r.name ?? "I").split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {r.name ?? "Instructor"}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">⭐</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">4.8</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {r.base_postcode ?? "Bristol"} • {r.distanceKm?.toFixed(1)} km away
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          £{r.hourly_rate ?? 30}/hr
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {r.vehicle_type === "both" ? "Both" : (r.vehicle_type ?? "Manual")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors">
                      Book Lesson
                    </button>
                    <button className="flex-1 bg-white border-2 border-gray-200 hover:border-green-500 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}