export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'learner' | 'instructor'
          postcode: string | null
          phone: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      instructors: {
        Row: {
          id: string
          description: string | null
          gender: 'male' | 'female' | 'other'
          base_postcode: string
          vehicle_type: 'manual' | 'auto' | 'both'
          hourly_rate: number
          adi_badge: boolean
          verification_status: 'pending' | 'approved' | 'rejected'
          lat: number | null
          lng: number | null
          service_radius_miles: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['instructors']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['instructors']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          learner_id: string
          instructor_id: string
          start_at: string
          end_at: string
          price: number
          note: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      availability: {
        Row: {
          id: string
          instructor_id: string
          start_at: string
          end_at: string
          is_recurring: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['availability']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['availability']['Insert']>
      }
      social_proof_submissions: {
        Row: {
          id: string
          learner_id: string
          instructor_id: string
          certificate_image_url: string
          test_date: string
          test_location: string
          testimonial: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['social_proof_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['social_proof_submissions']['Insert']>
      }
      stripe_connect_accounts: {
        Row: {
          id: string
          instructor_id: string
          stripe_account_id: string
          account_type: 'express' | 'standard' | 'custom'
          charges_enabled: boolean
          payouts_enabled: boolean
          details_submitted: boolean
          requirements: any
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stripe_connect_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['stripe_connect_accounts']['Insert']>
      }
      orders: {
        Row: {
          id: string
          learner_id: string
          instructor_id: string
          stripe_payment_intent_id: string
          stripe_balance_txn_id: string | null
          transfer_group: string
          instructor_rate_pence: number
          platform_fee_pence: number
          total_amount_pence: number
          hours_booked_minutes: number
          currency: string
          status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      lessons: {
        Row: {
          id: string
          instructor_id: string
          learner_id: string
          start_time: string
          end_time: string
          duration_minutes: number
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          completed_at: string | null
          price_pence: number
          order_id: string | null
          booking_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>
      }
      credit_ledger: {
        Row: {
          id: string
          learner_id: string
          instructor_id: string
          delta_minutes: number
          source: 'PURCHASE' | 'CONSUMPTION' | 'REFUND' | 'ADJUSTMENT'
          order_id: string | null
          lesson_id: string | null
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['credit_ledger']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['credit_ledger']['Insert']>
      }
      payout_instructions: {
        Row: {
          id: string
          instructor_id: string
          lesson_id: string
          amount_pence: number
          eligible_on: string
          status: 'PENDING' | 'QUEUED' | 'SENT' | 'FAILED' | 'REVERSED'
          stripe_transfer_id: string | null
          idempotency_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payout_instructions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payout_instructions']['Insert']>
      }
    }
  }
}
