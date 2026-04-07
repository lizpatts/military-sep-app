'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

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
  const [isGuest, setIsGuest] = useState(false)
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
      const params = new URLSearchParams(window.location.search)
      setIsGuest(params.get('guest') === 'true')

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: favData } = await supabase
          .from('skillbridge_favorites').select('location_id').eq('user_id', session.user.id)
        const favMap = {}
        favData?.forEach(f => { favMap[f.location_id] = true })
        setFavorites(favMap)
      }

      const { data } = await supabase
        .from('skillbridge_locations').select('*')
        .in('status', ['approved', 'pending']).order('employer_name')
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
        { elementType: 'geometry', stylers: [{ color: '#f9fafb' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#2563eb' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
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
      <div style="background:#fff;color:#111;padding:12px;border-radius:8px;min-width:220px;font-family:sans-serif;border:1px solid #e5e7eb">
        ${isPending ? `<div style="background:#fffbeb;border:1px solid #fcd34d;color:#92400e;padding:4px 10px;border-radius:6px;font-size:11px;margin-bottom:8px">⏳ Pending Approval</div>` : ''}
        <strong style="font-size:14px;color:#111">${loc.employer_name}</strong>
        <p style="color:#6b7280;margin:4px 0;font-size:12px">${loc.city}, ${loc.state}</p>
        ${loc.industry ? `<p style="color:#6b7280;margin:4px 0;font-size:12px">${loc.industry}</p>` : ''}
        ${loc.duration_weeks ? `<p style="color:#6b7280;margin:4px 0;font-size:12px">~${loc.duration_weeks} weeks</p>` : ''}
        ${loc.description ? `<p style="color:#6b7280;margin:4px 0;font-size:12px;font-style:italic">"${loc.description}"</p>` : ''}
        ${loc.url ? `<a href="${loc.url}" target="_blank" style="color:#2563eb;font-size:12px;display:block;margin-top:6px">View opportunity →</a>` : ''}
        ${!isPending ? `
        <button onclick="window.toggleFavFromMap('${loc.id}')"
          style="margin-top:8px;width:100%;padding:6px;border-radius:6px;border:1px solid ${isFav ? '#fcd34d' : '#e5e7eb'};background:${isFav ? '#fffbeb' : '#f9fafb'};color:${isFav ? '#d97706' : '#6b7280'};cursor:pointer;font-size:12px">
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
        await supabase.from('skillbridge_favorites').delete().eq('user_id', user.id).eq('location_id', locId)
      } else {
        await supabase.from('skillbridge_favorites').insert({ user_id: user.id, location_id: locId })
      }
      const marker = markersRef.current[locId]
      if (marker) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE, scale: 8,
          fillColor: !isFav ? '#f59e0b' : '#2563eb', fillOpacity: 1,
          strokeColor: !isFav ? '#f59e0b' : '#2563eb', strokeWeight: 2
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
        map: mapInstance.current, title: loc.employer_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isPending ? 7 : 8,
          fillColor: color, fillOpacity: isPending ? 0.5 : 1,
          strokeColor: color, strokeWeight: isPending ? 1 : 2
        }
      })
      marker.addListener('click', () => { setSelectedLocation(loc); openInfoWindow(loc, marker, favorites) })
      marker.addListener('mouseover', () => { openInfoWindow(loc, marker, favorites) })
      markersRef.current[loc.id] = marker
    })
  }, [mapLoaded, filteredLocations, favorites])

  const toggleFavorite = async (locId) => {
    if (!user) { alert('Please sign in to save favorites'); return }
    const isFav = favorites[locId]
    const newFavs = { ...favorites, [locId]: !isFav }
    setFavorites(newFavs)
    if (isFav) {
      await supabase.from('skillbridge_favorites').delete().eq('user_id', user.id).eq('location_id', locId)
    } else {
      await supabase.from('skillbridge_favorites').insert({ user_id: user.id, location_id: locId })
    }
    const marker = markersRef.current[locId]
    if (marker) {
      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE, scale: 8,
        fillColor: !isFav ? '#f59e0b' : '#2563eb', fillOpacity: 1,
        strokeColor: !isFav ? '#f59e0b' : '#2563eb', strokeWeight: 2
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
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields.' }); return
    }
    setSubmitLoading(true)
    setSubmitMessage(null)
    const res = await fetch('/api/skillbridge/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const json = await res.json()
    if (json.success) {
      setSubmitMessage({ type: 'success', text: '✅ Submitted! Your location will show as pending until approved.' })
      setLocations(prev => [...prev, json.data])
      setForm({ employer_name: '', industry: 'Technology', city: '', state: '', duration_weeks: '12', url: '', description: '', notes: '', branches_eligible: 'all', submitted_by_branch: '' })
      setTimeout(() => setShowSubmitForm(false), 2000)
    } else {
      setSubmitMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    }
    setSubmitLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar isGuest={isGuest}
        guestBranch={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('branch') || '' : ''}
        guestSepType={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('separation_type') || '' : ''}
      />

      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Submit Form Modal */}
        {showSubmitForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#111', fontSize: '17px', fontWeight: '600' }}>Submit a SkillBridge Location</h2>
                <button onClick={() => setShowSubmitForm(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1.5rem' }}>
                Know of a SkillBridge opportunity not on the map? Submit it here. It will show as ⏳ pending until approved.
              </p>
              {submitMessage && (
                <div style={{ background: submitMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${submitMessage.type === 'success' ? '#86efac' : '#fca5a5'}`, color: submitMessage.type === 'success' ? '#15803d' : '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', fontSize: '13px' }}>
                  {submitMessage.text}
                </div>
              )}
              {[
                { label: 'Employer Name *', key: 'employer_name', placeholder: 'e.g. Raytheon Technologies' },
                { label: 'City *', key: 'city', placeholder: 'e.g. San Diego' },
                { label: 'State *', key: 'state', placeholder: 'e.g. CA' },
                { label: 'Program URL', key: 'url', placeholder: 'https://...' },
                { label: 'Description', key: 'description', placeholder: 'Brief description...' },
                { label: 'Your Branch', key: 'submitted_by_branch', placeholder: 'e.g. Army, Navy, Air Force...' },
                { label: 'Anything else military members should know?', key: 'notes', placeholder: 'e.g. Security clearance preferred, remote-friendly...' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>{field.label}</label>
                  <input value={form[field.key]} onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>Industry</label>
                <select value={form.industry} onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px' }}>
                  {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>Duration (weeks)</label>
                <input type="number" value={form.duration_weeks} onChange={e => setForm(prev => ({ ...prev, duration_weeks: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowSubmitForm(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitLoading} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px', opacity: submitLoading ? 0.6 : 1 }}>
                  {submitLoading ? 'Submitting...' : 'Submit Location'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', flexShrink: 0 }}>
          {/* DoD Banner */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🇺🇸</span>
              <div>
                <p style={{ margin: 0, color: '#1d4ed8', fontWeight: '600', fontSize: '13px' }}>8,000+ programs in the official DoD SkillBridge database</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '11px' }}>Browse all approved programs on the DoD site, then come back to see what veterans recommend.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowDoDPanel(!showDoDPanel)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #2563eb', background: showDoDPanel ? '#2563eb' : '#eff6ff', color: showDoDPanel ? '#fff' : '#2563eb', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                {showDoDPanel ? '✕ Close' : '🔍 Search DoD'}
              </button>
              <button onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: '12px' }}>
                Open in New Tab →
              </button>
            </div>
          </div>

          {/* DoD Panel */}
          {showDoDPanel && (
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input placeholder="Search by employer, location, or industry..." onKeyDown={e => e.key === 'Enter' && window.open('https://skillbridge.osd.mil/programs.htm', '_blank')}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#111', fontSize: '13px' }} />
                <button onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Search →</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[{ label: '💻 Tech' }, { label: '🏥 Healthcare' }, { label: '💰 Finance' }, { label: '🏭 Manufacturing' }, { label: '🏛️ Government' }, { label: '🚛 Logistics' }].map(cat => (
                  <button key={cat.label} onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')}
                    style={{ padding: '4px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', color: '#6b7280', cursor: 'pointer', fontSize: '12px' }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0 }}>SkillBridge Map</h1>
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>
  {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} · <span 
    onClick={() => window.open('https://skillbridge.osd.mil/programs.htm', '_blank')}
    style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
    8,000+ more on DoD site →
  </span>
</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {user && (
                <button onClick={() => { setShowSubmitForm(true); setSubmitMessage(null) }} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                  + Submit Location
                </button>
              )}
              {user?.email === 'lizkaypatterson@gmail.com' && (
                <button onClick={() => router.push('/admin/skillbridge')} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                  🛡️ Admin
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employer, city, or state..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />

          {/* Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={selectStyle}>
              {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
            </select>
            <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={selectStyle}>
              {industries.map(i => <option key={i} value={i}>{i === 'All' ? 'All Industries' : i}</option>)}
            </select>
            <select value={filterDuration} onChange={e => setFilterDuration(e.target.value)} style={selectStyle}>
              {durations.map(d => <option key={d} value={d}>{d === 'All' ? 'All Durations' : d}</option>)}
            </select>
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid',
              borderColor: showFavoritesOnly ? '#fcd34d' : '#e5e7eb',
              backgroundColor: showFavoritesOnly ? '#fffbeb' : '#fff',
              color: showFavoritesOnly ? '#d97706' : '#6b7280', fontSize: '12px', cursor: 'pointer'
            }}>★ Favorites</button>
            <button onClick={() => setShowCommunityOnly(!showCommunityOnly)} style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid',
              borderColor: showCommunityOnly ? '#86efac' : '#e5e7eb',
              backgroundColor: showCommunityOnly ? '#f0fdf4' : '#fff',
              color: showCommunityOnly ? '#15803d' : '#6b7280', fontSize: '12px', cursor: 'pointer'
            }}>👥 Community</button>
          </div>
        </div>

        {/* Map + List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, overflow: 'hidden' }}>
          {/* Map */}
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {!mapLoaded && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', zIndex: 1, backgroundColor: '#f9fafb' }}>
                Loading map...
              </div>
            )}
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Location list */}
          <div style={{ overflowY: 'auto', borderLeft: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            {loading ? (
              <div style={{ padding: '2rem', color: '#9ca3af', textAlign: 'center' }}>Loading locations...</div>
            ) : filteredLocations.length === 0 ? (
              <div style={{ padding: '2rem', color: '#9ca3af', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px' }}>No locations found.</p>
                <p style={{ fontSize: '13px' }}>Try adjusting your filters.</p>
              </div>
            ) : (
              filteredLocations.map(loc => (
                <div key={loc.id} onClick={() => focusLocation(loc)} style={{
                  padding: '14px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                  backgroundColor: selectedLocation?.id === loc.id ? '#f9fafb' : '#fff',
                  borderLeft: loc.status === 'pending' ? '3px solid #f59e0b' : '3px solid transparent',
                  transition: 'background-color 0.1s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '13px', color: '#111' }}>{loc.employer_name}</p>
                      <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: '12px' }}>{loc.city}, {loc.state}</p>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {loc.industry && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>{loc.industry}</span>}
                        {loc.duration_weeks && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>~{loc.duration_weeks}wks</span>}
                        {loc.status === 'pending' && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#d97706' }}>⏳ Pending</span>}
                        {loc.is_community_submitted && loc.status === 'approved' && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' }}>Community</span>}
                      </div>
                    </div>
                    {loc.status !== 'pending' && (
                      <button onClick={e => { e.stopPropagation(); toggleFavorite(loc.id) }}
                        style={{ backgroundColor: 'transparent', border: 'none', color: favorites[loc.id] ? '#d97706' : '#d1d5db', fontSize: '1.1rem', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                        {favorites[loc.id] ? '★' : '☆'}
                      </button>
                    )}
                  </div>
                  {loc.url && (
                    <div onClick={e => { e.stopPropagation(); window.open(loc.url, '_blank') }}
                      style={{ color: '#2563eb', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}>
                      View opportunity →
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const selectStyle = {
  padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb',
  backgroundColor: '#fff', color: '#6b7280', fontSize: '12px', cursor: 'pointer'
}