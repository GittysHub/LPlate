// Stripe Connect Account Setup API
// Handles instructor onboarding to Stripe Connect

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, StripeErrorHandler } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

// Create Stripe Connect account for instructor
export async function POST(request: NextRequest) {
  try {
    const { instructorId, returnUrl, refreshUrl } = await request.json();
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    // Verify instructor exists and is authenticated
    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select('id, profiles!inner(name, email)')
      .eq('id', instructorId)
      .single();

    if (instructorError || !instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: STRIPE_CONFIG.DEFAULT_ACCOUNT_TYPE,
      country: 'GB', // UK marketplace
      email: instructor.profiles[0]?.email || '',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: instructor.profiles[0]?.email || '',
        first_name: instructor.profiles[0]?.name?.split(' ')[0] || '',
        last_name: instructor.profiles[0]?.name?.split(' ').slice(1).join(' ') || '',
      },
      settings: {
        payouts: {
          schedule: {
            interval: STRIPE_CONFIG.PAYOUT_SCHEDULE,
            weekly_anchor: 'friday', // Payouts on Friday
          },
        },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/instructor/profile`,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/instructor/profile?refresh=true`,
      type: 'account_onboarding',
    });

    // Store Stripe account info in database
    const { error: dbError } = await supabase
      .from('stripe_connect_accounts')
      .insert({
        instructor_id: instructorId,
        stripe_account_id: account.id,
        account_type: STRIPE_CONFIG.DEFAULT_ACCOUNT_TYPE,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save account information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Account created successfully',
    });

  } catch (error) {
    console.error('Stripe Connect account creation error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}

// Get Stripe Connect account status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    // Get account info from database
    const { data: account, error: dbError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('instructor_id', instructorId)
      .single();

    if (dbError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get updated account info from Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);
    
    // Update database with latest status
    const { error: updateError } = await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        requirements: stripeAccount.requirements,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Database update error:', updateError);
    }

    return NextResponse.json({
      accountId: account.stripe_account_id,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      detailsSubmitted: stripeAccount.details_submitted,
      requirements: stripeAccount.requirements,
      accountType: account.account_type,
    });

  } catch (error) {
    console.error('Stripe Connect account status error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}

// Create login link for instructor dashboard
export async function PUT(request: NextRequest) {
  try {
    const { instructorId } = await request.json();
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    // Get account info from database
    const { data: account, error: dbError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id')
      .eq('instructor_id', instructorId)
      .single();

    if (dbError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(account.stripe_account_id);

    return NextResponse.json({
      loginUrl: loginLink.url,
      expiresAt: null, // Login links don't have expires_at in Stripe API
    });

  } catch (error) {
    console.error('Stripe Connect login link error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}
