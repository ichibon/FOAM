import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { getSupabase } from '../_shared/stripe-utils.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const body = await req.text()

  // Determine which webhook secret to use (Connect vs standard)
  const isConnectEvent = req.headers.get('stripe-account') !== null
  const webhookSecret = isConnectEvent
    ? Deno.env.get('STRIPE_WEBHOOK_SECRET_CONNECT')!
    : Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 400 })
  }

  const supabase = getSupabase()

  try {
    switch (event.type) {
      // ── PAYMENT INTENTS ──────────────────────────────────────
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        const bookingId = intent.metadata?.booking_id
        if (!bookingId) break

        await supabase
          .from('payments')
          .update({
            status: 'captured',
            payment_method_type: getPaymentMethodType(intent),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', intent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const bookingId = intent.metadata?.booking_id
        if (!bookingId) break

        await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', intent.id)

        // Notify customer
        const { data: payment } = await supabase
          .from('payments')
          .select('booking_id, bookings!inner(customer_id)')
          .eq('stripe_payment_intent_id', intent.id)
          .single()

        if (payment) {
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: (payment.bookings as any).customer_id,
              type: 'payment_failed',
              booking_id: bookingId,
              message: 'Your payment could not be processed. Please update your payment method.',
            },
          })
        }
        break
      }

      case 'payment_intent.canceled': {
        const intent = event.data.object as Stripe.PaymentIntent
        if (!intent.metadata?.booking_id) break

        await supabase
          .from('payments')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', intent.id)
        break
      }

      // ── CONNECT ACCOUNT ──────────────────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const operatorId = account.metadata?.operator_id
        if (!operatorId) break

        const isFullyOnboarded =
          account.details_submitted &&
          account.charges_enabled &&
          account.payouts_enabled

        if (isFullyOnboarded) {
          await supabase
            .from('detailer_profiles')
            .update({
              badge_verified: true,
              identity_verified_at: new Date().toISOString(),
            })
            .eq('id', operatorId)
        }
        break
      }

      // ── PAYOUTS ──────────────────────────────────────────────
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout
        await supabase
          .from('payouts')
          .update({ status: 'paid' })
          .eq('stripe_payout_id', payout.id)
        break
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout
        await supabase
          .from('payouts')
          .update({ status: 'failed' })
          .eq('stripe_payout_id', payout.id)

        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'payout_failed',
            payout_id: payout.id,
            amount: payout.amount / 100,
          },
        })
        break
      }

      // ── DISPUTES ─────────────────────────────────────────────
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const charge = await stripe.charges.retrieve(dispute.charge as string)
        const bookingId = charge.metadata?.booking_id
        if (!bookingId) break

        await supabase
          .from('payments')
          .update({
            status: 'disputed',
            dispute_opened_at: new Date().toISOString(),
          })
          .eq('booking_id', bookingId)

        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'dispute_opened',
            booking_id: bookingId,
            dispute_id: dispute.id,
            amount: dispute.amount / 100,
          },
        })
        break
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute
        const charge = await stripe.charges.retrieve(dispute.charge as string)
        const bookingId = charge.metadata?.booking_id
        if (!bookingId) break

        await supabase
          .from('payments')
          .update({
            status: dispute.status === 'won' ? 'captured' : 'disputed',
            dispute_resolved_at: new Date().toISOString(),
            dispute_outcome: dispute.status === 'won' ? 'won' : 'lost',
          })
          .eq('booking_id', bookingId)
        break
      }

      // ── SUBSCRIPTIONS ────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: profile } = await supabase
          .from('detailer_profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (profile) {
          await supabase
            .from('detailer_profiles')
            .update({ subscription_tier: 'starter' })
            .eq('id', profile.id)
        }
        break
      }
    }
  } catch (handlerErr) {
    console.error(`Error handling event ${event.type}:`, handlerErr)
    // Return 200 to prevent Stripe retries for handler-level errors
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

function getPaymentMethodType(intent: Stripe.PaymentIntent): string {
  const type = intent.payment_method_types?.[0]
  if (type === 'cashapp') return 'cashapp'
  const details = (intent as any).payment_method_details?.type
  if (details === 'apple_pay') return 'apple_pay'
  if (details === 'google_pay') return 'google_pay'
  return 'card'
}
