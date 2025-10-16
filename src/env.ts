import { z } from "zod";

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key required").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key required").optional(),
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "Invalid Stripe secret key").optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_", "Invalid Stripe publishable key").optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().startsWith("whsec_", "Invalid Stripe Connect webhook secret").optional(),
  STRIPE_PAYMENTS_WEBHOOK_SECRET: z.string().startsWith("whsec_", "Invalid Stripe Payments webhook secret").optional(),
  
  // Platform Configuration
  PLATFORM_FEE_PCT: z.string().transform(Number).pipe(z.number().min(0).max(100)).optional(),
  
  // Site Configuration
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
