import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders, handleCors, getSupabase, jsonResponse, errorResponse } from '../_shared/stripe-utils.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { modification_id, action } = await req.json()
    // action: 'approve' | 'reject'

    if (!modification_id || !action) {
      return errorResponse('modification_id and action are required')
    }
    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('action must be "approve" or "reject"')
    }

    const supabase = getSupabase()

    const { data: modification, error: modError } = await supabase
      .from('booking_modifications')
      .select(`
        *,
        bookings!inner(
          id,
          customer_id,
          payments!inner(*)
        )
      `)
      .eq('id', modification_id)
      .single()

    if (modError || !modification) {
      return errorResponse('Modification not found', 404)
    }

    if (action === 'reject') {
      await supabase
        .from('booking_modifications')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', modification_id)

      return jsonResponse({ success: true, action: 'rejected' })
    }

    // ── APPROVE ──────────────────────────────────────────────
    if (modification.modification_type !== 'service_added') {
      return errorResponse('Only service_added modifications create additional holds', 400)
    }

    const payment = (modification.bookings as any).payments[0]
    if (!payment) {
      return errorResponse('No payment found for this booking', 404)
    }

    const additionalAmountCents = Math.round(Number(modification.new_price) * 100)

    const additionalIntent = await stripe.paymentIntents.create({
      amount: additionalAmountCents,
      currency: 'usd',
      capture_method: 'manual',
      customer: payment.stripe_customer_id,
      payment_method: payment.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      metadata: {
        booking_id: modification.booking_id,
        modification_id,
        type: 'modification_hold',
        platform: 'foam',
      },
    })

    // Store the new intent on the modification record
    await supabase
      .from('booking_modifications')
      .update({
        status: 'approved',
        stripe_payment_intent_id: additionalIntent.id,
        hold_amount: modification.new_price,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', modification_id)

    // Append to payment's modification_intents array
    const existingIntents: any[] = payment.modification_intents || []
    await supabase
      .from('payments')
      .update({
        modification_intents: [
          ...existingIntents,
          {
            modification_id,
            payment_intent_id: additionalIntent.id,
            amount: modification.new_price,
            captured: false,
          },
        ],
      })
      .eq('id', payment.id)

    // Notify customer of the additional hold
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: (modification.bookings as any).customer_id,
        type: 'service_added',
        modification_id,
        amount: modification.new_price,
      },
    })

    return jsonResponse({
      success: true,
      action: 'approved',
      payment_intent_id: additionalIntent.id,
      hold_amount: modification.new_price,
    })
  } catch (err) {
    console.error('booking-modification-request error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
