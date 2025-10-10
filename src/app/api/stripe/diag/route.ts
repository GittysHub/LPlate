import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    });

    // Get account info
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      accountId: account.id,
      accountType: account.type,
      country: account.country,
      email: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve account info', details: error },
      { status: 500 }
    );
  }
}
