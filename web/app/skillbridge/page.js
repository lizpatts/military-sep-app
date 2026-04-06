'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SkillBridgePage() {
  const router = useRouter()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef({})
  const infoWindowRef = useRef(null)

  const [locations, setLocations] = useState([])
  const [favorites, setFavorites] = useState({})
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [showDoDPanel, setShowDoDPanel] = useState(false)
const [showCommunityOnly, setShowCommunityOnly] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)
const [form, setForm] = useState({
  employer_name: '', industry: 'Technology', city: '', state: '',
  duration_weeks: '12', url: '', description: '', notes: '',
  branches_eligible: 'all', submitted_by_branch: ''
})

  const [filterBranch, setFilterBranch] = useState('All')
  const [filterIndustry, setFilterIndustry] = useState('All')
  const [filterDuration, setFilterDuration] = useState('All')
  const [search, setSearch] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const branches = ['All', 'Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard']
  const industries = ['All', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Government', 'Logistics', 'Education', 'Other']
  const durations = ['All', '0-90 days', '91-180 days']
  const industryOptions = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Government', 'Logistics', 'Education', 'Other']

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: favData } = await supabase
          .from('skillbridge_favorites')
          .select('location_id')
          .eq('user_id', session.user.id)
        const favMap = {}
        favData?.forEach(f => { favMap[f.location_id] = true })
        setFavorites(favMap)
      }

      const { data } = await supabase
        .from('skillbridge_locations')
        .select('*')
        .in('status', ['approved', 'pending'])
        .order('employer_name')

      setLocations(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!loading && !mapLoaded) loadGoogleMaps()
  }, [loading])

  const loadGoogleMaps = () => {
    if (window.google) { initMap(); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.onload = () => initMap()
    document.head.appendChild(script)
  }

  const initMap = () => {
    if (!mapRef.current) return
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: 4,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0f2035' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8899aa' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#2563eb' }] },
      ]
    })
    infoWindowRef.current = new window.google.maps.InfoWindow()
    setMapLoaded(true)
  }

