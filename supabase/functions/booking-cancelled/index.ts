import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders, handleCors, getSupabase, jsonResponse, errorResponse } from '../_shared/stripe-utils.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const FOAM_CREDIT_AMOUNT_CENTS = 2000 // $20 FOAM credit for operator cancellations
const OPERATOR_FLAG_THRESHOLD = 2

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { booking_id, cancelled_by_role } = await req.json()
    // cancelled_by_role: 'customer' | 'operator'

    if (!booking_id || !cancelled_by_role) {
      return errorResponse('booking_id and cancelled_by_role are required')
    }

    const supabase = getSupabase()

    // Fetch booking + payment + operator profile
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        scheduled_at,
        subtotal,
        created_at,
        reschedule_count,
        detailer_id,
        detailer_profiles!inner(
          id,
          stripe_account_id,
          operator_cancel_strike_count
        ),
        payments!inner(*)
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 404)
    }

    const payment = (booking.payments as any[])[0]
    const detailerProfile = booking.detailer_profiles as any

    if (!payment?.stripe_payment_intent_id) {
      return errorResponse('No payment intent found for this booking', 400)
    }

    const now = new Date()
    const bookedAt = new Date(booking.created_at)
    const appointmentAt = new Date(booking.scheduled_at)

    const hoursSinceBooking = (now.getTime() - bookedAt.getTime()) / (1000 * 60 * 60)
    const hoursUntilAppointment = (appointmentAt.getTime() - now.getTime()) / (1000 * 60 * 60)

    // ── OPERATOR CANCELLATION ────────────────────────────────
    if (cancelled_by_role === 'operator') {
      // Full hold release — customer is never charged
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)

      // Apply FOAM credit to customer
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: booking.customer_id,
          type: 'operator_cancelled',
          booking_id,
          credit_amount: FOAM_CREDIT_AMOUNT_CENTS / 100,
        },
      })

      // Increment operator strike count
      const newStrikeCount = (Number(detailerProfile.operator_cancel_strike_count) || 0) + 1
      const updatePayload: Record<string, unknown> = {
        operator_cancel_strike_count: newStrikeCount,
      }
      if (newStrikeCount >= OPERATOR_FLAG_THRESHOLD) {
        updatePayload.operator_flagged_at = now.toISOString()
      }

      await supabase
        .from('detailer_profiles')
        .update(updatePayload)
        .eq('id', detailerProfile.id)

      await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancellation_reason: 'operator_cancelled',
          cancellation_initiated_by: 'operator',
          cancellation_fee_tier: 'free',
          cancellation_fee_amount: 0,
        })
        .eq('id', payment.id)

      await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: now.toISOString(), cancelled_by: null })
        .eq('id', booking_id)

      return jsonResponse({
        success: true,
        fee_tier: 'free',
        fee_amount: 0,
        strike_count: newStrikeCount,
        operator_flagged: newStrikeCount >= OPERATOR_FLAG_THRESHOLD,
      })
    }

    // ── CUSTOMER CANCELLATION ────────────────────────────────
    let feeTier: string
    let feeAmount: number
    let feeAmountCents: number

    if (hoursSinceBooking < 72 || hoursUntilAppointment > 72) {
      // Free cancellation window: within 72 hours of BOOKING or more than 72 hours before appointment
      feeTier = 'free'
      feeAmount = 0
      feeAmountCents = 0
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
    } else if (hoursUntilAppointment >= 24) {
      // 72–24 hours before appointment: 25% fee
      feeTier = 'twenty_five'
      feeAmount = Number(booking.subtotal) * 0.25
      feeAmountCents = Math.round(feeAmount * 100)
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
        amount_to_capture: feeAmountCents,
      })
    } else {
      // Under 24 hours before appointment: 50% fee
      feeTier = 'fifty'
      feeAmount = Number(booking.subtotal) * 0.5
      feeAmountCents = Math.round(feeAmount * 100)
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
        amount_to_capture: feeAmountCents,
      })
    }

    const paymentStatus = feeAmountCents === 0 ? 'cancelled' : 'partially_captured'

    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        cancelled_at: now.toISOString(),
        cancellation_reason: 'customer_cancelled',
        cancellation_initiated_by: 'customer',
        cancellation_fee_tier: feeTier,
        cancellation_fee_amount: feeAmount,
      })
      .eq('id', payment.id)

    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: now.toISOString() })
      .eq('id', booking_id)

    return jsonResponse({
      success: true,
      fee_tier: feeTier,
      fee_amount: feeAmount,
    })
  } catch (err) {
    console.error('booking-cancelled error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
