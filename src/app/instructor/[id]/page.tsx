"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface InstructorProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  description: string | null;
  gender: "male" | "female" | "other" | null;
  base_postcode: string | null;
  vehicle_type: "manual" | "auto" | "both" | null;
  hourly_rate: number | null;
  adi_badge: boolean | null;
  verification_status: "pending" | "approved" | "rejected" | null;
  service_radius_miles: number | null;
  languages: string[] | null;
  lat: number | null;
  lng: number | null;
}

export default function PublicInstructorProfilePage() {
  const params = useParams();
  const instructorId = params.id as string;
  const sb = createSupabaseBrowser();
  
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/instructor/${instructorId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  useEffect(() => {
    const fetchInstructorProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await sb
          .from("instructors")
          .select(`
            id,
            description,
            gender,
            base_postcode,
            vehicle_type,
            hourly_rate,
            adi_badge,
            verification_status,
            service_radius_miles,
            languages,
            lat,
            lng,
            profiles!inner(name, avatar_url)
          `)
          .eq("id", instructorId)
          .eq("verification_status", "approved")
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError("Instructor not found or not verified");
          } else {
            setError("Failed to load instructor profile");
          }
          return;
        }

        // Transform the data to match our interface
        const profile = (data as any).profiles as { name: string | null; avatar_url: string | null };
        const instructorProfile: InstructorProfile = {
          id: (data as any).id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          description: (data as any).description,
          gender: (data as any).gender,
          base_postcode: (data as any).base_postcode,
          vehicle_type: (data as any).vehicle_type,
          hourly_rate: (data as any).hourly_rate,
          adi_badge: (data as any).adi_badge,
          verification_status: (data as any).verification_status,
          service_radius_miles: (data as any).service_radius_miles,
          languages: (data as any).languages,
          lat: (data as any).lat,
          lng: (data as any).lng,
        };

        setInstructor(instructorProfile);
      } catch (err) {
        console.error("Error fetching instructor:", err);
        setError("Failed to load instructor profile");
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) {
      fetchInstructorProfile();
    }
  }, [instructorId, sb]);

  const getTownFromPostcode = (postcode: string | null): string => {
    if (!postcode) return "Bristol";
    
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

    const postcodePrefix = postcode.split(' ')[0];
    return postcodeToTown[postcodePrefix] || 'Bristol';
  };

  const maskPostcode = (postcode: string | null): string => {
    if (!postcode) return "Bristol";
    
    const parts = postcode.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0];
    }
    
    if (postcode.length >= 4) {
      return postcode.slice(0, 4);
    }
    
    return postcode;
  };

  const getVehicleTypeDisplay = (type: string | null): string => {
    switch (type) {
      case "both": return "Manual & Automatic";
      case "auto": return "Automatic";
      case "manual": return "Manual";
      default: return "Manual";
    }
  };

  const getGenderDisplay = (gender: string | null): string => {
    switch (gender) {
      case "male": return "Male";
      case "female": return "Female";
      case "other": return "Other";
      default: return "Other";
    }
  };

  const truncateDescription = (text: string, maxChars: number = 255): { truncated: string; isTruncated: boolean } => {
    if (text.length <= maxChars) {
      return { truncated: text, isTruncated: false };
    }
    
    // Find a good break point (end of sentence or word)
    let truncateAt = maxChars;
    const lastSentence = text.lastIndexOf('.', maxChars);
    const lastSpace = text.lastIndexOf(' ', maxChars);
    
    if (lastSentence > maxChars * 0.7) {
      truncateAt = lastSentence + 1;
    } else if (lastSpace > maxChars * 0.7) {
      truncateAt = lastSpace;
    }
    
    return { 
      truncated: text.substring(0, truncateAt) + '...', 
      isTruncated: true 
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-8 text-center">
          <div className="text-gray-300 text-6xl mb-4">👨‍🏫</div>
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Instructor Not Found</h1>
          <p className="text-gray-500 mb-6">{error || "This instructor profile is not available"}</p>
          <Link 
            href="/search" 
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Find Other Instructors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header with Large Profile Photo */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 px-6 pt-3 pb-1">
        <div className="max-w-md mx-auto text-center relative">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="absolute top-0 right-0 px-3 py-1 rounded-full bg-white shadow-2xl hover:shadow-2xl transition-all duration-200 flex items-center gap-1"
            style={{ boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 10px -2px rgba(0, 0, 0, 0.2)' }}
            title={shareCopied ? "URL copied!" : "Share instructor profile"}
          >
            {shareCopied ? (
              <>
                <span className="text-[10px] text-green-600 font-medium">Copied!</span>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            ) : (
              <>
                <span className="text-[10px] text-gray-600 font-medium">Share</span>
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </>
            )}
          </button>
          {/* Large Profile Photo */}
          <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-white/20 bg-white" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}>
            {instructor.avatar_url ? (
              <Image 
                src={instructor.avatar_url} 
                alt={instructor.name || "Instructor"}
                width={144}
                height={144}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-green-500 flex items-center justify-center text-white font-bold text-4xl">
                {(instructor.name || "I").split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          
          {/* Instructor Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-0">
            {(instructor.name || "Instructor").split(' ')[0]}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-1 pb-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* About Section */}
          {instructor.description && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Header Bar with Location, Rating, and Price */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                {/* Location */}
                <div className="flex items-center">
                  <span className="text-gray-600 mr-1">📍</span>
                  <span className="text-xl font-medium text-gray-900">
                    {getTownFromPostcode(instructor.base_postcode)}
                  </span>
                </div>
                
                {/* Rating */}
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-base">⭐</span>
                    ))}
                  </div>
                  <span className="text-gray-600 ml-1 text-sm">4.8</span>
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    £{instructor.hourly_rate || 30}/hr
                  </p>
                </div>
              </div>
              
              {/* About Content */}
              <div className="px-4 pt-2 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <div className="text-gray-700 leading-relaxed">
                {(() => {
                  const { truncated, isTruncated } = truncateDescription(instructor.description!);
                  const displayText = showFullDescription ? instructor.description! : truncated;
                  
                  console.log('Description length:', instructor.description!.length);
                  console.log('Is truncated:', isTruncated);
                  console.log('Show full:', showFullDescription);
                  
                  return (
                    <>
                      <p className="whitespace-pre-line">{displayText}</p>
                      {isTruncated && !showFullDescription && (
                        <button
                          onClick={() => setShowFullDescription(true)}
                          className="flex items-center justify-center w-full mt-3 p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      {isTruncated && showFullDescription && (
                        <button
                          onClick={() => setShowFullDescription(false)}
                          className="flex items-center justify-center w-full mt-3 p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Type:</span>
                <span className="font-medium text-gray-900">
                  {getVehicleTypeDisplay(instructor.vehicle_type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gender:</span>
                <span className="font-medium text-gray-900">
                  {getGenderDisplay(instructor.gender)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Languages:</span>
                <span className="font-medium text-gray-900">
                  {instructor.languages && instructor.languages.length > 0 
                    ? instructor.languages.join(', ') 
                    : 'English'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-gray-900">
                  {maskPostcode(instructor.base_postcode)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Badge:</span>
                <span className="font-medium text-gray-900">
                  {instructor.adi_badge ? 'ADI' : 'PDI'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href={`/booking/request?instructor=${instructor.id}`}
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-2xl transition-colors text-center"
            >
              Book a Lesson
            </Link>
          </div>

          {/* Back to Search */}
          <div className="text-center">
            <Link 
              href="/search" 
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
