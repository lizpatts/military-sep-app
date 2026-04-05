import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'


export async function POST(request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        }
      },
    }
  )
  // Check user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'You must be logged in to submit a location.' }, { status: 401 })
  }

  const body = await request.json()
const { employer_name, industry, city, state, duration_weeks, url, description, notes, branches_eligible } = body

if (!employer_name || !city || !state) {
  return Response.json({ error: 'Missing required fields.' }, { status: 400 })
}

// Geocode city/state using Google Maps Geocoding API
let latitude = null
let longitude = null
try {
  const geoRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', ' + state)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  )
  const geoData = await geoRes.json()
  if (geoData.results?.[0]?.geometry?.location) {
    latitude = geoData.results[0].geometry.location.lat
    longitude = geoData.results[0].geometry.location.lng
  }
} catch (e) {
  console.error('Geocoding failed:', e)
}

const { data, error } = await supabase
  .from('skillbridge_locations')
  .insert([{
    employer_name: employer_name.trim(),
    industry: industry || 'Other',
    city: city.trim(),
    state: state.trim().toUpperCase(),
    latitude,
    longitude,
    duration_weeks: parseInt(duration_weeks) || 12,
    url: url?.trim() || null,
    description: description?.trim() || null,
    notes: notes?.trim() || null,
    branches_eligible: branches_eligible || 'all',
    is_community_submitted: true,
    submitted_by: user.id,
    status: 'pending'
  }])
  .select()
  .single()

  if (error) {
    console.error('Submit error:', error)
    return Response.json({ error: 'Failed to submit location. Please try again.' }, { status: 500 })
  }

  return Response.json({ success: true, data })
}