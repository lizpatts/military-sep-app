export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, separation_date, notify_email, full_name')
    .eq('notify_email', true)

  if (!profiles?.length) return Response.json({ sent: 0 })

  let sent = 0
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://military-sep-app.vercel.app'

  for (const profile of profiles) {
    if (!profile.separation_date) continue

    const sepDate = new Date(profile.separation_date)
    sepDate.setHours(0, 0, 0, 0)
    const daysUntil = Math.round((sepDate - today) / (1000 * 60 * 60 * 24))
    const daysAfter = Math.round((today - sepDate) / (1000 * 60 * 60 * 24))

    let type = null
    if (daysUntil === 365) type = '365_days'
    else if (daysUntil === 180) type = '180_days'
    else if (daysUntil === 90) type = '90_days'
    else if (daysUntil === 30) type = '30_days'
    else if (daysUntil === 7) type = 'separation_week'
    else if (daysAfter === 90) type = '90_days_post'
    else if (daysAfter === 180) type = '180_days_post'
    else if (daysAfter === 365) type = '365_days_post'
    else if (daysAfter === 730) type = '730_days_post'

    if (!type) continue

    const { data: existing } = await supabase
      .from('notification_log')
      .select('id')
      .eq('user_id', profile.id)
      .eq('type', type)
      .single()

    if (existing) continue

    await fetch(`${baseUrl}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.id, type })
    })

    await supabase.from('notification_log').insert({
      user_id: profile.id,
      type,
      sent_at: new Date().toISOString()
    })

    sent++
  }

  return Response.json({ sent, total: profiles.length })
}