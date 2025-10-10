// Stripe Connect Configuration for LPlate Marketplace
// This file contains all Stripe-related configuration and utilities

import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use latest API version
  typescript: true,
});

// Stripe Connect configuration
export const STRIPE_CONFIG = {
  // Platform settings
  PLATFORM_FEE_PERCENTAGE: 18, // 18% commission
  CURRENCY: 'gbp',
  
  // Payout settings
  PAYOUT_SCHEDULE: 'weekly', // Every Friday
  PAYOUT_DELAY_DAYS: 7, // 7 days after lesson completion
  
  // Account types
  DEFAULT_ACCOUNT_TYPE: 'express', // Express accounts for instructors
  
  // Webhook endpoints
  WEBHOOK_ENDPOINTS: {
    CONNECT: '/api/webhooks/stripe-connect',
    PAYMENTS: '/api/webhooks/stripe-payments',
    PAYOUTS: '/api/webhooks/stripe-payouts',
  },
} as const;

// Stripe Connect account types
export type StripeAccountType = 'express' | 'standard' | 'custom';

// Payment status types
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'canceled';

// Commission calculation utilities
export class CommissionCalculator {
  /**
   * Calculate platform fee (18% commission added to instructor's price)
   * This is added ON TOP of the instructor's listed rate
   */
  static calculatePlatformFee(instructorAmountPence: number): number {
    return Math.round(instructorAmountPence * (STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE / 100));
  }
  
  /**
   * Calculate total amount learner pays (instructor rate + platform fee)
   */
  static calculateTotalAmount(instructorAmountPence: number): number {
    return instructorAmountPence + this.calculatePlatformFee(instructorAmountPence);
  }
  
  /**
   * Calculate amounts for a payment
   * @param instructorAmountPence - The instructor's listed hourly rate
   * @returns Object with total amount learner pays, platform fee, and instructor amount
   */
  static calculatePaymentAmounts(instructorAmountPence: number) {
    const platformFee = this.calculatePlatformFee(instructorAmountPence);
    const totalAmount = instructorAmountPence + platformFee;
    
    return {
      totalAmountPence: totalAmount, // What learner pays
      platformFeePence: platformFee, // Platform commission
      instructorAmountPence: instructorAmountPence, // What instructor receives
    };
  }
}

// Payout date calculation utilities
export class PayoutCalculator {
  /**
   * Calculate the next Friday payout date after a lesson completion date
   * Example: Lesson completed Oct 9th 2025 → Payout Oct 17th 2025
   */
  static getNextPayoutDate(lessonCompletionDate: Date): Date {
    const date = new Date(lessonCompletionDate);
    
    // Get the day of week (0 = Sunday, 5 = Friday)
    const dayOfWeek = date.getDay();
    
    // Calculate days until next Friday
    let daysUntilFriday = (5 - dayOfWeek) % 7;
    
    // If it's Friday or later in the week, get next Friday
    if (daysUntilFriday <= 0) {
      daysUntilFriday += 7;
    }
    
    // Add the days to get the payout date
    const payoutDate = new Date(date);
    payoutDate.setDate(date.getDate() + daysUntilFriday);
    
    return payoutDate;
  }
  
  /**
   * Get all Fridays in a date range (for payout period calculation)
   */
  static getFridaysInRange(startDate: Date, endDate: Date): Date[] {
    const fridays: Date[] = [];
    const current = new Date(startDate);
    
    // Find first Friday
    while (current.getDay() !== 5) {
      current.setDate(current.getDate() + 1);
    }
    
    // Collect all Fridays in range
    while (current <= endDate) {
      fridays.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return fridays;
  }
}

// Discount and referral utilities
export class DiscountCalculator {
  /**
   * Apply discount code to payment amount
   */
  static applyDiscount(
    totalAmountPence: number,
    discountType: 'percentage' | 'fixed_amount',
    discountValue: number
  ): number {
    if (discountType === 'percentage') {
      return Math.round(totalAmountPence * (discountValue / 100));
    } else {
      // Fixed amount discount (in pence)
      return Math.min(discountValue, totalAmountPence);
    }
  }
  
  /**
   * Calculate final amounts after discount
   * @param instructorAmountPence - The instructor's listed hourly rate
   * @param discountAmountPence - Discount amount in pence
   * @returns Object with all calculated amounts
   */
  static calculateDiscountedAmounts(
    instructorAmountPence: number,
    discountAmountPence: number
  ) {
    // Apply discount to instructor amount first
    const discountedInstructorAmount = Math.max(0, instructorAmountPence - discountAmountPence);
    
    // Calculate platform fee on the discounted instructor amount
    const platformFee = CommissionCalculator.calculatePlatformFee(discountedInstructorAmount);
    
    // Total amount learner pays = discounted instructor amount + platform fee
    const totalAmount = discountedInstructorAmount + platformFee;
    
    return {
      originalInstructorAmountPence: instructorAmountPence,
      discountAmountPence,
      discountedInstructorAmountPence: discountedInstructorAmount,
      totalAmountPence: totalAmount, // What learner pays
      platformFeePence: platformFee, // Platform commission
      instructorAmountPence: discountedInstructorAmount, // What instructor receives
    };
  }
}

// Credit system utilities
export class CreditManager {
  /**
   * Calculate hours from payment amount and hourly rate
   */
  static calculateHoursFromPayment(amountPence: number, hourlyRatePence: number): number {
    return amountPence / hourlyRatePence;
  }
  
  /**
   * Calculate payment amount from hours and hourly rate
   */
  static calculatePaymentFromHours(hours: number, hourlyRatePence: number): number {
    return Math.round(hours * hourlyRatePence);
  }
  
  /**
   * Check if learner has sufficient credit for booking
   */
  static hasSufficientCredit(): Promise<boolean> {
    // This would query the database to check credit balance
    // Implementation depends on your database client
    throw new Error('Not implemented - requires database integration');
  }
}

// Error handling utilities
export class StripeErrorHandler {
  /**
   * Handle Stripe API errors gracefully
   */
  static handleError(error: unknown): { message: string; code?: string } {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        message: error.message,
        code: error.code,
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }
    
    return {
      message: 'An unexpected error occurred',
    };
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof Stripe.errors.StripeError) {
      return error.type === 'StripeConnectionError' || 
             error.type === 'StripeAPIError';
    }
    return false;
  }
}

// Webhook signature verification
export class WebhookVerifier {
  /**
   * Verify Stripe webhook signature
   */
  static verifySignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }
  }
}

// Export types for use in other files
// Note: Types are already exported above, no need to re-export
