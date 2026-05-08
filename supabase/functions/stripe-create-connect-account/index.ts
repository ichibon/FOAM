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
    const { operator_id, email, business_name, country = 'US' } = await req.json()

    if (!operator_id || !email) {
      return errorResponse('operator_id and email are required')
    }

    const supabase = getSupabase()

    // Check if operator already has a Connect account
    const { data: profile } = await supabase
      .from('detailer_profiles')
      .select('stripe_account_id')
      .eq('id', operator_id)
      .single()

    let connectAccountId = profile?.stripe_account_id

    if (!connectAccountId) {
      // Create a new Express Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: business_name,
          mcc: '7542', // Car washes / auto detailing
          url: 'https://foam.app',
        },
        metadata: {
          operator_id,
          platform: 'foam',
        },
      })

      connectAccountId = account.id

      // Store the Connect account ID on the operator profile
      await supabase
        .from('detailer_profiles')
        .update({ stripe_account_id: connectAccountId })
        .eq('id', operator_id)
    }

    // Create an Account Session for embedded onboarding
    const accountSession = await stripe.accountSessions.create({
      account: connectAccountId,
      components: {
        account_onboarding: { enabled: true },
      },
    })

    return jsonResponse({
      account_id: connectAccountId,
      client_secret: accountSession.client_secret,
    })
  } catch (err) {
    console.error('stripe-create-connect-account error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
