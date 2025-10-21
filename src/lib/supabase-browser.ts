import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const createSupabaseBrowser = () => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        auth: { 
          persistSession: true, 
          detectSessionInUrl: true,
          flowType: 'pkce'
        } 
      }
    );
  }
  return supabaseClient;
};
