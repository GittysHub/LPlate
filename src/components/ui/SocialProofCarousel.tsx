"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface Certificate {
  id: string;
  learnerName: string;
  instructorName: string;
  testDate: string;
  imageUrl: string;
  location: string;
  testimonial?: string;
}

export default function SocialProofCarousel() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      console.log("🚀 SocialProofCarousel fetchCertificates started - NEW VERSION");
      try {
        const sb = createSupabaseBrowser();
        
        // Try a different approach - fetch data separately
        const { data: submissionsData, error: submissionsError } = await sb
          .from('social_proof_submissions')
          .select(`
            id,
            certificate_image_url,
            test_date,
            test_location,
            testimonial,
            learner_id,
            instructor_id
          `)
          .eq('status', 'approved')
          .order('test_date', { ascending: false })
          .limit(12);

        if (submissionsError) {
          console.error("Supabase submissions query error:", submissionsError);
          throw submissionsError;
        }

        console.log("Submissions data:", submissionsData);

        // Now fetch learner names
        const learnerIds = submissionsData?.map(s => s.learner_id) || [];
        console.log("Learner IDs to fetch:", learnerIds);
        
        const { data: learnerData, error: learnerError } = await sb
          .from('profiles')
          .select('id, name')
          .in('id', learnerIds);

        if (learnerError) {
          console.error("Supabase learner query error:", learnerError);
          console.error("Learner error details:", learnerError);
        }

        console.log("Learner data:", learnerData);
        console.log("Learner data length:", learnerData?.length);

        // Fetch instructor names
        const instructorIds = submissionsData?.map(s => s.instructor_id) || [];
        console.log("Instructor IDs to fetch:", instructorIds);
        
        const { data: instructorData, error: instructorError } = await sb
          .from('instructors')
          .select(`
            id,
            profiles!instructors_id_fkey(name)
          `)
          .in('id', instructorIds);

        if (instructorError) {
          console.error("Supabase instructor query error:", instructorError);
          console.error("Instructor error details:", instructorError);
        }

        console.log("Instructor data:", instructorData);
        console.log("Instructor data length:", instructorData?.length);

        // Create lookup maps
        const learnerMap = new Map(learnerData?.map(l => [l.id, l.name]) || []);
        const instructorMap = new Map(instructorData?.map(i => [i.id, i.profiles?.name]) || []);

        console.log("Learner map:", learnerMap);
        console.log("Instructor map:", instructorMap);

        // Check if we have any data
        if (!submissionsData || submissionsData.length === 0) {
          console.log("No submissions data found, using mock data");
          const mockCertificates: Certificate[] = [
            {
              id: "mock-1",
              learnerName: "Sarah Johnson",
              instructorName: "Mike Wilson",
              testDate: "2024-01-15",
              imageUrl: "/social-proof/certificate1.jpg",
              location: "Bristol"
            },
            {
              id: "mock-2", 
              learnerName: "James Smith",
              instructorName: "Emma Davis",
              testDate: "2024-01-22",
              imageUrl: "/social-proof/certificate2.jpg",
              location: "Bath"
            },
            {
              id: "mock-3",
              learnerName: "Emily Brown",
              instructorName: "John Smith",
              testDate: "2024-02-05",
              imageUrl: "/social-proof/certificate3.jpg",
              location: "Bristol"
            }
          ];
          setCertificates(mockCertificates);
          return;
        }

        // Transform Supabase data to our interface
        const certificatesData: Certificate[] = (submissionsData || []).map((row: any) => {
          console.log("Processing row:", row);
          
          const learnerName = learnerMap.get(row.learner_id) || "Learner";
          const instructorName = instructorMap.get(row.instructor_id) || "Instructor";
          
          console.log(`Final names - Learner: ${learnerName}, Instructor: ${instructorName}`);
          
          return {
            id: row.id,
            learnerName: learnerName,
            instructorName: instructorName,
            testDate: row.test_date,
            imageUrl: row.certificate_image_url,
            location: row.test_location,
            testimonial: row.testimonial
          };
        });

        // Shuffle for variety
        const shuffledCertificates = [...certificatesData].sort(() => Math.random() - 0.5);
        setCertificates(shuffledCertificates);

      } catch (err) {
        console.error("Failed to fetch certificates:", err);
        // Fallback to empty array
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-48 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="w-full h-32 bg-gray-200 rounded-xl mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="flex space-x-4 animate-scroll-slow" style={{ width: 'max-content' }}>
        {certificates.map((cert) => (
          <div key={cert.id} className="flex-shrink-0 w-48 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
            {/* Certificate Image */}
            <div className="w-full h-32 rounded-xl mb-3 overflow-hidden relative">
              {cert.imageUrl && cert.imageUrl !== "/api/placeholder/200/150" ? (
                <Image
                  src={cert.imageUrl}
                  alt={`${cert.learnerName.split(' ')[0]}'s certificate`}
                  width={192}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="text-xs text-green-700 font-semibold">PASSED!</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Certificate Details */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {cert.learnerName.split(' ')[0]}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  with {cert.instructorName.split(' ')[0]}
                </p>
              </div>
              <div className="text-right ml-2">
                <p className="text-xs text-gray-500">
                  {new Date(cert.testDate).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short'
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {cert.location?.replace(' Test Centre', '').replace(' Test Center', '')}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Duplicate for seamless loop */}
        {certificates.map((cert) => (
          <div key={`${cert.id}-duplicate`} className="flex-shrink-0 w-48 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
            <div className="w-full h-32 rounded-xl mb-3 overflow-hidden relative">
              {cert.imageUrl && cert.imageUrl !== "/api/placeholder/200/150" ? (
                <Image
                  src={cert.imageUrl}
                  alt={`${cert.learnerName.split(' ')[0]}'s certificate`}
                  width={192}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="text-xs text-green-700 font-semibold">PASSED!</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {cert.learnerName.split(' ')[0]}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  with {cert.instructorName.split(' ')[0]}
                </p>
              </div>
              <div className="text-right ml-2">
                <p className="text-xs text-gray-500">
                  {new Date(cert.testDate).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short'
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {cert.location?.replace(' Test Centre', '').replace(' Test Center', '')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
