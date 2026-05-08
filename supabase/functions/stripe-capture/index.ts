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
    const { booking_id, tip_amount = 0, instant_payout = false } = await req.json()

    if (!booking_id) {
      return errorResponse('booking_id is required')
    }

    const supabase = getSupabase()

    // Fetch booking + payment
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        subtotal,
        detailer_id,
        detailer_profiles!inner(
          id,
          stripe_account_id,
          tip_distribution_model,
          tip_crew_percentage,
          tip_operator_percentage,
          instant_payout_enabled
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

    // ── 1. Capture the main service hold ────────────────────
    const captured = await stripe.paymentIntents.capture(
      payment.stripe_payment_intent_id
    )

    // ── 2. Capture any modification holds ───────────────────
    const modificationIntents: any[] = payment.modification_intents || []
    const capturedModifications = []

    for (const mod of modificationIntents) {
      if (!mod.captured) {
        try {
          await stripe.paymentIntents.capture(mod.payment_intent_id)
          capturedModifications.push({ ...mod, captured: true })
        } catch (modErr) {
          console.error(`Failed to capture modification hold ${mod.payment_intent_id}:`, modErr)
          // Don't fail the whole capture — log and continue
          capturedModifications.push({ ...mod, capture_failed: true })
        }
      } else {
        capturedModifications.push(mod)
      }
    }

    // ── 3. Create tip PaymentIntent (only after successful capture) ──
    let tipIntentId: string | null = null
    let tipIntentStatus: string | null = null

    if (tip_amount > 0 && captured.status === 'succeeded') {
      const tipAmountCents = Math.round(tip_amount * 100)
      const feeRate = await getPlatformFeeRate(supabase, booking.detailer_id)
      const tipFeeCents = Math.round(tipAmountCents * feeRate)

      const tipIntent = await stripe.paymentIntents.create({
        amount: tipAmountCents,
        currency: 'usd',
        customer: payment.stripe_customer_id,
        payment_method: payment.stripe_payment_method_id,
        confirm: true,
        off_session: true,
        application_fee_amount: tipFeeCents,
        transfer_data: {
          destination: detailerProfile.stripe_account_id,
        },
        metadata: {
          booking_id,
          type: 'tip',
          platform: 'foam',
        },
      })

      tipIntentId = tipIntent.id
      tipIntentStatus = tipIntent.status

      // ── 4. Distribute tip to crew ────────────────────────
      await distributeTip(supabase, booking_id, tip_amount, detailerProfile)
    }

    // ── 5. Instant payout (1.5% fee from operator net) ──────
    let instantPayoutFee: number | null = null

    if (instant_payout && detailerProfile.instant_payout_enabled) {
      const totalCaptured =
        Number(booking.subtotal) +
        modificationIntents.reduce((sum: number, m: any) => sum + (m.captured ? Number(m.amount) : 0), 0)

      const feeRate = await getPlatformFeeRate(supabase, booking.detailer_id)
      const operatorNet = totalCaptured * (1 - feeRate)
      instantPayoutFee = operatorNet * 0.015

      try {
        await stripe.payouts.create(
          {
            amount: Math.round((operatorNet - instantPayoutFee) * 100),
            currency: 'usd',
            method: 'instant',
            metadata: { booking_id, type: 'instant_payout', platform: 'foam' },
          },
          { stripeAccount: detailerProfile.stripe_account_id }
        )
      } catch (payoutErr) {
        console.error('Instant payout failed:', payoutErr)
        instantPayoutFee = null
      }
    }

    // ── 6. Update payment record ─────────────────────────────
    await supabase
      .from('payments')
      .update({
        status: 'captured',
        capture_amount: booking.subtotal,
        tip_amount: tip_amount > 0 ? tip_amount : undefined,
        tip_payment_intent_id: tipIntentId,
        tip_payment_status: tipIntentStatus,
        modification_intents: capturedModifications.length > 0 ? capturedModifications : undefined,
        instant_payout_requested: instant_payout,
        instant_payout_fee: instantPayoutFee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    // ── 7. Mark booking completed ───────────────────────────
    await supabase
      .from('bookings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', booking_id)

    return jsonResponse({
      success: true,
      captured_amount: booking.subtotal,
      tip_amount: tip_amount > 0 ? tip_amount : 0,
      instant_payout_fee: instantPayoutFee,
    })
  } catch (err) {
    console.error('stripe-capture error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})

async function distributeTip(
  supabase: ReturnType<typeof import('../_shared/stripe-utils.ts').getSupabase>,
  bookingId: string,
  tipAmount: number,
  detailerProfile: any
): Promise<void> {
  const { data: crewRows } = await supabase
    .from('booking_crew')
    .select('id, team_member_id')
    .eq('booking_id', bookingId)

  const model = detailerProfile.tip_distribution_model || 'assigned_crew'
  const crewPct = Number(detailerProfile.tip_crew_percentage) / 100
  const crewTipPool = tipAmount * crewPct

  if (!crewRows || crewRows.length === 0) return

  const perCrewMember = crewTipPool / crewRows.length
  const perCrewPct = (1 / crewRows.length) * Number(detailerProfile.tip_crew_percentage)

  for (const row of crewRows) {
    await supabase
      .from('booking_crew')
      .update({
        tip_share: perCrewMember,
        tip_percentage: perCrewPct,
      })
      .eq('id', row.id)
  }
}
