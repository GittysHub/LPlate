"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Logo from "@/components/ui/Logo";

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
  const sb = createSupabaseBrowser();
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if we have a valid session for password reset
    const checkSession = async () => {
      try {
        console.log('[RESET] Checking session for password reset...');
        
        // First, try to get session from URL hash (for password reset links)
        const { data: { session }, error: sessionError } = await sb.auth.getSession();
        
        if (sessionError) {
          console.error('[RESET] Session error:', sessionError);
          setErr("Invalid or expired reset link. Please request a new password reset.");
          return;
        }
        
        if (session) {
          console.log('[RESET] Valid session found:', { user: session.user?.email });
          setIsValidSession(true);
        } else {
          // If no session, check if we're coming from a password reset redirect
          // and try to extract session from URL hash
          console.log('[RESET] No session found, checking URL hash...');
          
          // Wait a moment for Supabase to process the URL hash
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: retrySession } } = await sb.auth.getSession();
          if (retrySession) {
            console.log('[RESET] Session found on retry:', { user: retrySession.user?.email });
            setIsValidSession(true);
          } else {
            console.log('[RESET] No valid session found');
            setErr("Invalid or expired reset link. Please request a new password reset.");
          }
        }
      } catch (error) {
        console.error('[RESET] Unexpected error:', error);
        setErr("Invalid or expired reset link. Please request a new password reset.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [sb.auth]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setErr("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await sb.auth.updateUser({
        password: password
      });
      if (error) setErr(error.message);
      else {
        // Password updated successfully
        console.log('[RESET] Password updated successfully');
        
        // If this is a new user sign-up (has role param), create profile and redirect to profile setup
        if (roleParam) {
          console.log('[RESET] Creating profile for new user with role:', roleParam);
          
          // Get the current user
          const { data: { user } } = await sb.auth.getUser();
          if (user) {
            // Create profile for new user
            const { error: profileError } = await (sb.from("profiles") as any).insert({
              id: user.id,
              role: roleParam as "learner" | "instructor",
              name: user.email?.split("@")[0] || "User",
              email: user.email,
            });
            
            if (profileError) {
              console.error('[RESET] Profile creation error:', profileError);
              setErr("Password updated but failed to create profile. Please contact support.");
              return;
            }
            
            console.log('[RESET] Profile created successfully, redirecting to profile setup');
            // Redirect to appropriate profile setup page
            if (roleParam === "instructor") {
              router.push("/instructor/profile");
            } else {
              router.push("/learner/profile");
            }
          } else {
            setErr("Password updated but user not found. Please try signing in.");
          }
        } else {
          // Existing user password reset - redirect to dashboard
          console.log('[RESET] Existing user password reset, redirecting to dashboard');
          router.push("/");
        }
      }
    } catch {
      setErr("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="horizontal" />
          </div>
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Invalid Reset Link</h2>
            <p className="text-gray-600 text-base">
              {err || "This password reset link is invalid or has expired."}
            </p>
            <a
              href="/forgot-password"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
            >
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="horizontal" />
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
          {roleParam ? "🎉 Complete Your Account" : "🔑 Set New Password"}
        </h1>
        
        {roleParam && (
          <p className="text-gray-600 text-center mb-6">
            Welcome to L Plate! Set your password to complete your {roleParam} account setup.
          </p>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* New Password Field */}
          <div>
            <input
              type="password"
              className="w-full border-2 border-gray-300 rounded-xl px-5 py-5 text-lg text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:shadow-lg shadow-md transition-all duration-300 hover:shadow-lg"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <input
              type="password"
              className="w-full border-2 border-gray-300 rounded-xl px-5 py-5 text-lg text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:shadow-lg shadow-md transition-all duration-300 hover:shadow-lg"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* Error Message */}
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-base text-center">{err}</p>
            </div>
          )}

          {/* Update Password Button */}
          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-5 px-6 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading 
              ? (roleParam ? "Creating account..." : "Updating password...") 
              : (roleParam ? "Complete Account Setup" : "Update Password")
            }
          </button>

          {/* Back to Sign In Link */}
          <div className="text-center">
            <a
              href="/sign-in"
              className="text-green-600 text-base font-medium hover:text-green-700 transition-colors"
            >
              Back to sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
