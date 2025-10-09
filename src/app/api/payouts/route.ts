// Automated Payout System for LPlate Marketplace
// Handles Friday payouts to instructors after lesson completion

import { NextRequest, NextResponse } from 'next/server';
import { stripe, StripeErrorHandler } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

// Process payouts for completed lessons (run every Friday)
export async function POST(request: NextRequest) {
  try {
    const { payoutDate } = await request.json();
    
    // Default to today if no date provided
    const targetPayoutDate = payoutDate ? new Date(payoutDate) : new Date();
    
    // Ensure it's a Friday
    if (targetPayoutDate.getDay() !== 5) {
      return NextResponse.json(
        { error: 'Payout date must be a Friday' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    // Calculate the lesson period (previous Friday to Thursday)
    const lessonPeriodEnd = new Date(targetPayoutDate);
    lessonPeriodEnd.setDate(targetPayoutDate.getDate() - 1); // Thursday
    
    const lessonPeriodStart = new Date(lessonPeriodEnd);
    lessonPeriodStart.setDate(lessonPeriodEnd.getDate() - 6); // Previous Friday

    console.log(`Processing payouts for ${targetPayoutDate.toISOString().split('T')[0]}`);
    console.log(`Lesson period: ${lessonPeriodStart.toISOString().split('T')[0]} to ${lessonPeriodEnd.toISOString().split('T')[0]}`);

    // Get all completed lessons in the period that haven't been paid out
    const { data: completedLessons, error: lessonsError } = await supabase
      .from('bookings')
      .select(`
        id,
        instructor_id,
        start_at,
        end_at,
        price,
        status,
        payments!inner(
          id,
          stripe_payment_intent_id,
          instructor_amount_pence,
          platform_fee_pence,
          status
        )
      `)
      .eq('status', 'completed')
      .gte('end_at', lessonPeriodStart.toISOString())
      .lte('end_at', lessonPeriodEnd.toISOString())
      .eq('payments.status', 'succeeded');

    if (lessonsError) {
      console.error('Lessons query error:', lessonsError);
      return NextResponse.json(
        { error: 'Failed to fetch completed lessons' },
        { status: 500 }
      );
    }

    if (!completedLessons || completedLessons.length === 0) {
      return NextResponse.json({
        message: 'No completed lessons found for payout period',
        payoutDate: targetPayoutDate.toISOString().split('T')[0],
        lessonCount: 0,
      });
    }

    // Group lessons by instructor
    const instructorLessons = completedLessons.reduce((acc, lesson) => {
      const instructorId = lesson.instructor_id;
      if (!acc[instructorId]) {
        acc[instructorId] = [];
      }
      acc[instructorId].push(lesson);
      return acc;
    }, {} as Record<string, typeof completedLessons>);

    const payoutResults = [];

    // Process payouts for each instructor
    for (const [instructorId, lessons] of Object.entries(instructorLessons)) {
      try {
        const result = await processInstructorPayout(
          supabase,
          instructorId,
          lessons,
          targetPayoutDate,
          lessonPeriodStart,
          lessonPeriodEnd
        );
        payoutResults.push(result);
      } catch (error) {
        console.error(`Payout error for instructor ${instructorId}:`, error);
        payoutResults.push({
          instructorId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successfulPayouts = payoutResults.filter(r => r.success).length;
    const failedPayouts = payoutResults.filter(r => !r.success).length;

    return NextResponse.json({
      message: 'Payout processing completed',
      payoutDate: targetPayoutDate.toISOString().split('T')[0],
      totalInstructors: Object.keys(instructorLessons).length,
      successfulPayouts,
      failedPayouts,
      results: payoutResults,
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}

// Process payout for a single instructor
async function processInstructorPayout(
  supabase: ReturnType<typeof createSupabaseServer>,
  instructorId: string,
  lessons: Record<string, unknown>[],
  payoutDate: Date,
  periodStart: Date,
  periodEnd: Date
) {
  // Get instructor's Stripe Connect account
  const { data: stripeAccount, error: accountError } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, payouts_enabled')
    .eq('instructor_id', instructorId)
    .single();

  if (accountError || !stripeAccount) {
    throw new Error('Instructor Stripe account not found');
  }

  if (!stripeAccount.payouts_enabled) {
    throw new Error('Instructor payouts not enabled');
  }

  // Calculate total amounts
  let totalAmountPence = 0;
  let totalPlatformFeePence = 0;
  const paymentIds: string[] = [];

  for (const lesson of lessons) {
    const payment = lesson.payments[0]; // Should be only one payment per lesson
    totalAmountPence += payment.instructor_amount_pence;
    totalPlatformFeePence += payment.platform_fee_pence;
    paymentIds.push(payment.id);
  }

  // Check if payout already exists
  const { data: existingPayout, error: existingError } = await supabase
    .from('payouts')
    .select('id')
    .eq('instructor_id', instructorId)
    .eq('payout_date', payoutDate.toISOString().split('T')[0])
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existingPayout) {
    return {
      instructorId,
      success: true,
      message: 'Payout already processed',
      payoutId: existingPayout.id,
    };
  }

  // Create payout record in database
  const { data: payout, error: payoutError } = await supabase
    .from('payouts')
    .insert({
      instructor_id: instructorId,
      total_amount_pence: totalAmountPence,
      platform_fee_pence: totalPlatformFeePence,
      net_amount_pence: totalAmountPence, // Amount instructor receives
      payout_date: payoutDate.toISOString().split('T')[0],
      lesson_period_start: periodStart.toISOString().split('T')[0],
      lesson_period_end: periodEnd.toISOString().split('T')[0],
      status: 'pending',
      stripe_account_id: stripeAccount.stripe_account_id,
    })
    .select()
    .single();

  if (payoutError) {
    throw payoutError;
  }

  // Link payments to payout
  const { error: linkError } = await supabase
    .from('payout_payments')
    .insert(
      paymentIds.map(paymentId => ({
        payout_id: payout.id,
        payment_id: paymentId,
      }))
    );

  if (linkError) {
    console.error('Payment linking error:', linkError);
    // Don't throw here, payout is still valid
  }

  // Create transfer to instructor's Stripe account
  try {
    const transfer = await stripe.transfers.create({
      amount: totalAmountPence,
      currency: 'gbp',
      destination: stripeAccount.stripe_account_id,
      metadata: {
        payoutId: payout.id,
        instructorId,
        lessonCount: lessons.length.toString(),
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      },
    });

    // Update payout with Stripe transfer ID
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        stripe_payout_id: transfer.id,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    if (updateError) {
      console.error('Payout update error:', updateError);
    }

    return {
      instructorId,
      success: true,
      payoutId: payout.id,
      stripeTransferId: transfer.id,
      amount: totalAmountPence,
      lessonCount: lessons.length,
      message: 'Payout processed successfully',
    };

  } catch (stripeError) {
    // Update payout status to failed
    await supabase
      .from('payouts')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    throw stripeError;
  }
}

// Get payout history for an instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select(`
        *,
        payout_payments(
          payment_id,
          payments(
            id,
            total_amount_pence,
            platform_fee_pence,
            instructor_amount_pence,
            created_at
          )
        )
      `)
      .eq('instructor_id', instructorId)
      .order('payout_date', { ascending: false })
      .limit(limit);

    if (payoutsError) {
      console.error('Payouts query error:', payoutsError);
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payouts: payouts || [],
      count: payouts?.length || 0,
    });

  } catch (error) {
    console.error('Payout history error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message, code: errorInfo.code },
      { status: 500 }
    );
  }
}
