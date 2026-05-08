import { corsHeaders, handleCors, getSupabase, jsonResponse, errorResponse } from '../_shared/stripe-utils.ts'

// Step 1 of the no-show flow.
// Operator calls this when the customer hasn't arrived.
// Sends a grace-period notification and marks the booking.
// After 10 minutes, the operator calls no-show-confirm.

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { booking_id } = await req.json()

    if (!booking_id) {
      return errorResponse('booking_id is required')
    }

    const supabase = getSupabase()

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        customer_id,
        customer_profiles!inner(id)
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 404)
    }

    if (booking.status !== 'in_progress' && booking.status !== 'confirmed') {
      return errorResponse(`Cannot report no-show for booking with status: ${booking.status}`, 400)
    }

    const now = new Date().toISOString()

    // Mark booking as in grace period
    await supabase
      .from('bookings')
      .update({
        status: 'no_show',
        no_show_reported_at: now,
        updated_at: now,
      })
      .eq('id', booking_id)

    // Send 10-minute grace period notification to customer
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: (booking.customer_profiles as any).id,
        type: 'no_show_grace_period',
        booking_id,
        message: 'Your detailer is at the location. Are you on your way? You have 10 minutes before a no-show fee is applied.',
      },
    })

    return jsonResponse({
      success: true,
      message: 'Grace period started. Call no-show-confirm after 10 minutes if customer does not arrive.',
      no_show_reported_at: now,
    })
  } catch (err) {
    console.error('no-show-report error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
