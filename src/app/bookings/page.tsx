"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { fetchInstructorsByIds } from "@/lib/instructors";
import Link from "next/link";
import Image from "next/image";
import SocialProofSubmissionForm from "@/components/ui/SocialProofSubmissionForm";

const sb = createSupabaseBrowser();

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  price: number;
  note: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  instructor: {
    name: string | null;
    avatar_url: string | null;
    phone: string | null;
    base_postcode: string | null;
    vehicle_type: "manual" | "auto" | "both" | null;
    hourly_rate: number | null;
  };
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newDuration, setNewDuration] = useState<number>(120); // Default to 2 hours
  const router = useRouter();

  const loadBookings = useCallback(async () => {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Fetch bookings first
      const { data: bookingsData, error: bookingsError } = await sb
        .from("bookings")
        .select(`
          id,
          start_at,
          end_at,
          price,
          note,
          status,
          instructor_id
        `)
        .eq("learner_id", user.id)
        .order("start_at", { ascending: false });

      if (bookingsError) {
        console.error("Bookings query error:", bookingsError);
        throw bookingsError;
      }

      // Fetch instructor profiles using enhanced query with missing ID detection
      const instructorIds = bookingsData?.map((b: any) => b.instructor_id) || [];
      const uniqueInstructorIds = [...new Set(instructorIds)];
      
      const instructorResult = await fetchInstructorsByIds(uniqueInstructorIds);
      
      if (instructorResult.missingIds.length > 0) {
        console.warn(`⚠️ Missing instructors for IDs: ${instructorResult.missingIds.join(', ')}`);
      }

      // Create lookup map for efficient instructor matching
      const instructorsById = new Map<string, any>();
      instructorResult.instructors.forEach(instructor => {
        instructorsById.set(instructor.id.toLowerCase().trim(), instructor);
      });
      
      // Combine the data using enhanced lookup
      const formattedBookings: Booking[] = (bookingsData || []).map((booking: any) => {
        const normalizedBookingId = booking.instructor_id.toLowerCase().trim();
        const instructor = instructorsById.get(normalizedBookingId);
        
        return {
          id: booking.id,
          start_at: booking.start_at,
          end_at: booking.end_at,
          price: booking.price,
          note: booking.note,
          status: booking.status,
          instructor: instructor ? {
            name: instructor.name || "Instructor",
            avatar_url: instructor.avatar_url ?? null,
            phone: instructor.phone ?? null,
            base_postcode: null, // Not available from profiles table
            vehicle_type: null,  // Not available from profiles table
            hourly_rate: null,   // Not available from profiles table
          } : {
            name: "Instructor unavailable",
          avatar_url: null,
            phone: null,
          base_postcode: null,
          vehicle_type: null,
          hourly_rate: null,
        },
        };
      });

      setBookings(formattedBookings);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleRescheduleRequest = (booking: Booking) => {
    setSelectedBooking(booking);
    // Calculate current duration from booking
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    const durationMs = end.getTime() - start.getTime();
    const durationMins = Math.round(durationMs / (1000 * 60));
    setNewDuration(durationMins);
    setRescheduleModalOpen(true);
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "confirmed":
        return "✓";
      case "pending":
        return "⏳";
      case "cancelled":
        return "✗";
      case "completed":
        return "✓";
      default:
        return "?";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-poppins flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-poppins flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadBookings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <Link
              href="/search"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Book New Lesson
            </Link>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-gray-400">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by finding an instructor and booking your first lesson.</p>
            <Link
              href="/search"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Find an Instructor
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-4 sm:p-6 pr-2 sm:pr-4">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                        {booking.instructor.avatar_url ? (
                          <Image
                            src={booking.instructor.avatar_url}
                            alt={`${booking.instructor.name}'s avatar`}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                            {(booking.instructor.name ?? "I").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                    {/* Instructor Info - Full Width */}
                    <div className="flex-1">
                      {/* Row 1: Name + Status */}
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                          {booking.instructor.name?.split(' ')[0] || 'Instructor'}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          <span className="mr-1">{getStatusIcon(booking.status)}</span>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      
                      {/* Row 2: Location + Price */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-600 text-sm sm:text-base">
                          Near {booking.instructor.base_postcode || "Bristol"}
                        </p>
                        <p className="text-gray-900 text-sm">
                          £{booking.price}
                        </p>
                        </div>
                      
                      {/* Row 3: Vehicle Type + Phone */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-500 text-xs">
                          {booking.instructor.vehicle_type === "both" ? "Manual & Auto" : (booking.instructor.vehicle_type ?? "Manual")}
                        </p>
                        {booking.instructor.phone && (
                          <p className="text-green-600 font-medium text-sm">
                            {booking.instructor.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lesson Details */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Lesson Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Date:</strong> {formatDate(booking.start_at)}</p>
                          <p><strong>Time:</strong> {formatTime(booking.start_at)} - {formatTime(booking.end_at)}</p>
                          <p><strong>Duration:</strong> {(() => {
                            const start = new Date(booking.start_at);
                            const end = new Date(booking.end_at);
                            const durationMs = end.getTime() - start.getTime();
                            const durationMins = Math.round(durationMs / (1000 * 60));
                            if (durationMins === 60) return "1 hour";
                            if (durationMins === 120) return "2 hours";
                            return `${durationMins} minutes`;
                          })()}</p>
                        </div>
                      </div>
                      
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      {(() => {
                        const now = new Date();
                        const lessonStart = new Date(booking.start_at);
                        const hoursUntilLesson = (lessonStart.getTime() - now.getTime()) / (1000 * 60 * 60);
                        
                        
                        // Cancel lesson if more than 72 hours away (confirmed or pending)
                        if (hoursUntilLesson > 72 && (booking.status === "confirmed" || booking.status === "pending")) {
                          return (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button className="text-red-600 hover:text-red-700 text-sm font-medium py-2 px-4 rounded-lg border border-red-200 hover:bg-red-50 transition-colors w-full sm:w-auto">
                                Cancel Lesson
                              </button>
                              <button 
                                onClick={() => handleRescheduleRequest(booking)}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                              >
                                Request Change
                              </button>
                            </div>
                          );
                        }
                        
                        // Request change if within 72 hours
                        if (hoursUntilLesson <= 72 && hoursUntilLesson > 0 && booking.status === "confirmed") {
                          return (
                            <button 
                              onClick={() => handleRescheduleRequest(booking)}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                            >
                              Request Change
                            </button>
                          );
                        }
                        
                        // Leave feedback if lesson is completed OR if lesson is in the past
                        if (booking.status === "completed" || (hoursUntilLesson < 0 && booking.status === "confirmed")) {
                          return (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto">
                                Leave Feedback
                        </button>
                              <button 
                                onClick={() => window.location.href = 'mailto:staff@lplateapp.com?subject=Need help with completed lesson&body=Hi, I need help with my lesson that was completed on ' + formatDate(booking.start_at)}
                                className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                              >
                                Need Help?
                        </button>
                            </div>
                          );
                        }
                        
                        // Default case - no action available
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Your Success Section */}
      {bookings.some(b => b.status === 'completed') && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Congratulations on Your Success!
              </h2>
              <p className="text-gray-600">
                Share your driving test certificate to inspire other learners
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <SocialProofSubmissionForm 
                instructorId="placeholder" // This would need to be dynamic based on completed bookings
                onSuccess={() => {
                  // Refresh or show success message
                  console.log("Certificate submitted successfully!");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Request Modal */}
      {rescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Change</h3>
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current lesson:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{formatDate(selectedBooking.start_at)}</p>
                  <p className="text-sm text-gray-600">{formatTime(selectedBooking.start_at)} - {formatTime(selectedBooking.end_at)}</p>
                  <p className="text-sm text-gray-600">with {selectedBooking.instructor.name}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred new date and time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                >
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reschedule (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Please let your instructor know why you need to reschedule..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement reschedule request submission
                    alert("Reschedule request sent! Your instructor will be notified.");
                    setRescheduleModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
