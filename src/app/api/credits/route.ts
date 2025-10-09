// Credit Management System for LPlate Marketplace
// Handles prepaid lesson credits and automatic deduction

import { NextRequest, NextResponse } from 'next/server';
import { CreditManager, CommissionCalculator } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

// Get learner's credit balance with specific instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const learnerId = searchParams.get('learnerId');
    const instructorId = searchParams.get('instructorId');
    
    if (!learnerId) {
      return NextResponse.json(
        { error: 'Learner ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    let query = supabase
      .from('learner_credits')
      .select(`
        *,
        instructors!inner(
          id,
          hourly_rate,
          profiles!instructors_id_fkey(name, avatar_url)
        )
      `)
      .eq('learner_id', learnerId)
      .eq('is_active', true);

    // Filter by specific instructor if provided
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    const { data: credits, error: creditsError } = await query;

    if (creditsError) {
      console.error('Credits query error:', creditsError);
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      );
    }

    // Format response
    const formattedCredits = (credits || []).map(credit => ({
      id: credit.id,
      instructorId: credit.instructor_id,
      instructorName: credit.instructors.profiles.name,
      instructorAvatar: credit.instructors.profiles.avatar_url,
      hourlyRate: credit.instructors.hourly_rate,
      totalHoursPurchased: credit.total_hours_purchased,
      hoursUsed: credit.hours_used,
      hoursRemaining: credit.hours_remaining,
      purchaseDate: credit.created_at,
      expiresAt: credit.expires_at,
      isActive: credit.is_active,
    }));

    return NextResponse.json({
      credits: formattedCredits,
      totalCredits: formattedCredits.length,
    });

  } catch (error) {
    console.error('Credit balance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 }
    );
  }
}

// Use credits for a booking
export async function POST(request: NextRequest) {
  try {
    const {
      learnerId,
      instructorId,
      bookingId,
      hoursToUse,
      hourlyRatePence,
    } = await request.json();

    if (!learnerId || !instructorId || !bookingId || !hoursToUse || !hourlyRatePence) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    // Check if learner has sufficient credit
    const { data: credit, error: creditError } = await supabase
      .from('learner_credits')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .single();

    if (creditError || !credit) {
      return NextResponse.json(
        { error: 'No active credit account found with this instructor' },
        { status: 404 }
      );
    }

    if (credit.hours_remaining < hoursToUse) {
      return NextResponse.json(
        { 
          error: 'Insufficient credit',
          availableHours: credit.hours_remaining,
          requestedHours: hoursToUse,
        },
        { status: 400 }
      );
    }

    // Calculate payment amounts
    const totalAmountPence = CreditManager.calculatePaymentFromHours(hoursToUse, hourlyRatePence);
    const { platformFeePence, instructorAmountPence } = CommissionCalculator.calculatePaymentAmounts(totalAmountPence);

    // Create payment record for credit usage
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        learner_id: learnerId,
        instructor_id: instructorId,
        booking_id: bookingId,
        stripe_payment_intent_id: `credit_${bookingId}_${Date.now()}`, // Virtual payment ID for credits
        total_amount_pence: totalAmountPence,
        platform_fee_pence: platformFeePence,
        instructor_amount_pence: instructorAmountPence,
        status: 'succeeded', // Credits are pre-paid
        payment_method: 'credit',
        currency: 'gbp',
        description: `Credit usage - ${hoursToUse} hours`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Update credit usage
    const { error: updateError } = await supabase
      .from('learner_credits')
      .update({
        hours_used: credit.hours_used + hoursToUse,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credit.id);

    if (updateError) {
      console.error('Credit update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credit usage' },
        { status: 500 }
      );
    }

    // Record credit usage
    const { error: usageError } = await supabase
      .from('credit_usage')
      .insert({
        credit_id: credit.id,
        booking_id: bookingId,
        payment_id: payment.id,
        hours_used: hoursToUse,
        hourly_rate_pence: hourlyRatePence,
      });

    if (usageError) {
      console.error('Credit usage recording error:', usageError);
      // Don't fail the request, usage was still updated
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      hoursUsed: hoursToUse,
      remainingHours: credit.hours_remaining - hoursToUse,
      totalAmount: totalAmountPence,
      platformFee: platformFeePence,
      instructorAmount: instructorAmountPence,
    });

  } catch (error) {
    console.error('Credit usage error:', error);
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}

// Purchase additional credits
export async function PUT(request: NextRequest) {
  try {
    const {
      learnerId,
      instructorId,
      hoursToPurchase,
      hourlyRatePence,
      paymentMethodId,
    } = await request.json();

    if (!learnerId || !instructorId || !hoursToPurchase || !hourlyRatePence || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    // Verify instructor exists
    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select('id, hourly_rate')
      .eq('id', instructorId)
      .single();

    if (instructorError || !instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Calculate payment amounts (platform fee added to instructor's rate)
    const { totalAmountPence, platformFeePence, instructorAmountPence } = calculatePaymentAmounts(hoursToUse * hourlyRatePence);

    // Create payment intent for credit purchase
    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY!);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountPence,
      currency: 'gbp',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        learnerId,
        instructorId,
        hours: hoursToPurchase.toString(),
        type: 'credit_purchase',
      },
      description: `Credit purchase - ${hoursToPurchase} hours`,
    });

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment failed', status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        learner_id: learnerId,
        instructor_id: instructorId,
        stripe_payment_intent_id: paymentIntent.id,
        total_amount_pence: totalAmountPence,
        platform_fee_pence: platformFeePence,
        instructor_amount_pence: instructorAmountPence,
        status: 'succeeded',
        payment_method: 'card',
        currency: 'gbp',
        description: `Credit purchase - ${hoursToPurchase} hours`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Update or create credit account
    const { data: existingCredit, error: existingError } = await supabase
      .from('learner_credits')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('instructor_id', instructorId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingCredit) {
      // Update existing credit
      const { error: updateError } = await supabase
        .from('learner_credits')
        .update({
          total_hours_purchased: existingCredit.total_hours_purchased + hoursToPurchase,
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
          total_hours_purchased: hoursToPurchase,
          hours_used: 0,
          purchase_payment_id: payment.id,
          hourly_rate_pence: hourlyRatePence,
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      hoursPurchased: hoursToPurchase,
      totalAmount: totalAmountPence,
      platformFee: platformFeePence,
      instructorAmount: instructorAmountPence,
    });

  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase credits' },
      { status: 500 }
    );
  }
}

// Helper function to calculate payment amounts (duplicate from stripe.ts for this file)
function calculatePaymentAmounts(instructorAmountPence: number) {
  const platformFeePence = Math.round(instructorAmountPence * 0.18);
  const totalAmountPence = instructorAmountPence + platformFeePence;
  
  return {
    totalAmountPence,
    platformFeePence,
    instructorAmountPence,
  };
}
