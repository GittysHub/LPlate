"use client";
import { useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Logo from "@/components/ui/Logo";
import { absUrl } from "@/lib/baseUrl";

export default function SignUp() {
  const sb = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"learner"|"instructor">("learner");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: absUrl(`/auth/reset-password?role=${role}`) }
      });
      if (error) setErr(error.message);
      else setSent(true);
    } catch {
      setErr("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="horizontal" />
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Welcome to L Plate! 🎊
        </h1>

        {/* Dynamic Car Image */}
        <div className="flex justify-center mb-8">
          <Image 
            src={role === "learner" ? "/CarSprout.png" : "/CarPro.png"} 
            alt={role === "learner" ? "Learner car with graduation cap" : "Instructor car"} 
            width={128}
            height={128}
            className="w-32 h-32 object-contain transition-all duration-300"
          />
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Check your email</h2>
            <p className="text-gray-600 text-lg">
              We&apos;ve sent a magic link to <strong className="text-gray-900">{email}</strong>
            </p>
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-base">
              Click the link in your email to complete your account setup
            </p>
            
            <button 
              onClick={() => setSent(false)}
              className="text-green-600 text-lg font-medium hover:text-green-700 transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            {/* Email Field */}
            <div>
              <input
                type="email"
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-5 text-lg text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:shadow-lg shadow-md transition-all duration-300 hover:shadow-lg"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Role Selection - Toggle Switch */}
            <div className="flex items-center justify-center">
              <div className="relative bg-gray-200 rounded-full p-1 flex w-80">
                {/* Sliding Background */}
                <div 
                  className={`absolute top-1 bottom-1 w-1/2 bg-green-500 rounded-full transition-transform duration-300 ease-in-out ${
                    role === "instructor" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                
                {/* Learner Button */}
                <button
                  type="button"
                  onClick={() => setRole("learner")}
                  className={`relative z-10 flex-1 py-3 px-6 rounded-full text-lg font-semibold transition-colors duration-300 ${
                    role === "learner"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Learner
                </button>
                
                {/* Instructor Button */}
                <button
                  type="button"
                  onClick={() => setRole("instructor")}
                  className={`relative z-10 flex-1 py-3 px-6 rounded-full text-lg font-semibold transition-colors duration-300 ${
                    role === "instructor"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Instructor
                </button>
              </div>
            </div>

            {/* Error Message */}
            {err && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-base text-center">{err}</p>
              </div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-5 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <a
                href="/sign-in"
                className="text-green-600 text-base font-medium hover:text-green-700 transition-colors"
              >
                Already have an account? Sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
