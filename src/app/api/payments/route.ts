// Payment Processing API for LPlate Marketplace
// Handles lesson payments, credit purchases, and commission calculations

import { NextRequest, NextResponse } from 'next/server';
import { stripe, DiscountCalculator, StripeErrorHandler } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

interface PaymentRequest {
  learnerId: string;
  instructorId: string;
  bookingId?: string;
  instructorAmountPence: number; // Instructor's listed hourly rate
  hours?: number; // For credit purchases
  discountCode?: string;
  referralCode?: string;
  paymentMethodId: string;
  description?: string;
}

// Create payment intent for lesson or credit purchase
export async function POST(request: NextRequest) {
  try {
    const {
      learnerId,
      instructorId,
      bookingId,
      instructorAmountPence,
      hours,
      discountCode,
      referralCode,
      paymentMethodId,
      description,
    }: PaymentRequest = await request.json();

    // Validate required fields
    if (!learnerId || !instructorId || !instructorAmountPence || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServer();

    // Verify learner and instructor exist
    const { data: learner, error: learnerError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', learnerId)
      .eq('role', 'learner')
      .single();

    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select(`
        id,
        hourly_rate,
        profiles!inner(name, email)
      `)
      .eq('id', instructorId)
      .single();

    if (learnerError || !learner) {
      return NextResponse.json(
        { error: 'Learner not found' },
        { status: 404 }
      );
    }

    if (instructorError || !instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Get Stripe Connect account for instructor
    const { data: stripeAccount, error: accountError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('instructor_id', instructorId)
      .single();

    if (accountError || !stripeAccount) {
      return NextResponse.json(
        { error: 'Instructor payment account not set up' },
        { status: 400 }
      );
    }

    if (!stripeAccount.charges_enabled) {
      return NextResponse.json(
        { error: 'Instructor payment account not ready' },
        { status: 400 }
      );
    }

    // Apply discount if provided (discount applies to instructor's rate)
    let discountAmountPence = 0;
    if (discountCode) {
      const { data: discount, error: discountError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode)
        .eq('is_active', true)
        .single();

      if (!discountError && discount) {
        discountAmountPence = DiscountCalculator.applyDiscount(
          instructorAmountPence,
          discount.discount_type,
          discount.discount_value
        );
      }
    }

    // Calculate final amounts (platform fee added to instructor's rate)
    const {
      totalAmountPence,
      platformFeePence,
      instructorAmountPence: finalInstructorAmountPence
    } = DiscountCalculator.calculateDiscountedAmounts(instructorAmountPence, discountAmountPence);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountPence, // Total amount learner pays
      currency: 'gbp',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      application_fee_amount: platformFeePence, // Platform fee (18% of instructor's rate)
      transfer_data: {
        destination: stripeAccount.stripe_account_id,
      },
      metadata: {
        learnerId,
        instructorId,
        bookingId: bookingId || '',
        hours: hours?.toString() || '',
        discountCode: discountCode || '',
        referralCode: referralCode || '',
        instructorRate: instructorAmountPence.toString(),
        platformFee: platformFeePence.toString(),
        instructorAmount: finalInstructorAmountPence.toString(),
        totalAmount: totalAmountPence.toString(),
      },
      description: description || `Driving lesson payment - ${instructor.profiles.name}`,
    });

    // Store payment in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        learner_id: learnerId,
        instructor_id: instructorId,
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        total_amount_pence: totalAmountPence, // Total amount learner paid
        platform_fee_pence: platformFeePence, // Platform commission (18% of instructor's rate)
        instructor_amount_pence: finalInstructorAmountPence, // Amount instructor receives
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        discount_code: discountCode,
        referral_code: referralCode,
        discount_amount_pence: discountAmountPence,
        payment_method: 'card',
        currency: 'gbp',
        description: description || `Driving lesson payment - ${instructor.profiles.name}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Database payment error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to save payment information' },
        { status: 500 }
      );
    }

    // Handle credit purchase
    if (hours && hours > 0) {
      await handleCreditPurchase(
        supabase,
        learnerId,
        instructorId,
        payment.id,
        hours,
        instructorAmountPence, // Use the instructor's listed rate
        totalAmountPence
      );
    }

    // Update discount code usage
    if (discountCode && discountAmountPence > 0) {
      await supabase
        .from('discount_codes')
        .update({ uses_count: supabase.raw('uses_count + 1') })
        .eq('code', discountCode);
    }

    return NextResponse.json({
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      instructorRate: instructorAmountPence, // Instructor's listed rate
      platformFee: platformFeePence, // Platform commission (18%)
      instructorAmount: finalInstructorAmountPence, // Amount instructor receives
      totalAmount: totalAmountPence, // Total amount learner pays
      discountAmount: discountAmountPence,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}

// Handle credit purchase
async function handleCreditPurchase(
  supabase: ReturnType<typeof createSupabaseServer>,
  learnerId: string,
  instructorId: string,
  paymentId: string,
  hours: number,
  hourlyRatePence: number,
  _totalAmountPence: number
) {
  try {
    // Check if learner already has credits with this instructor
    const { data: existingCredit, error: creditError } = await supabase
      .from('learner_credits')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('instructor_id', instructorId)
      .single();

    if (creditError && creditError.code !== 'PGRST116') {
      throw creditError;
    }

    if (existingCredit) {
      // Update existing credit
      const { error: updateError } = await supabase
        .from('learner_credits')
        .update({
          total_hours_purchased: existingCredit.total_hours_purchased + hours,
          hourly_rate_pence: hourlyRatePence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCredit.id);

      if (updateError) throw updateError;
    } else {
      // Create new credit account
      const { error: insertError } = await supabase
        .from('learner_credits')
        .insert({
          learner_id: learnerId,
          instructor_id: instructorId,
          total_hours_purchased: hours,
          hours_used: 0,
          purchase_payment_id: paymentId,
          hourly_rate_pence: hourlyRatePence,
        });

      if (insertError) throw insertError;
    }

    console.log(`Credit purchase successful: ${hours} hours for learner ${learnerId} with instructor ${instructorId}`);
  } catch (error) {
    console.error('Credit purchase error:', error);
    throw error;
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServer();
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        profiles!payments_learner_id_fkey(name),
        instructors!payments_instructor_id_fkey(
          hourly_rate,
          profiles!instructors_id_fkey(name)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Get payment intent status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);

    return NextResponse.json({
      id: payment.id,
      status: paymentIntent.status,
      amount: payment.total_amount_pence,
      platformFee: payment.platform_fee_pence,
      instructorAmount: payment.instructor_amount_pence,
      discountAmount: payment.discount_amount_pence,
      learnerName: payment.profiles.name,
      instructorName: payment.instructors.profiles.name,
      createdAt: payment.created_at,
    });

  } catch (error) {
    console.error('Payment status error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}
