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
  const dayOfMonth = today.getDate()
  const isDigestDay = dayOfMonth === 1 || dayOfMonth === 15

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, separation_date, notify_email, full_name, email')
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

    // --- Milestone emails (fire once ever, on exact day) ---
    let milestoneType = null
    if (daysUntil === 365) milestoneType = '365_days'
    else if (daysUntil === 180) milestoneType = '180_days'
    else if (daysUntil === 90) milestoneType = '90_days'
    else if (daysUntil === 30) milestoneType = '30_days'
    else if (daysUntil === 7) milestoneType = 'separation_week'
    else if (daysAfter === 90) milestoneType = '90_days_post'
    else if (daysAfter === 180) milestoneType = '180_days_post'
    else if (daysAfter === 365) milestoneType = '365_days_post'
    else if (daysAfter === 730) milestoneType = '730_days_post'

    if (milestoneType) {
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', milestoneType)
        .single()

      if (!existing) {
        await fetch(`${baseUrl}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.id, type: milestoneType })
        })
        await supabase.from('notification_log').insert({
          user_id: profile.id,
          type: milestoneType,
          sent_at: new Date().toISOString()
        })
        sent++
      }
    }

    // --- Twice-monthly digest (1st and 15th only, not after separation) ---
    if (isDigestDay && daysUntil > 0) {
      // Build a digest key like "digest_2026_04_01" so it fires once per period
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = today.getFullYear()
      const digestKey = `digest_${year}_${month}_${dayOfMonth === 1 ? '01' : '15'}`

      const { data: existingDigest } = await supabase
        .from('notification_log')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', digestKey)
        .single()

      if (!existingDigest) {
        // Fetch checklist data for this user
        const { data: allItems } = await supabase
          .from('checklist_items')
          .select('*')

        const { data: userProgress } = await supabase
          .from('user_checklist_progress')
          .select('checklist_item_id, completed, hidden')
          .eq('user_id', profile.id)

        const completedMap = {}
        const hiddenMap = {}
        userProgress?.forEach(p => {
          completedMap[p.checklist_item_id] = p.completed
          hiddenMap[p.checklist_item_id] = p.hidden
        })

        const activeItems = (allItems || []).filter(item => {
          if (hiddenMap[item.id] && !completedMap[item.id]) return false
          return true
        })
        const completedCount = activeItems.filter(item => completedMap[item.id]).length
        const totalCount = activeItems.length
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

        // High and critical items not yet completed
        const urgentItems = (allItems || [])
          .filter(item =>
            !completedMap[item.id] &&
            !hiddenMap[item.id] &&
            (item.priority === 'critical' || item.priority === 'high')
          )
          .sort((a, b) => {
            const order = { critical: 0, high: 1 }
            return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
          })
          .slice(0, 6)

        await fetch(`${baseUrl}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.id,
            type: 'digest',
            digestData: {
              daysUntil,
              completedCount,
              totalCount,
              progressPct,
              urgentItems
            }
          })
        })

        await supabase.from('notification_log').insert({
          user_id: profile.id,
          type: digestKey,
          sent_at: new Date().toISOString()
        })
        sent++
      }
    }
  }

  return Response.json({ sent, total: profiles.length })
}