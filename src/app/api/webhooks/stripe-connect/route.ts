// Stripe Webhook Handlers for LPlate Marketplace
// Handles Stripe events for payments, payouts, and account updates

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { WebhookVerifier, StripeErrorHandler } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';

// Handle Stripe Connect account events
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
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );

    console.log(`Received Stripe Connect webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
        
      case 'account.application.deauthorized': {
        const deauth = event.data.object as Stripe.Application;
        await handleAccountDeauthorized(deauth);
        break;
      }
        
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferCreated(transfer);
        break;
      }
        
      case 'transfer.updated': {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferUpdated(transfer);
        break;
      }
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorInfo = StripeErrorHandler.handleError(error);
    
    return NextResponse.json(
      { error: errorInfo.message },
      { status: 400 }
    );
  }
}

// Handle account updates (charges_enabled, payouts_enabled, etc.)
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const supabase = await createSupabaseServer();
    
    const { error } = await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id);

    if (error) {
      console.error('Account update error:', error);
    } else {
      console.log(`Account ${account.id} updated successfully`);
    }
  } catch (error) {
    console.error('Handle account updated error:', error);
  }
}

// Handle account deauthorization
async function handleAccountDeauthorized(account: Stripe.Application) {
  try {
    const supabase = await createSupabaseServer();
    
    const { error } = await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: false,
        payouts_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id);

    if (error) {
      console.error('Account deauthorization error:', error);
    } else {
      console.log(`Account ${account.id} deauthorized`);
    }
  } catch (error) {
    console.error('Handle account deauthorized error:', error);
  }
}

// Handle transfer creation (payouts to instructors)
async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    const supabase = await createSupabaseServer();
    
    // Find the payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('id, instructor_id')
      .eq('stripe_payout_id', transfer.id)
      .single();

    if (payoutError || !payout) {
      console.error('Payout not found for transfer:', transfer.id);
      return;
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    if (updateError) {
      console.error('Payout update error:', updateError);
    } else {
      console.log(`Transfer ${transfer.id} created for instructor ${payout.instructor_id}`);
    }
  } catch (error) {
    console.error('Handle transfer created error:', error);
  }
}

// Handle transfer updates (payout status changes)
async function handleTransferUpdated(transfer: Stripe.Transfer) {
  try {
    const supabase = await createSupabaseServer();
    
    // Find the payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('id, instructor_id')
      .eq('stripe_payout_id', transfer.id)
      .single();

    if (payoutError || !payout) {
      console.error('Payout not found for transfer:', transfer.id);
      return;
    }

    // Determine payout status based on transfer status
    let payoutStatus = 'processing';
    // Note: Stripe transfers don't have a status property, they're either created or failed
    // We'll assume successful if the transfer was created
    payoutStatus = 'paid';

    // Update payout status
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        status: payoutStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    if (updateError) {
      console.error('Payout update error:', updateError);
    } else {
      console.log(`Transfer ${transfer.id} updated to ${payoutStatus} for instructor ${payout.instructor_id}`);
    }
  } catch (error) {
    console.error('Handle transfer updated error:', error);
  }
}
