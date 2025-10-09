"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";

const sb = createSupabaseBrowser();

interface User {
  id: string;
  email?: string;
}

interface Profile {
  role: string;
  name: string | null;
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const { data: { user } } = await sb.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await sb
          .from("profiles")
          .select("role, name")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      }
    } catch (e) {
      console.error("Failed to load user:", e);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await sb.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo size="sm" variant="horizontal" />
            </Link>
            <div className="animate-pulse bg-gray-200 h-10 w-20 rounded-xl"></div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo size="sm" variant="horizontal" />
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                href="/search"
                className="border border-gray-300 hover:border-green-500 text-gray-600 hover:text-green-500 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs whitespace-nowrap"
              >
                Find Instructors
              </Link>
              <Link
                href="/sign-in"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isInstructor = profile?.role === "instructor";
  const isLearner = profile?.role === "learner";

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="sm" variant="horizontal" />
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link
              href="/search"
              className={`border border-gray-300 hover:border-green-500 px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                pathname === "/search" 
                  ? "border-green-500 text-green-500" 
                  : "text-gray-600 hover:text-green-500"
              }`}
            >
              Find Instructors
            </Link>
            
            {/* Hamburger Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="border border-gray-300 hover:border-green-500 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center"
                aria-label="Menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <div className={`h-1 bg-gray-600 transition-all duration-200 ${isMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></div>
                  <div className={`h-1 bg-gray-600 transition-all duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-0.5' : ''}`}></div>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">
                      Hi, {profile?.name || "User"}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {profile?.role || "User"}
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      href={isInstructor ? "/instructor" : "/dashboard"}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      📊 Dashboard
                    </Link>
                    
                    {isLearner && (
                      <Link
                        href="/bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        📅 My Bookings
                      </Link>
                    )}
                    
                    {isInstructor && (
                      <>
                        <Link
                          href="/instructor/bookings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          📅 My Bookings
                        </Link>
                        <Link
                          href="/instructor/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          👤 Profile
                        </Link>
                        <Link
                          href="/instructor/availability"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          📅 Availability
                        </Link>
                      </>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
}
