// Stripe Payment Webhook Handlers for LPlate Marketplace
// Handles payment events, refunds, and disputes

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { WebhookVerifier, StripeErrorHandler } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

// Handle Stripe payment events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = WebhookVerifier.verifySignature(
      body,
      signature,
      process.env.STRIPE_PAYMENTS_WEBHOOK_SECRET!
    );

    console.log(`Received Stripe payment webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(pi);
        break;
      }
        
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
        
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute);
        break;
      }
        
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
        
      default:
        console.log(`Unhandled payment event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Payment webhook error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message },
      { status: 400 }
    );
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const supabase = await createSupabaseServer();
    
    // Update payment status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (updateError) {
      console.error('Payment update error:', updateError);
    } else {
      console.log(`Payment ${paymentIntent.id} succeeded`);
      
      // Handle credit purchase if applicable
      if ((paymentIntent.metadata as Record<string, unknown>)?.type === 'credit_purchase') {
        await handleCreditPurchaseFromPayment(paymentIntent);
      }
    }
  } catch (error) {
    console.error('Handle payment succeeded error:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const supabase = await createSupabaseServer();
    
    // Update payment status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (updateError) {
      console.error('Payment update error:', updateError);
    } else {
      console.log(`Payment ${paymentIntent.id} failed`);
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// Handle dispute creation
async function handleDisputeCreated(charge: Stripe.Dispute) {
  try {
    const supabase = await createSupabaseServer();
    
    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('orders')
      .select('id, learner_id, instructor_id, total_amount_pence')
      .eq('stripe_payment_intent_id', charge.payment_intent)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for dispute:', charge.id);
      return;
    }

    // Create dispute record (you might want to add a disputes table)
    console.log(`Dispute created for payment ${payment.id}: ${charge.reason}`);
    
    // You could send notifications to instructors, admins, etc.
    // await notifyDisputeCreated(payment, charge.dispute);
    
  } catch (error) {
    console.error('Handle dispute created error:', error);
  }
}

// Handle charge refunded
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const supabase = await createSupabaseServer();
    
    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('orders')
      .select('id, learner_id, instructor_id, total_amount_pence, platform_fee_pence, instructor_rate_pence')
      .eq('stripe_payment_intent_id', charge.payment_intent)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for refund:', charge.id);
      return;
    }

    // Calculate refund amounts
    const refunds = charge.refunds as { data: Array<{ amount: number; id: string }> };
    const refundAmountPence = refunds.data[0]?.amount || 0;
    const platformFeeRefundPence = Math.round(refundAmountPence * 0.18);
    const instructorRefundPence = refundAmountPence - platformFeeRefundPence;

    // Create refund record
    const { error: refundError } = await supabase
      .from('refunds')
      .insert({
        order_id: payment.id,
        stripe_refund_id: refunds.data[0]?.id,
        amount_pence: refundAmountPence,
        reason: 'requested_by_customer',
        status: 'succeeded',
      });

    if (refundError) {
      console.error('Refund record creation error:', refundError);
    } else {
      console.log(`Refund processed for payment ${payment.id}: ${refundAmountPence} pence`);
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Payment status update error:', updateError);
    }

  } catch (error) {
    console.error('Handle charge refunded error:', error);
  }
}

// Handle credit purchase from payment webhook
async function handleCreditPurchaseFromPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const supabase = await createSupabaseServer();
    
    const metadata = paymentIntent.metadata as Record<string, unknown>;
    const { learnerId, instructorId, hours } = metadata;
    
    if (!learnerId || !instructorId || !hours) {
      console.log('Missing metadata for credit purchase');
      return;
    }

    const hoursToAdd = Number(hours ?? 0);
    const minutesToAdd = hoursToAdd * 60; // Convert hours to minutes
    
    // Add credit ledger entry for purchase
    const { error: insertError } = await supabase
      .from('credit_ledger')
      .insert({
        learner_id: learnerId as string,
        instructor_id: instructorId as string,
        delta_minutes: minutesToAdd,
        source: 'PURCHASE',
        order_id: null, // Will be linked when order is created
        note: `Credit purchase: ${hoursToAdd} hours`,
      });

    if (insertError) throw insertError;

    console.log(`Credit purchase processed: ${hoursToAdd} hours for learner ${learnerId} with instructor ${instructorId}`);
    
  } catch (error) {
    console.error('Handle credit purchase error:', error);
  }
}
