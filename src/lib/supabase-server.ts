import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

export const createSupabaseServer = async () => {
  const cookieStore = await cookies();
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value ?? null,
          setItem: (key: string, value: string) => {
            cookieStore.set(key, value);
          },
          removeItem: (key: string) => {
            cookieStore.delete(key);
          },
        },
      },
    }
  );
};