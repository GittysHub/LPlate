"use client";

import { useState, useEffect } from "react";

interface Certificate {
  id: string;
  learnerName: string;
  instructorName: string;
  testDate: string;
  imageUrl: string;
  location: string;
}

export default function SocialProofCarousel() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with real data from Supabase
    const mockCertificates: Certificate[] = [
      {
        id: "1",
        learnerName: "Sarah Johnson",
        instructorName: "Mike Wilson",
        testDate: "2024-01-15",
        imageUrl: "/api/placeholder/200/150",
        location: "Bristol"
      },
      {
        id: "2", 
        learnerName: "James Smith",
        instructorName: "Emma Davis",
        testDate: "2024-01-22",
        imageUrl: "/api/placeholder/200/150",
        location: "Bath"
      },
      {
        id: "3",
        learnerName: "Emily Brown",
        instructorName: "John Smith",
        testDate: "2024-02-05",
        imageUrl: "/api/placeholder/200/150",
        location: "Bristol"
      },
      {
        id: "4",
        learnerName: "David Wilson",
        instructorName: "Sarah Johnson",
        testDate: "2024-02-12",
        imageUrl: "/api/placeholder/200/150",
        location: "Bath"
      },
      {
        id: "5",
        learnerName: "Lisa Taylor",
        instructorName: "Mike Wilson",
        testDate: "2024-02-18",
        imageUrl: "/api/placeholder/200/150",
        location: "Bristol"
      },
      {
        id: "6",
        learnerName: "Tom Anderson",
        instructorName: "Emma Davis",
        testDate: "2024-02-25",
        imageUrl: "/api/placeholder/200/150",
        location: "Bath"
      }
    ];

    // Shuffle the certificates for mixed order
    const shuffledCertificates = [...mockCertificates].sort(() => Math.random() - 0.5);
    setCertificates(shuffledCertificates);
    setLoading(false);
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
            <div className="w-full h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-xs text-green-700 font-semibold">PASSED!</div>
              </div>
            </div>
            
            {/* Certificate Details */}
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {cert.learnerName}
              </h4>
              <p className="text-xs text-gray-600">
                with {cert.instructorName}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(cert.testDate).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })} • {cert.location}
              </p>
            </div>
          </div>
        ))}
        
        {/* Duplicate for seamless loop */}
        {certificates.map((cert) => (
          <div key={`${cert.id}-duplicate`} className="flex-shrink-0 w-48 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
            <div className="w-full h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-xs text-green-700 font-semibold">PASSED!</div>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {cert.learnerName}
              </h4>
              <p className="text-xs text-gray-600">
                with {cert.instructorName}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(cert.testDate).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })} • {cert.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
