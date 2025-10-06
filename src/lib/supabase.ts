import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export const createSupabaseBrowser = () =>
  createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

// For server components, create a separate file
export const createClient = createSupabaseBrowser;
