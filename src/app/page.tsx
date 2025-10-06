"use client";

// Homepage component
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import SocialProofCarousel from "@/components/ui/SocialProofCarousel";
import { createSupabaseBrowser } from "@/lib/supabase";

interface InstructorData {
  id: string;
  name: string;
  avatar_url: string | null;
  hourly_rate: number;
  location: string;
  vehicle_type: string;
  description: string;
  rating: number;
}

export default function Home() {
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = createSupabaseBrowser();

  const fetchTopInstructors = useCallback(async () => {
    try {
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
        .not("lng", "is", null)
        .limit(8);

      if (error) throw error;

      interface SupabaseInstructorRow {
        id: string;
        description: string | null;
        base_postcode: string | null;
        vehicle_type: string | null;
        hourly_rate: number | null;
        gender: string | null;
        lat: number | null;
        lng: number | null;
        profiles: { name: string | null; avatar_url: string | null }[] | null;
      }

      const instructorData = (data as SupabaseInstructorRow[])?.map((r: SupabaseInstructorRow) => {
        const location = r.base_postcode ? getTownFromPostcode(r.base_postcode) : "Unknown";
        console.log('Instructor:', r.profiles && r.profiles.length > 0 ? r.profiles[0].name : "Unknown", 'Postcode:', r.base_postcode, 'Location:', location);
        return {
          id: r.id,
          name: r.profiles && r.profiles.length > 0 ? r.profiles[0].name ?? "Instructor" : "Instructor",
          avatar_url: r.profiles && r.profiles.length > 0 ? r.profiles[0].avatar_url ?? null : null,
          hourly_rate: r.hourly_rate ?? 30,
          location: location,
          vehicle_type: r.vehicle_type ?? "manual",
          description: r.description ?? "",
          rating: 4.8 // Placeholder rating
        };
      }) ?? [];

      setInstructors(instructorData);
    } catch (e) {
      console.error("Failed to fetch instructors:", e);
    } finally {
      setLoading(false);
    }
  }, [sb]);

  useEffect(() => {
    fetchTopInstructors();
  }, [fetchTopInstructors]);

  function getTownFromPostcode(postcode: string): string {
    // Map common Bristol area postcodes to town names
    const postcodeToTown: { [key: string]: string } = {
      'BS1': 'Bristol City Centre',
      'BS2': 'Bristol',
      'BS3': 'Bristol',
      'BS4': 'Bristol',
      'BS5': 'Bristol',
      'BS6': 'Bristol',
      'BS7': 'Bristol',
      'BS8': 'Bristol',
      'BS9': 'Bristol',
      'BS10': 'Bristol',
      'BS11': 'Bristol',
      'BS13': 'Bristol',
      'BS14': 'Bristol',
      'BS15': 'Bristol',
      'BS16': 'Bristol',
      'BS20': 'Bristol',
      'BS21': 'Clevedon',
      'BS22': 'Weston-super-Mare',
      'BS23': 'Weston-super-Mare',
      'BS24': 'Weston-super-Mare',
      'BS25': 'Winscombe',
      'BS26': 'Axbridge',
      'BS27': 'Cheddar',
      'BS28': 'Wells',
      'BS29': 'Burnham-on-Sea',
      'BS30': 'Bath',
      'BS31': 'Bath',
      'BS32': 'Bristol',
      'BS34': 'Bristol',
      'BS35': 'Thornbury',
      'BS36': 'Bristol',
      'BS37': 'Yate',
      'BS39': 'Radstock',
      'BS40': 'Bristol',
      'BS41': 'Bristol',
      'BS48': 'Portishead',
      'BS49': 'Nailsea',
      'BA1': 'Bath',
      'BA2': 'Bath',
      'BA3': 'Radstock',
      'BA4': 'Shepton Mallet',
      'BA5': 'Wells',
      'BA6': 'Glastonbury',
      'BA7': 'Yeovil',
      'BA8': 'Templecombe',
      'BA9': 'Wincanton',
      'BA10': 'Bruton',
      'BA11': 'Frome',
      'BA12': 'Warminster',
      'BA13': 'Westbury',
      'BA14': 'Trowbridge',
      'BA15': 'Bradford-on-Avon',
      'BA16': 'Street'
    };

    if (!postcode) return 'Bristol';
    
    // Extract the first part of the postcode (e.g., BS16 from BS16 2NR)
    const postcodePrefix = postcode.split(' ')[0];
    const town = postcodeToTown[postcodePrefix] || 'Bristol';
    
    // Debug logging
    console.log('Postcode:', postcode, 'Prefix:', postcodePrefix, 'Town:', town);
    
    return town;
  }

  const handleSearch = (query: string) => {
    // Redirect to search page with query
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

    const journeySteps = [
      {
        step: "1",
        title: "Find",
        description: "Find your\nperfect match",
        icon: "🔍",
        color: "from-blue-400 to-purple-500"
      },
      {
        step: "2", 
        title: "Learn",
        description: "Learn with\ncertified pros",
        icon: "📚",
        color: "from-orange-400 to-red-500"
      },
      {
        step: "3",
        title: "Pass",
        description: "Pass your\ndriving test!",
        icon: "🎉",
        color: "from-green-400 to-emerald-500"
      }
    ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Mobile First */}
      <section className="px-6 py-12 md:py-20">
        <div className="max-w-md mx-auto text-center">
                 <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 leading-tight mb-4">
                   Find the <span className="text-green-500 font-bold">BEST</span> instructor!
                 </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Find your perfect driving instructor in seconds
          </p>
          
          {/* Search Bar */}
                <div className="mb-12">
                  <SearchBar 
                    placeholder="Enter your postcode"
                    onSearch={handleSearch}
                  />
                </div>

          {/* Journey Steps */}
          <div className="mb-2">
                   <h2 className="text-xl font-normal text-gray-900 mb-3">Your learner journey made simple.</h2>
            <div className="grid grid-cols-3 gap-8">
              {journeySteps.map((step) => (
                <div key={step.step} className="text-center relative">
                        <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-3 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6 relative overflow-hidden group`}>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"></div>
                          <div className="relative z-10 group-hover:animate-bounce">
                            {step.icon}
                          </div>
                        </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-tight whitespace-pre-line">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Instructors Carousel */}
      <section className="px-6 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Top Rated Instructors Near You
          </h2>
          
          {loading ? (
            <div className="flex space-x-4 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden">
              <div className="flex space-x-4 animate-scroll" style={{ width: 'max-content' }}>
                {instructors.map((instructor) => (
                  <Link key={instructor.id} href={`/instructor/profile/${instructor.id}`} className="flex-shrink-0 w-64 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      {/* Profile Photo */}
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {instructor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {instructor.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-sm">⭐</span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{instructor.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {instructor.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            £{instructor.hourly_rate}/hr
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {instructor.vehicle_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Duplicate for seamless loop */}
                {instructors.map((instructor) => (
                  <Link key={`${instructor.id}-duplicate`} href={`/instructor/profile/${instructor.id}`} className="flex-shrink-0 w-64 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {instructor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {instructor.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-sm">⭐</span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{instructor.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {instructor.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            £{instructor.hourly_rate}/hr
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {instructor.vehicle_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link href="/search" className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-2xl transition-colors">
              View All Instructors
            </Link>
             </div>
           </div>
         </section>

         {/* Social Proof Section */}
         <section className="px-6 py-6 bg-white">
           <div className="max-w-6xl mx-auto">
             <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
               Qualified learners
             </h2>
             <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
               Hundreds of qualified drivers started right here!
             </p>
             
             <SocialProofCarousel />
           </div>
         </section>

         {/* Stats Section */}
      <section className="px-6 py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center">
            We&apos;ve got you covered
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-3xl mb-2">👨‍🏫</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">200+</div>
              <div className="text-sm text-gray-600">Qualified Instructors</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">2k+</div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">88%</div>
              <div className="text-sm text-gray-600">Pass Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-12 bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ready to Start Your Driving Journey?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of successful learners who found their perfect instructor.
          </p>
          <div className="space-y-4">
            <Link href="/search" className="block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-2xl transition-colors">
              Find Your Instructor
            </Link>
            <Link href="/auth/sign-in" className="block bg-white border-2 border-gray-200 hover:border-green-500 text-gray-700 font-semibold px-8 py-4 rounded-2xl transition-colors">
              Sign Up as Instructor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
