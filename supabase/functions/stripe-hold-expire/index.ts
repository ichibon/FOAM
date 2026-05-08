import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders, handleCors, getSupabase, jsonResponse, errorResponse } from '../_shared/stripe-utils.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

// This function runs as a daily cron job at 6am UTC.
// It finds all authorized holds expiring within 48 hours and re-authorizes them.

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = getSupabase()
    const now = new Date()
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    // Find all authorized holds expiring within 48 hours
    const { data: expiringPayments, error } = await supabase
      .from('payments')
      .select(`
        id,
        booking_id,
        stripe_payment_intent_id,
        stripe_customer_id,
        stripe_payment_method_id,
        hold_amount,
        hold_expires_at,
        bookings!inner(
          id,
          subtotal,
          detailer_id,
          customer_id,
          detailer_profiles!inner(stripe_account_id)
        )
      `)
      .eq('status', 'authorized')
      .lte('hold_expires_at', in48Hours.toISOString())
      .gt('hold_expires_at', now.toISOString())

    if (error) {
      return errorResponse(`Failed to fetch expiring payments: ${error.message}`, 500)
    }

    const results = {
      processed: 0,
      reauthed: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const payment of expiringPayments || []) {
      results.processed++

      try {
        const booking = (payment.bookings as any)
        const detailerProfile = booking.detailer_profiles

        const amountCents = Math.round(Number(payment.hold_amount) * 100)

        // Cancel the expiring hold
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)

        // Create a fresh authorization hold
        const newIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: 'usd',
          capture_method: 'manual',
          customer: payment.stripe_customer_id,
          payment_method: payment.stripe_payment_method_id,
          confirm: true,
          off_session: true,
          transfer_data: {
            destination: detailerProfile.stripe_account_id,
          },
          metadata: {
            booking_id: payment.booking_id,
            type: 're_auth',
            platform: 'foam',
          },
        })

        const newHoldPlacedAt = new Date().toISOString()
        const newHoldExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        await supabase
          .from('payments')
          .update({
            stripe_payment_intent_id: newIntent.id,
            hold_placed_at: newHoldPlacedAt,
            hold_expires_at: newHoldExpiresAt,
            hold_re_auth_failed_at: null,
          })
          .eq('id', payment.id)

        results.reauthed++
      } catch (reAuthErr) {
        results.failed++
        const errMsg = reAuthErr instanceof Error ? reAuthErr.message : String(reAuthErr)
        results.errors.push(`Payment ${payment.id}: ${errMsg}`)

        // Mark re-auth failure and notify customer
        await supabase
          .from('payments')
          .update({ hold_re_auth_failed_at: now.toISOString() })
          .eq('id', payment.id)

        // Notify customer to update payment method — 24hr window
        await supabase.functions.invoke('send-notification', {
          body: {
            user_id: (payment.bookings as any).customer_id,
            type: 'hold_reauth_failed',
            booking_id: payment.booking_id,
            message: 'Your payment hold could not be renewed. Please update your payment method within 24 hours to keep your booking.',
          },
        })
      }
    }

    return jsonResponse({
      success: true,
      ...results,
    })
  } catch (err) {
    console.error('stripe-hold-expire error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
