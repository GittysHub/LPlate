"use client";

import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

interface Profile {
  name: string | null;
  role: string;
  gender?: string | null;
  profile_picture?: string | null;
}

export default function InstructorDashboard() {
  const sb = createSupabaseBrowser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mock earnings data - replace with real data later
  const weeklyEarnings = 0; // £0 earned this week
  const weeklyTarget = 500; // £500 target
  const bookedAmount = 0; // £0 booked this week
  
  // Calculate progress percentage for the circle
  const progressPercentage = Math.min((weeklyEarnings / weeklyTarget) * 100, 100);
  
  // Determine which money stack image to use based on earnings
  const getMoneyStackImage = () => {
    const earningsRatio = weeklyEarnings / weeklyTarget;
    if (earningsRatio >= 0.8) return "Money%20x6.png"; // 6 stacks for high earnings
    if (earningsRatio >= 0.4) return "Money%20x4.png"; // 4 stacks for medium earnings
    return "Money%20x2.png"; // 2 stacks for low earnings
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
                 const { data: prof } = await sb
                   .from("profiles")
                   .select("name, role, gender, profile_picture")
                   .eq("id", user.id)
                   .single();
          setProfile(prof);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Dashboard</h1>
        
        {/* Week Recap */}
        <div className="space-y-4 mb-1">
          {/* Detailed Earnings Card */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2 text-left">Weekly Earnings</h2>
            <div className="flex items-center space-x-6">
              {/* Circular Progress */}
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  {/* Progress circle (earnings progress) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="100, 100"
                    strokeDashoffset={100 - progressPercentage}
                  />
                </svg>
                {/* Center content - Money bag with amount */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img 
                    src={`https://bvlilxbhipbworirvzcl.supabase.co/storage/v1/object/public/Icons/${getMoneyStackImage()}`}
                    alt="Money bag" 
                    className="w-6 h-6 object-contain mb-1"
                  />
                  <div className="text-xs font-bold text-gray-900">£{weeklyEarnings}</div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">£{bookedAmount} booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">£{weeklyEarnings} completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-2xl">{profile?.gender === "male" ? "👨‍🏫" : "👩‍🏫"}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    <span className="font-bold">0</span>
                  </div>
                </div>
                <div className="text-sm font-normal text-gray-600">Lessons</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    <span className="font-bold">0</span>
                  </div>
                </div>
                <div className="text-sm font-normal text-gray-600">Active Students</div>
              </div>
            </div>
          </div>

        </div>

        {/* Header */}
        <div className="mb-1 py-4 px-6">
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Hi {profile?.name || "Instructor"}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your business
          </p>
        </div>

               {/* Quick Actions Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 {/* Profile Card */}
                 <Link
                   href="/instructor/profile"
                   className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200 group"
                 >
                   <div className="flex items-center mb-4">
                     <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-50 transition-colors overflow-hidden shadow-sm">
                       {profile?.profile_picture ? (
                         <img 
                           src={profile.profile_picture} 
                           alt="Profile" 
                           className="w-full h-full object-cover rounded-lg"
                         />
                       ) : (
                         <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                         </svg>
                       )}
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 ml-4">Profile</h3>
                   </div>
                   <p className="text-gray-600 text-sm">
                     Update your instructor details
                   </p>
                 </Link>

                 {/* Earnings Card */}
                 <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4">
                   <div className="flex items-center mb-4">
                     <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                       <span className="text-2xl">💰</span>
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 ml-4">Earnings</h3>
                   </div>
                   <p className="text-gray-600 text-sm">
                     Track your income*
                   </p>
                 </div>

                 {/* Bookings Card */}
                 <Link
                   href="/instructor/bookings"
                   className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200 group"
                 >
                   <div className="flex items-center mb-4">
                     <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-50 transition-colors shadow-sm">
                       <span className="text-2xl">📅</span>
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 ml-4">Bookings</h3>
                   </div>
                   <p className="text-gray-600 text-sm">
                     Manage your lessons
                   </p>
                 </Link>

                 {/* Working Hours Card */}
                 <Link
                   href="/instructor/availability"
                   className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200 group"
                 >
                   <div className="flex items-center mb-4">
                     <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-50 transition-colors shadow-sm">
                       <span className="text-2xl">⏰</span>
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 ml-4">Working Hours</h3>
                   </div>
                   <p className="text-gray-600 text-sm">
                     Set your availability
                   </p>
                 </Link>
               </div>
      </div>
    </main>
  );
}
