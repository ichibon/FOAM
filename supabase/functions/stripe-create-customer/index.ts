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
    const { user_id, email, full_name, phone } = await req.json()

    if (!user_id || !email) {
      return errorResponse('user_id and email are required')
    }

    const supabase = getSupabase()

    // Check if customer profile already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', user_id)
      .single()

    if (!profile) {
      return errorResponse('Customer profile not found', 404)
    }

    if (profile.stripe_customer_id) {
      return jsonResponse({ stripe_customer_id: profile.stripe_customer_id })
    }

    // Create new Stripe Customer
    const customer = await stripe.customers.create({
      email,
      name: full_name,
      phone,
      metadata: {
        user_id,
        platform: 'foam',
      },
    })

    // Store on customer_profiles
    await supabase
      .from('customer_profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', profile.id)

    return jsonResponse({ stripe_customer_id: customer.id })
  } catch (err) {
    console.error('stripe-create-customer error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
