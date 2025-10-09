"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase";
import SearchBar from "@/components/ui/SearchBar";
import { FilterChips } from "@/components/ui/FilterChips";
import ToggleGroup from "@/components/ui/ToggleGroup";
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
  const [vehicle, setVehicle] = useState<"any" | "manual" | "auto" | "both">("both");
  const [gender, setGender] = useState<"any" | "male" | "female">("any");
  const [selectedDays, setSelectedDays] = useState<string[]>(["1", "2", "3", "4", "5", "6", "7"]);
  const [timeOfDay, setTimeOfDay] = useState<string>("");
  const [lessonDurationMins, setLessonDurationMins] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Array<InstructorCard & { distanceKm?: number }>>([]);

  // Get search params for automatic search
  const searchParams = useSearchParams();

  // Auto-search when page loads with query parameter
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && query.trim()) {
      setPostcode(query.trim());
      // Trigger search after a short delay to ensure component is mounted
      const timer = setTimeout(async () => {
        try {
          setErr(null);
          setLoading(true);
          setResults([]);

          const origin = await geocode(query.trim());

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
              profiles!inner(name, avatar_url)
            `)
            .eq("verification_status", "approved")
            .not("lat", "is", null)
            .not("lng", "is", null);

          if (error) throw error;

          console.log("Raw instructor data:", data);

          interface SupabaseRow {
            id: string;
            description: string | null;
            base_postcode: string | null;
            vehicle_type: "manual" | "auto" | "both" | null;
            hourly_rate: number | null;
            gender: "male" | "female" | "other" | null;
            lat: number | null;
            lng: number | null;
            profiles: { name: string | null; avatar_url: string | null } | null;
          }

          let rows: InstructorCard[] =
            (data as unknown as SupabaseRow[])?.map((r: SupabaseRow) => {
              const fullName = r.profiles?.name ?? null;
              const firstName = fullName ? fullName.split(' ')[0] : null;
              console.log(`Instructor ${r.id}: fullName=`, fullName, 'firstName=', firstName);
              return {
                id: r.id,
                description: r.description,
                base_postcode: r.base_postcode,
                vehicle_type: r.vehicle_type,
                hourly_rate: r.hourly_rate,
                gender: r.gender,
                lat: r.lat,
                lng: r.lng,
                name: firstName,
                avatar_url: r.profiles?.avatar_url ?? null,
              };
            }) ?? [];

          if (vehicle !== "both") rows = rows.filter(r => (r.vehicle_type ?? "manual") === vehicle);
          if (gender !== "any") rows = rows.filter(r => (r.gender ?? "other") === gender);

          let filtered = rows;

          // Apply availability filtering
          if (selectedDays.length > 0 && selectedDays.length < 7 && timeOfDay) {
            // Filter by specific days and time of day
            filtered = filtered.filter(r => {
              // This is a simplified availability check
              // In a real app, you'd check against the availability table
              return true; // For now, return all instructors
            });
          }

          // Apply lesson duration filtering
          if (lessonDurationMins > 0) {
            // Filter by lesson duration preference
            // This would typically check instructor preferences or availability
            filtered = filtered.filter(r => {
              return true; // For now, return all instructors
            });
          }

          const radiusKm = 20; // Default radius
          const withDistance = filtered
            .map(r => {
              const d = r.lat != null && r.lng != null ? haversineKm(origin.lat, origin.lng, r.lat, r.lng) : Infinity;
              return { ...r, distanceKm: d };
            })
            .filter(r => r.distanceKm! <= radiusKm)
            .sort((a, b) => {
              // Primary sort: by price (lowest first)
              const priceA = a.hourly_rate ?? 30;
              const priceB = b.hourly_rate ?? 30;
              if (priceA !== priceB) {
                return priceA - priceB;
              }
              // Secondary sort: by distance (closest first)
              return a.distanceKm! - b.distanceKm!;
            });

          setResults(withDistance);
        } catch (e: unknown) {
          setErr(e instanceof Error ? e.message : "Search failed");
        } finally {
          setLoading(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Filter chips configuration
  const vehicleFilters = [
    { id: "both", label: "Auto & Manual", active: vehicle === "both" },
    { id: "manual", label: "Manual", active: vehicle === "manual" },
    { id: "auto", label: "Auto", active: vehicle === "auto" }
  ];

  const genderFilters = [
    { id: "male", label: "Male", active: gender === "male" },
    { id: "female", label: "Female", active: gender === "female" },
    { id: "any", label: "Either", active: gender === "any" }
  ];

  // Filter configurations for ToggleGroup
  const vehicleToggleOptions = [
    { id: "both", label: "Either", active: vehicle === "both" },
    { id: "manual", label: "Manual", active: vehicle === "manual" },
    { id: "auto", label: "Auto", active: vehicle === "auto" }
  ];

  const genderToggleOptions = [
    { id: "any", label: "Either", active: gender === "any" },
    { id: "male", label: "Male", active: gender === "male" },
    { id: "female", label: "Female", active: gender === "female" }
  ];

  const durationToggleOptions = [
    { id: "any", label: "Either", active: lessonDurationMins === 0 },
    { id: "60", label: "1 hr", active: lessonDurationMins === 60 },
    { id: "120", label: "2 hr", active: lessonDurationMins === 120 }
  ];

  const dayFilters = [
    { id: "1", label: "Mon", active: selectedDays.includes("1") },
    { id: "2", label: "Tue", active: selectedDays.includes("2") },
    { id: "3", label: "Wed", active: selectedDays.includes("3") },
    { id: "4", label: "Thu", active: selectedDays.includes("4") },
    { id: "5", label: "Fri", active: selectedDays.includes("5") },
    { id: "6", label: "Sat", active: selectedDays.includes("6") },
    { id: "7", label: "Sun", active: selectedDays.includes("7") }
  ];

  const timeToggleOptions = [
    { id: "", label: "Any", active: timeOfDay === "" },
    { id: "morning", label: "AM", active: timeOfDay === "morning" },
    { id: "afternoon", label: "PM", active: timeOfDay === "afternoon" },
    { id: "evening", label: "Eve", active: timeOfDay === "evening" }
  ];


  function normalisePostcode(pc: string) {
    // Remove all spaces and convert to uppercase
    let s = pc.trim().toUpperCase().replace(/\s+/g, "");
    
    // Handle different UK postcode formats
    if (s.length >= 5) {
      if (s.length === 6) {
        // Format: ABC123 -> ABC 123 (3 + 3)
        s = s.slice(0, 3) + " " + s.slice(3);
      } else if (s.length === 7) {
        // Format: ABCD123 -> ABCD 123 (4 + 3)
        s = s.slice(0, 4) + " " + s.slice(4);
      } else if (s.length === 5) {
        // Format: AB123 -> AB 123 (2 + 3)
        s = s.slice(0, 2) + " " + s.slice(2);
      } else if (s.length === 8) {
        // Format: ABCD1234 -> ABCD 1234 (4 + 4)
        s = s.slice(0, 4) + " " + s.slice(4);
      }
    }
    
    return s;
  }

  function maskPostcode(pc: string | null) {
    if (!pc) return "Bristol";
    
    // Split postcode into parts (e.g., "BS16 2NR" -> ["BS16", "2NR"])
    const parts = pc.trim().split(' ');
    if (parts.length >= 2) {
      // Show only first part (e.g., "BS16")
      return parts[0];
    }
    
    // If no space, show first 3-4 characters
    if (pc.length >= 4) {
      return pc.slice(0, 4);
    }
    
    return pc;
  }

  async function geocode(pc: string) {
    const norm = normalisePostcode(pc);
    console.log('Geocoding postcode:', pc, 'Normalized:', norm);
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(norm)}`);
    const j = await r.json();
    console.log('API response:', j);
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
          profiles!inner(name, avatar_url)
        `)
        .eq("verification_status", "approved")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (error) throw error;

      console.log("Raw instructor data:", data);

      interface SupabaseRow {
        id: string;
        description: string | null;
        base_postcode: string | null;
        vehicle_type: "manual" | "auto" | "both" | null;
        hourly_rate: number | null;
        gender: "male" | "female" | "other" | null;
        lat: number | null;
        lng: number | null;
        profiles: { name: string | null; avatar_url: string | null } | null;
      }

      let rows: InstructorCard[] =
        (data as unknown as SupabaseRow[])?.map((r: SupabaseRow) => {
          const fullName = r.profiles?.name ?? null;
          const firstName = fullName ? fullName.split(' ')[0] : null;
          console.log(`Instructor ${r.id}: fullName=`, fullName, 'firstName=', firstName);
          return {
            id: r.id,
            description: r.description,
            base_postcode: r.base_postcode,
            vehicle_type: r.vehicle_type,
            hourly_rate: r.hourly_rate,
            gender: r.gender,
            lat: r.lat,
            lng: r.lng,
            name: firstName,
            avatar_url: r.profiles?.avatar_url ?? null,
          };
        }) ?? [];

      if (vehicle !== "both") rows = rows.filter(r => (r.vehicle_type ?? "manual") === vehicle);
      if (gender !== "any") rows = rows.filter(r => (r.gender ?? "other") === gender);

      let filtered = rows;

      // Optional availability filter
      if (selectedDays.length > 0 && selectedDays.length < 7 && timeOfDay) {
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
              
              // Check if this slot matches any of the selected days
              if (!selectedDays.includes(slotIsoDow.toString())) return false;
              
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
        .sort((a, b) => {
          // Primary sort: by price (lowest first)
          const priceA = a.hourly_rate ?? 30;
          const priceB = b.hourly_rate ?? 30;
          if (priceA !== priceB) {
            return priceA - priceB;
          }
          // Secondary sort: by distance (closest first)
          return a.distanceKm! - b.distanceKm!;
        });

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
        setVehicle(filterId as "manual" | "auto" | "both");
        break;
      case "gender":
        setGender(filterId as "any" | "male" | "female");
        break;
      case "day":
        if (filterId === "clear") {
          setSelectedDays([]);
        } else {
          setSelectedDays(prev => 
            prev.includes(filterId) 
              ? prev.filter(day => day !== filterId)
              : [...prev, filterId]
          );
        }
        break;
      case "time":
        setTimeOfDay(filterId);
        break;
      case "duration":
        setLessonDurationMins(filterId === "any" ? 0 : Number(filterId));
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Instructors nearby 🔍</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar 
              placeholder="e.g. BS16 2NR or BS162NR"
              onSearch={(query) => {
                setPostcode(query);
                search();
              }}
              loading={loading}
            />
          </div>

          {/* Filter Toggles - 2 Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Vehicle Type</h3>
              <ToggleGroup 
                options={vehicleToggleOptions}
                onOptionChange={(id) => handleFilterChange("vehicle", id)}
                className="text-xs"
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Duration</h3>
              <ToggleGroup 
                options={durationToggleOptions}
                onOptionChange={(id) => handleFilterChange("duration", id)}
                className="text-xs"
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Gender</h3>
              <ToggleGroup 
                options={genderToggleOptions}
                onOptionChange={(id) => handleFilterChange("gender", id)}
                className="text-xs"
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Time of Day</h3>
              <ToggleGroup 
                options={timeToggleOptions}
                onOptionChange={(id) => handleFilterChange("time", id)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Days Available</h3>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-medium text-gray-500">
                    {selectedDays.length === 7 ? "Any Day" : "Days"}
                  </h4>
                  {selectedDays.length > 0 && selectedDays.length < 7 && (
                    <button
                      onClick={() => handleFilterChange("day", "clear")}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <FilterChips 
                  filters={dayFilters}
                  onFilterChange={(id) => handleFilterChange("day", id)}
                />
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
                <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
                  {/* Price - Top Right */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg px-2 py-1 shadow-md">
                      <span className="text-lg font-bold text-green-700">£{r.hourly_rate ?? 30}</span>
                      <span className="text-xs font-normal text-green-600">/hr</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 pr-16">
                    {/* Profile Photo */}
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                      {r.avatar_url ? (
                        <Image 
                          src={r.avatar_url} 
                          alt={r.name ?? "Instructor"}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-green-500 flex items-center justify-center text-white font-bold text-3xl">
                          {(r.name ?? "I").split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {r.name ?? "Instructor"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {maskPostcode(r.base_postcode)} • {Math.round((r.distanceKm || 0) * 0.621371)} miles away
                      </p>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">⭐</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">4.8</span>
                      </div>
                      <div className="flex items-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {r.vehicle_type === "both" ? "Auto & Manual" : (r.vehicle_type ?? "Manual")}
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