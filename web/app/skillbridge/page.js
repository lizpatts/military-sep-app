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

  const [filterBranch, setFilterBranch] = useState('All')
  const [filterIndustry, setFilterIndustry] = useState('All')
  const [filterDuration, setFilterDuration] = useState('All')
  const [search, setSearch] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const branches = ['All', 'Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard']
  const industries = ['All', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Government', 'Logistics', 'Education', 'Other']
  const durations = ['All', '0-90 days', '91-180 days']

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
    if (filterBranch !== 'All') {
      const branches = loc.branches_eligible
      if (!branches) return false
      if (branches !== 'all' && !branches.includes(filterBranch)) return false
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

  const openInfoWindow = (loc, marker, favs) => {
    const isFav = favs[loc.id]
    infoWindowRef.current.setContent(`
      <div style="background:#0f2035;color:white;padding:12px;border-radius:8px;min-width:220px;font-family:sans-serif">
        <strong style="font-size:14px">${loc.employer_name}</strong>
        <p style="color:#8899aa;margin:4px 0;font-size:12px">${loc.city}, ${loc.state}</p>
        ${loc.industry ? `<p style="color:#8899aa;margin:4px 0;font-size:12px">${loc.industry}</p>` : ''}
        ${loc.duration_weeks ? `<p style="color:#8899aa;margin:4px 0;font-size:12px">~${loc.duration_weeks} weeks</p>` : ''}
        ${loc.url ? `<a href="${loc.url}" target="_blank" style="color:#2563eb;font-size:12px;display:block;margin-top:6px">View opportunity →</a>` : ''}
        <button 
          onclick="window.toggleFavFromMap('${loc.id}')"
          style="margin-top:8px;width:100%;padding:6px;border-radius:6px;border:1px solid ${isFav ? '#f59e0b' : '#1e3a5f'};background:${isFav ? '#f59e0b22' : 'transparent'};color:${isFav ? '#f59e0b' : '#8899aa'};cursor:pointer;font-size:12px"
        >
          ${isFav ? '★ Favorited' : '☆ Save to Favorites'}
        </button>
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
      if (loc && marker) {
        openInfoWindow(loc, marker, newFavs)
      }
    }
  }, [favorites, locations, user])

  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return

    Object.values(markersRef.current).forEach(m => m.setMap(null))
    markersRef.current = {}

    filteredLocations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return

      const isFav = favorites[loc.id]
      const marker = new window.google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapInstance.current,
        title: loc.employer_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: isFav ? '#f59e0b' : '#2563eb',
          fillOpacity: 1,
          strokeColor: isFav ? '#f59e0b' : '#2563eb',
          strokeWeight: 2
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

    // Update marker color
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a1628', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => router.push('/dashboard')} style={backButtonStyle}>← Dashboard</button>
          <h1 style={{ fontSize: '1.5rem' }}>SkillBridge Map</h1>
          <span style={{ color: '#445566', fontSize: '0.85rem', marginLeft: 'auto' }}>
            {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
          </span>
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
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: showFavoritesOnly ? '#f59e0b' : '#1e3a5f',
              backgroundColor: showFavoritesOnly ? '#f59e0b22' : 'transparent',
              color: showFavoritesOnly ? '#f59e0b' : '#8899aa',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            ★ Favorites only
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
                  backgroundColor: selectedLocation?.id === loc.id ? '#0f2035' : 'transparent'
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
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(loc.id) }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: favorites[loc.id] ? '#f59e0b' : '#445566',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {favorites[loc.id] ? '★' : '☆'}
                  </button>
                </div>
                {loc.url && (
                  <div
                    onClick={e => { e.stopPropagation(); window.open(loc.url, '_blank') }}
                    style={{ color: '#2563eb', fontSize: '0.8rem', marginTop: '6px', cursor: 'pointer' }}
                  >
                    View opportunity →
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const tagStyle = (color) => ({
  fontSize: '0.7rem',
  padding: '2px 8px',
  borderRadius: '10px',
  backgroundColor: color + '22',
  border: `1px solid ${color}`,
  color: color
})

const backButtonStyle = {
  backgroundColor: 'transparent',
  color: '#8899aa',
  border: '1px solid #1e3a5f',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  cursor: 'pointer'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #1e3a5f',
  backgroundColor: '#0f2035',
  color: 'white',
  fontSize: '0.95rem',
  boxSizing: 'border-box'
}

const selectStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #1e3a5f',
  backgroundColor: '#0f2035',
  color: 'white',
  fontSize: '0.85rem',
  cursor: 'pointer'
}