const filteredLocations = locations.filter(loc => {
    if (showFavoritesOnly && !favorites[loc.id]) return false
    if (showCommunityOnly && !loc.is_community_submitted) return false
    if (filterBranch !== 'All') {
      const b = loc.branches_eligible
      if (!b) return false
      if (b !== 'all' && !b.includes(filterBranch)) return false
    }
    if (filterIndustry !== 'All' && loc.industry !== filterIndustry) return false
    if (filterDuration !== 'All') {
      if (filterDuration === '0-90 days' && loc.duration_weeks > 13) return false
      if (filterDuration === '91-180 days' && (loc.duration_weeks <= 13 || loc.duration_weeks > 26)) return false
    }
    if (search && !loc.employer_name?.toLowerCase().includes(search.toLowerCase()) &&
      !loc.city?.toLowerCase().includes(search.toLowerCase()) &&
      !loc.state?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getMarkerColor = (loc) => {
    if (loc.status === 'pending') return '#f59e0b'
    if (favorites[loc.id]) return '#f59e0b'
    return '#2563eb'
  }

  const openInfoWindow = (loc, marker, favs) => {
    const isFav = favs[loc.id]
    const isPending = loc.status === 'pending'
    infoWindowRef.current.setContent(`
      <div style="background:#0f2035;color:white;padding:12px;border-radius:8px;min-width:220px;font-family:sans-serif">
        ${isPending ? `<div style="background:#f59e0b22;border:1px solid #f59e0b;color:#f59e0b;padding:4px 10px;border-radius:6px;font-size:11px;margin-bottom:8px">⏳ Pending Approval</div>` : ''}
        <strong style="font-size:14px">${loc.employer_name}</strong>
        <p style="color:#8899aa;margin:4px 0;font-size:12px">${loc.city}, ${loc.state}</p>
        ${loc.industry ? `<p style="color:#8899aa;margin:4px 0;font-size:12px">${loc.industry}</p>` : ''}
        ${loc.duration_weeks ? `<p style="color:#8899aa;margin:4px 0;font-size:12px">~${loc.duration_weeks} weeks</p>` : ''}
        ${loc.description ? `<p style="color:#8899aa;margin:4px 0;font-size:12px;font-style:italic">"${loc.description}"</p>` : ''}
        ${loc.url ? `<a href="${loc.url}" target="_blank" style="color:#2563eb;font-size:12px;display:block;margin-top:6px">View opportunity →</a>` : ''}
        ${!isPending ? `
        <button 
          onclick="window.toggleFavFromMap('${loc.id}')"
          style="margin-top:8px;width:100%;padding:6px;border-radius:6px;border:1px solid ${isFav ? '#f59e0b' : '#1e3a5f'};background:${isFav ? '#f59e0b22' : 'transparent'};color:${isFav ? '#f59e0b' : '#8899aa'};cursor:pointer;font-size:12px"
        >
          ${isFav ? '★ Favorited' : '☆ Save to Favorites'}
        </button>` : ''}
      </div>
    `)
    infoWindowRef.current.open(mapInstance.current, marker)
  }

  useEffect(() => {
    window.toggleFavFromMap = async (locId) => {
      if (!user) { alert('Please sign in to save favorites'); return }
      const isFav = favorites[locId]
      const newFavs = { ...favorites, [locId]: !isFav }
      setFavorites(newFavs)

      if (isFav) {
        await supabase.from('skillbridge_favorites').delete()
          .eq('user_id', user.id).eq('location_id', locId)
      } else {
        await supabase.from('skillbridge_favorites').insert({ user_id: user.id, location_id: locId })
      }

      const marker = markersRef.current[locId]
      if (marker) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: !isFav ? '#f59e0b' : '#2563eb',
          fillOpacity: 1,
          strokeColor: !isFav ? '#f59e0b' : '#2563eb',
          strokeWeight: 2
        })
      }

      const loc = locations.find(l => l.id === locId)
      if (loc && marker) openInfoWindow(loc, marker, newFavs)
    }
  }, [favorites, locations, user])

  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return

    Object.values(markersRef.current).forEach(m => m.setMap(null))
    markersRef.current = {}

    filteredLocations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return
      const color = getMarkerColor(loc)
      const isPending = loc.status === 'pending'

      const marker = new window.google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapInstance.current,
        title: loc.employer_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isPending ? 7 : 8,
          fillColor: color,
          fillOpacity: isPending ? 0.5 : 1,
          strokeColor: color,
          strokeWeight: isPending ? 1 : 2
        }
      })

      marker.addListener('click', () => {
        setSelectedLocation(loc)
        openInfoWindow(loc, marker, favorites)
      })
      marker.addListener('mouseover', () => {
        openInfoWindow(loc, marker, favorites)
      })

      markersRef.current[loc.id] = marker
    })
  }, [mapLoaded, filteredLocations, favorites])

  const toggleFavorite = async (locId) => {
    if (!user) { alert('Please sign in to save favorites'); return }
    const isFav = favorites[locId]
    const newFavs = { ...favorites, [locId]: !isFav }
    setFavorites(newFavs)

    if (isFav) {
      await supabase.from('skillbridge_favorites').delete()
        .eq('user_id', user.id).eq('location_id', locId)
    } else {
      await supabase.from('skillbridge_favorites').insert({ user_id: user.id, location_id: locId })
    }

    const marker = markersRef.current[locId]
    if (marker) {
      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: !isFav ? '#f59e0b' : '#2563eb',
        fillOpacity: 1,
        strokeColor: !isFav ? '#f59e0b' : '#2563eb',
        strokeWeight: 2
      })
    }
  }

  const focusLocation = (loc) => {
    if (!mapInstance.current || !loc.latitude || !loc.longitude) return
    mapInstance.current.panTo({ lat: loc.latitude, lng: loc.longitude })
    mapInstance.current.setZoom(10)
    setSelectedLocation(loc)
    const marker = markersRef.current[loc.id]
    if (marker) openInfoWindow(loc, marker, favorites)
  }

  const handleSubmit = async () => {
    if (!user) { alert('Please sign in to submit a location'); return }
    if (!form.employer_name || !form.city || !form.state) {
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields including coordinates.' })
      return
    }
    setSubmitLoading(true)
    setSubmitMessage(null)

    const res = await fetch('/api/skillbridge/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()

    if (json.success) {
      setSubmitMessage({ type: 'success', text: '✅ Submitted! Your location will show as pending until approved.' })
      setLocations(prev => [...prev, json.data])
      setForm({
        employer_name: '', industry: 'Technology', city: '', state: '',
        latitude: '', longitude: '', duration_weeks: '12',
        url: '', description: '', branches_eligible: 'all'
      })
      setTimeout(() => setShowSubmitForm(false), 2000)
    } else {
      setSubmitMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    }
    setSubmitLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a1628', color: 'white', fontFamily: 'sans-serif' }}>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f2035', border: '1px solid #1e3a5f',
            borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '520px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'white' }}>Submit a SkillBridge Location</h2>
              <button onClick={() => setShowSubmitForm(false)}
                style={{ background: 'none', border: 'none', color: '#8899aa', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Know of a SkillBridge opportunity not on the map? Submit it here. It will show as ⏳ pending until approved.
            </p>

            {submitMessage && (
              <div style={{
                background: submitMessage.type === 'success' ? '#14532d' : '#450a0a',
                border: `1px solid ${submitMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
                color: submitMessage.type === 'success' ? '#22c55e' : '#ef4444',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem'
              }}>
                {submitMessage.text}
              </div>
            )}

            {[
              { label: 'Employer Name *', key: 'employer_name', placeholder: 'e.g. Raytheon Technologies' },
              { label: 'City *', key: 'city', placeholder: 'e.g. San Diego' },
              { label: 'State *', key: 'state', placeholder: 'e.g. CA' },
              { label: 'Program URL', key: 'url', placeholder: 'https://...' },
              { label: 'Description', key: 'description', placeholder: 'Brief description of the opportunity...' },
              { label: 'Your Branch', key: 'submitted_by_branch', placeholder: 'e.g. Army, Navy, Air Force...' },
              { label: 'Anything else other military members should know?', key: 'notes', placeholder: 'e.g. Security clearance preferred, remote-friendly, great for 68Ws...' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#8899aa', fontSize: '0.8rem', marginBottom: '4px' }}>
                  {field.label}
                </label>
                <input
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#8899aa', fontSize: '0.8rem', marginBottom: '4px' }}>Industry</label>
              <select value={form.industry} onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))} style={{ ...selectStyle, width: '100%' }}>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#8899aa', fontSize: '0.8rem', marginBottom: '4px' }}>Duration (weeks)</label>
              <input
                type="number"
                value={form.duration_weeks}
                onChange={e => setForm(prev => ({ ...prev, duration_weeks: e.target.value }))}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
            </div>



            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowSubmitForm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'transparent', color: '#8899aa', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitLoading}
                style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: submitLoading ? 0.6 : 1 }}>
                {submitLoading ? 'Submitting...' : 'Submit Location'}
              </button>
            </div>
          </div>
        </div>
      )}


{/* DoD Official Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #0f2035)',
        borderBottom: '1px solid #2563eb',
        padding: '0.75rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🇺🇸</span>
          <div>
            <p style={{ margin: 0, color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
              8,000+ programs in the official DoD SkillBridge database
            </p>
            <p style={{ margin: 0, color: '#8899aa', fontSize: '0.75rem' }}>
              Browse all approved programs on the official DoD site, then come back to see what veterans in your area recommend.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowDoDPanel(!showDoDPanel)}
            style={{
              background: showDoDPanel ? '#2563eb' : '#2563eb22',
              color: '#2563eb', border: '1px solid #2563eb',
              borderRadius: '8px', padding: '8px 16px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              ...(showDoDPanel && { color: 'white' })
            }}
          >
            {showDoDPanel ? '✕ Close DoD Search' : '🔍 Search DoD Database'}
          </button>
          <button
            onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')}
            style={{
              background: 'transparent', color: '#8899aa',
              border: '1px solid #1e3a5f',
              borderRadius: '8px', padding: '8px 16px',
              cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            Open in New Tab →
          </button>
        </div>
      </div>

      {/* DoD Embedded Panel */}
{showDoDPanel && (
        <div style={{ borderBottom: '1px solid #1e3a5f', background: '#0a1628', padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: '#8899aa', fontSize: '0.85rem' }}>
              🔍 Search the official DoD SkillBridge database
            </p>
            <button onClick={() => setShowDoDPanel(false)}
              style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              id="dod-search"
              placeholder="Search by employer, location, or industry..."
              style={{ flex: 1, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0f2035', color: 'white', fontSize: '0.95rem' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  window.open(`https://skillbridge.osd.mil/programs.htm`, '_blank')
                }
              }}
            />
            <button
              onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')}
              style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
              Search on DoD Site →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: '💻 Technology', query: 'technology' },
              { label: '🏥 Healthcare', query: 'healthcare' },
              { label: '💰 Finance', query: 'finance' },
              { label: '🏭 Manufacturing', query: 'manufacturing' },
              { label: '🏛️ Government', query: 'government' },
              { label: '🚛 Logistics', query: 'logistics' },
            ].map(cat => (
              <button key={cat.query}
                onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')}
                style={{ padding: '0.75rem', background: '#0f2035', border: '1px solid #1e3a5f', borderRadius: '8px', color: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
                {cat.label}
                <span style={{ display: 'block', color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>Browse on DoD site →</span>
              </button>
            ))}
          </div>
          <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '1rem' }}>
            ⚠️ The DoD site blocks direct embedding for security reasons. All searches open in a new tab.
          </p>
        </div>
      )}


      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') {
    router.push(`/dashboard?${params.toString()}`)
  } else {
    router.push('/dashboard')
  }
}} style={backButtonStyle}>← Dashboard</button>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>SkillBridge Map</h1>
          <span style={{ color: '#445566', fontSize: '0.85rem', marginLeft: 'auto' }}>
            {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
          </span>
          {user && (
            <button onClick={() => { setShowSubmitForm(true); setSubmitMessage(null) }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #2563eb', background: '#2563eb22', color: '#2563eb', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
              + Submit Location
            </button>
          )}
          {user?.email === 'lizkaypatterson@gmail.com' && (
            <button onClick={() => router.push('/admin/skillbridge')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #22c55e', background: '#22c55e22', color: '#22c55e', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
              🛡️ Admin
            </button>
          )}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employer, city, or state..."
          style={{ ...inputStyle, marginBottom: '0.75rem' }}
        />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={selectStyle}>
            {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
          </select>
          <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={selectStyle}>
            {industries.map(i => <option key={i} value={i}>{i === 'All' ? 'All Industries' : i}</option>)}
          </select>
          <select value={filterDuration} onChange={e => setFilterDuration(e.target.value)} style={selectStyle}>
            {durations.map(d => <option key={d} value={d}>{d === 'All' ? 'All Durations' : d}</option>)}
          </select>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid',
              borderColor: showFavoritesOnly ? '#f59e0b' : '#1e3a5f',
              backgroundColor: showFavoritesOnly ? '#f59e0b22' : 'transparent',
              color: showFavoritesOnly ? '#f59e0b' : '#8899aa',
              fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ★ Favorites only
          </button>
          <button
            onClick={() => setShowCommunityOnly(!showCommunityOnly)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid',
              borderColor: showCommunityOnly ? '#22c55e' : '#1e3a5f',
              backgroundColor: showCommunityOnly ? '#22c55e22' : 'transparent',
              color: showCommunityOnly ? '#22c55e' : '#8899aa',
              fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            👥 Community only
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 220px)' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {!mapLoaded && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#445566', zIndex: 1 }}>
              Loading map...
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div style={{ overflowY: 'auto', borderLeft: '1px solid #1e3a5f', backgroundColor: '#0a1628' }}>
          {loading ? (
            <div style={{ padding: '2rem', color: '#445566', textAlign: 'center' }}>Loading locations...</div>
          ) : filteredLocations.length === 0 ? (
            <div style={{ padding: '2rem', color: '#445566', textAlign: 'center' }}>
              <p>No locations found.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Try adjusting your filters.</p>
            </div>
          ) : (
            filteredLocations.map(loc => (
              <div
                key={loc.id}
                onClick={() => focusLocation(loc)}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #1e3a5f',
                  cursor: 'pointer',
                  backgroundColor: selectedLocation?.id === loc.id ? '#0f2035' : 'transparent',
                  borderLeft: loc.status === 'pending' ? '3px solid #f59e0b' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: '500', fontSize: '0.95rem' }}>
                      {loc.employer_name}
                    </p>
                    <p style={{ margin: '0 0 4px', color: '#8899aa', fontSize: '0.8rem' }}>
                      {loc.city}, {loc.state}
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '6px' }}>
                      {loc.industry && <span style={tagStyle('#2563eb')}>{loc.industry}</span>}
                      {loc.duration_weeks && <span style={tagStyle('#0891b2')}>~{loc.duration_weeks}wks</span>}
                      {loc.status === 'pending' && <span style={tagStyle('#f59e0b')}>⏳ Pending</span>}
                      {loc.is_community_submitted && loc.status === 'approved' && <span style={tagStyle('#22c55e')}>Community</span>}
                    </div>
                  </div>
                  {loc.status !== 'pending' && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(loc.id) }}
                      style={{ backgroundColor: 'transparent', border: 'none', color: favorites[loc.id] ? '#f59e0b' : '#445566', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
                    >
                      {favorites[loc.id] ? '★' : '☆'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px', flexWrap: 'wrap' }}>
                  {loc.url && (
                    <div onClick={e => { e.stopPropagation(); window.open(loc.url, '_blank') }}
                      style={{ color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer' }}>
                      View opportunity →
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const tagStyle = (color) => ({
  fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
  backgroundColor: color + '22', border: `1px solid ${color}`, color: color
})

const backButtonStyle = {
  backgroundColor: 'transparent', color: '#8899aa',
  border: '1px solid #1e3a5f', padding: '8px 16px',
  borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer'
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #1e3a5f', backgroundColor: '#0f2035',
  color: 'white', fontSize: '0.95rem', boxSizing: 'border-box'
}

const selectStyle = {
  padding: '8px 12px', borderRadius: '8px', border: '1px solid #1e3a5f',
  backgroundColor: '#0f2035', color: 'white', fontSize: '0.85rem', cursor: 'pointer'
}