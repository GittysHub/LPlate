"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface Booking {
  id: string;
  learner_id: string;
  start_at: string;
  end_at: string;
  price: number;
  status: string;
  learner: {
    name: string;
  } | null;
}

export default function InstructorCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Start in October 2025
  const [selectedDate, setSelectedDate] = useState(1); // Start with day 1 of October 2025
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create stable Supabase client instance
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  
  // Mock data for header - in real implementation, this would be calculated from actual bookings
  const lessonsToday = 11;
  const targetLessons = 20;
  const earningsToday = 990;
  const targetEarnings = 1080;
  
  const progressPercentage = (lessonsToday / targetLessons) * 100;
  const earningsProgressPercentage = (earningsToday / targetEarnings) * 100;

  // Generate calendar days for current month (Monday-Sunday week)
  const generateCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Convert Sunday=0 to Monday=0 system
    let firstDayOfWeek = firstDayOfMonth.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert Sunday=0 to Monday=6, then shift to Monday=0
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Fetch all bookings once when component mounts
  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use user.id directly as instructor_id
        const instructorId = user.id;

        // Fetch all bookings for the instructor
        const { data: bookingsData, error } = await (supabase.from('bookings') as any)
          .select(`
            id,
            learner_id,
            start_at,
            end_at,
            price,
            status
          `)
          .eq('instructor_id', instructorId)
          .order('start_at', { ascending: true });

        if (error) {
          console.error('Error fetching bookings:', error);
          return;
        }

        // Fetch learner names separately
        const learnerIds = bookingsData?.map((booking: any) => booking.learner_id) || [];
        const { data: profilesData, error: profilesError } = await (supabase.from('profiles') as any)
          .select('id, name')
          .in('id', learnerIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Combine bookings with learner names
        const bookingsWithNames = bookingsData?.map((booking: any) => ({
          ...booking,
          learner: profilesData?.find((profile: any) => profile.id === booking.learner_id) || null
        })) || [];

        setAllBookings(bookingsWithNames);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, []); // Empty dependency array - only run once on mount

  // Memoize filtered bookings to prevent unnecessary re-renders
  const bookingsForSelectedDate = useMemo(() => {
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
    const startOfDay = new Date(selectedDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    return allBookings.filter(booking => {
      const bookingDate = new Date(booking.start_at);
      return bookingDate >= startOfDay && bookingDate <= endOfDay;
    });
  }, [allBookings, currentDate, selectedDate]);

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Get learner first name
  const getFirstName = (fullName: string | null) => {
    if (!fullName) return 'Unknown';
    return fullName.split(' ')[0];
  };

  // Month navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(1); // Reset to first day of new month
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(1); // Reset to first day of new month
  };

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Header Panel */}
      <div className="bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Lesson Count */}
          <div className="text-2xl font-bold text-black">
            {lessonsToday}
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 mx-4">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Earnings */}
          <div className="text-lg font-semibold text-black">
            £{earningsToday}/{targetEarnings}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 py-6">
        {/* Month Header with Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-bold text-black">
            {getMonthName(currentDate)}
          </h2>
          
          <button 
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'].map((day, index) => (
            <div key={`day-${index}`} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, index) => (
            <div key={index} className="aspect-square flex items-center justify-center">
              {day && (
                <button
                  onClick={() => setSelectedDate(day)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-colors ${
                    selectedDate === day
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 py-6" key={`bookings-${selectedDate}`}>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-500 py-4">
              Loading bookings...
            </div>
          ) : bookingsForSelectedDate.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No lessons scheduled for this day
            </div>
          ) : (
            bookingsForSelectedDate.map((booking) => (
              <div key={`booking-${booking.id}-${selectedDate}`} className="flex items-center">
                <div className="w-1 h-8 bg-green-500 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="text-black font-medium">
                    {booking.learner?.name ? getFirstName(booking.learner.name) : 'Unknown'} - Lesson
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatTime(booking.start_at)}-{formatTime(booking.end_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl text-center">
            + Lesson
          </button>
          <button className="py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl text-center">
            + Block
          </button>
        </div>
      </div>
    </div>
  );
}
