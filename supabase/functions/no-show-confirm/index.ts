import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders, handleCors, getSupabase, jsonResponse, errorResponse } from '../_shared/stripe-utils.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

// Step 2 of the no-show flow.
// Operator calls this after the 10-minute grace period has elapsed
// and the customer still hasn't arrived.
// Captures 50% of the booking subtotal as a no-show fee.

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { booking_id } = await req.json()

    if (!booking_id) {
      return errorResponse('booking_id is required')
    }

    const supabase = getSupabase()

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        subtotal,
        no_show_reported_at,
        customer_profiles!inner(id),
        payments!inner(*)
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 404)
    }

    if (booking.status !== 'no_show') {
      return errorResponse('Booking must be in no_show status. Call no-show-report first.', 400)
    }

    if (!booking.no_show_reported_at) {
      return errorResponse('No-show has not been reported for this booking.', 400)
    }

    // Enforce 10-minute minimum grace period
    const reportedAt = new Date(booking.no_show_reported_at)
    const minutesSinceReport = (Date.now() - reportedAt.getTime()) / (1000 * 60)
    if (minutesSinceReport < 10) {
      return errorResponse(
        `Grace period has not elapsed. ${Math.ceil(10 - minutesSinceReport)} minutes remaining.`,
        400
      )
    }

    const payment = (booking.payments as any[])[0]
    if (!payment?.stripe_payment_intent_id) {
      return errorResponse('No payment intent found for this booking', 400)
    }

    const noShowFeeAmount = Number(booking.subtotal) * 0.5
    const noShowFeeAmountCents = Math.round(noShowFeeAmount * 100)

    // Capture 50% as the no-show fee
    await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
      amount_to_capture: noShowFeeAmountCents,
    })

    const now = new Date().toISOString()

    await supabase
      .from('payments')
      .update({
        status: 'partially_captured',
        cancellation_fee_amount: noShowFeeAmount,
        cancellation_fee_tier: 'no_show',
        cancellation_initiated_by: 'system',
        updated_at: now,
      })
      .eq('id', payment.id)

    // Notify customer that the no-show fee was charged
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: (booking.customer_profiles as any).id,
        type: 'no_show_fee_charged',
        booking_id,
        amount: noShowFeeAmount,
        message: `A no-show fee of $${noShowFeeAmount.toFixed(2)} has been applied to your booking.`,
      },
    })

    return jsonResponse({
      success: true,
      fee_amount: noShowFeeAmount,
      fee_tier: 'no_show',
    })
  } catch (err) {
    console.error('no-show-confirm error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
