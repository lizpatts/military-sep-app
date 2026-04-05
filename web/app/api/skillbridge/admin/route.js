import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const ADMIN_EMAIL = 'lizkaypatterson@gmail.com'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        }
      }
    }
  )
}

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export async function GET(request) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'

  let query = getAdminSupabase()
    .from('skillbridge_locations')
    .select('*')
    .order('created_at', { ascending: false })

  if (!all) query = query.eq('status', 'pending')

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function PATCH(request) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await request.json()
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await getAdminSupabase()
    .from('skillbridge_locations')
    .update({ status })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function PUT(request) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, employer_name, industry, city, state, latitude, longitude, duration_weeks, url, description, notes, branches_eligible } = body

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await getAdminSupabase()
    .from('skillbridge_locations')
    .update({
      employer_name, industry, city, state,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      duration_weeks: duration_weeks ? parseInt(duration_weeks) : null,
      url, description, notes, branches_eligible
    })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function DELETE(request) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await getAdminSupabase()
    .from('skillbridge_locations')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}