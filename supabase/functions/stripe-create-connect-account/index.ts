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
    const body = await req.json()

    const supabase = getSupabase()

    // Accept either user_id (from app) or operator_id + email (legacy)
    let operator_id: string = body.operator_id
    let email: string = body.email
    let business_name: string = body.business_name
    const country: string = body.country ?? 'US'

    if (body.user_id && !operator_id) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(body.user_id)
      if (userError || !user) return errorResponse('User not found', 404)
      email = email ?? user.email ?? ''

      const { data: prof } = await supabase
        .from('detailer_profiles')
        .select('id, business_name')
        .eq('user_id', body.user_id)
        .single()
      if (!prof) return errorResponse('Operator profile not found', 404)
      operator_id = prof.id
      business_name = business_name ?? prof.business_name
    }

    if (!operator_id || !email) {
      return errorResponse('operator_id and email are required')
    }

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

    // Create a hosted Account Link for onboarding (works reliably in mobile WebViews)
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: 'https://getfoam.app/stripe/refresh',
      return_url: 'https://getfoam.app/stripe/return',
      type: 'account_onboarding',
    })

    return jsonResponse({
      account_id: connectAccountId,
      account_link_url: accountLink.url,
    })
  } catch (err) {
    console.error('stripe-create-connect-account error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
