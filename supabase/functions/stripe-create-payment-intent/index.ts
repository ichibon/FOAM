import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders, handleCors, getSupabase, jsonResponse, errorResponse, getPlatformFeeRate } from '../_shared/stripe-utils.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { booking_id, customer_id } = await req.json()

    if (!booking_id || !customer_id) {
      return errorResponse('booking_id and customer_id are required')
    }

    const supabase = getSupabase()

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        subtotal,
        detailer_id,
        detailer_profiles!inner(
          id,
          stripe_account_id
        )
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 404)
    }

    // Fetch customer Stripe ID
    const { data: customerProfile } = await supabase
      .from('customer_profiles')
      .select('stripe_customer_id')
      .eq('id', customer_id)
      .single()

    if (!customerProfile?.stripe_customer_id) {
      return errorResponse('Customer has no Stripe account. Call stripe-create-customer first.', 400)
    }

    const detailerProfile = (booking.detailer_profiles as any)
    if (!detailerProfile?.stripe_account_id) {
      return errorResponse('Operator has not completed Stripe Connect onboarding.', 400)
    }

    const amountCents = Math.round(Number(booking.subtotal) * 100)
    const feeRate = await getPlatformFeeRate(supabase, booking.detailer_id)
    const applicationFeeCents = Math.round(amountCents * feeRate)

    // Create PaymentIntent with manual capture (authorization hold)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'manual',
      customer: customerProfile.stripe_customer_id,
      payment_method_types: ['card', 'cashapp'],
      application_fee_amount: applicationFeeCents,
      transfer_data: {
        destination: detailerProfile.stripe_account_id,
      },
      metadata: {
        booking_id,
        customer_id,
        detailer_id: booking.detailer_id,
        platform: 'foam',
      },
    })

    const holdPlacedAt = new Date().toISOString()
    const holdExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Upsert payment record
    await supabase
      .from('payments')
      .upsert({
        booking_id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerProfile.stripe_customer_id,
        amount: booking.subtotal,
        hold_amount: booking.subtotal,
        platform_fee: applicationFeeCents / 100,
        payout_amount: (amountCents - applicationFeeCents) / 100,
        status: 'authorized',
        stripe_capture_method: 'manual',
        hold_placed_at: holdPlacedAt,
        hold_expires_at: holdExpiresAt,
      })

    return jsonResponse({
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: amountCents,
      platform_fee_rate: feeRate,
    })
  } catch (err) {
    console.error('stripe-create-payment-intent error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
