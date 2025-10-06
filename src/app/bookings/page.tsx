"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const sb = createClient();

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
    base_postcode: string | null;
    vehicle_type: "manual" | "auto" | "both" | null;
    hourly_rate: number | null;
  };
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadBookings = useCallback(async () => {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await sb
        .from("bookings")
        .select(`
          id,
          start_at,
          end_at,
          price,
          note,
          status,
          instructor:instructor_id(
            name,
            avatar_url,
            base_postcode,
            vehicle_type,
            hourly_rate
          )
        `)
        .eq("learner_id", user.id)
        .order("start_at", { ascending: false });

      if (error) throw error;

      interface SupabaseBookingRow {
        id: string;
        start_at: string;
        end_at: string;
        price: number;
        note: string | null;
        status: "pending" | "confirmed" | "cancelled" | "completed";
        instructor: {
          name: string | null;
          avatar_url: string | null;
          base_postcode: string | null;
          vehicle_type: "manual" | "auto" | "both" | null;
          hourly_rate: number | null;
        } | null;
      }

      const formattedBookings: Booking[] = (data || []).map((b: SupabaseBookingRow) => ({
        id: b.id,
        start_at: b.start_at,
        end_at: b.end_at,
        price: b.price,
        note: b.note,
        status: b.status,
        instructor: {
          name: b.instructor?.name || "Instructor",
          avatar_url: b.instructor?.avatar_url ?? null,
          base_postcode: b.instructor?.base_postcode ?? null,
          vehicle_type: b.instructor?.vehicle_type ?? null,
          hourly_rate: b.instructor?.hourly_rate ?? null,
        },
      }));

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">Manage your driving lessons</p>
            </div>
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
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Instructor Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-gray-50">
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
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.instructor.name}
                        </h3>
                        <p className="text-gray-600">
                          Near {booking.instructor.base_postcode || "Bristol"}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            {booking.instructor.vehicle_type === "both" 
                              ? "Manual & Auto" 
                              : (booking.instructor.vehicle_type ?? "Manual")}
                          </span>
                          <span>£{booking.price}/lesson</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        <span className="mr-1">{getStatusIcon(booking.status)}</span>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Lesson Details */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Lesson Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Date:</strong> {formatDate(booking.start_at)}</p>
                          <p><strong>Time:</strong> {formatTime(booking.start_at)} - {formatTime(booking.end_at)}</p>
                          <p><strong>Duration:</strong> 2 hours</p>
                        </div>
                      </div>
                      
                      {booking.note && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {booking.note}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex justify-end space-x-3">
                      {booking.status === "pending" && (
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          Cancel Booking
                        </button>
                      )}
                      {booking.status === "confirmed" && (
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
