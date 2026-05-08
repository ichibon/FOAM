import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

export function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Returns the platform fee rate for a given operator profile.
 * Checks platform_fee_override first, then falls back to subscription tier.
 */
export async function getPlatformFeeRate(
  supabase: ReturnType<typeof getSupabase>,
  detailerProfileId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('detailer_profiles')
    .select('subscription_tier, platform_fee_override')
    .eq('id', detailerProfileId)
    .single()

  if (error || !data) return 0.15

  if (data.platform_fee_override !== null && data.platform_fee_override !== undefined) {
    return Number(data.platform_fee_override)
  }

  const rates: Record<string, number> = {
    starter: 0.15,
    pro: 0.12,
    crew: 0.10,
  }
  return rates[data.subscription_tier] ?? 0.15
}
