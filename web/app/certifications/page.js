'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function CertificationsPage() {
  const router = useRouter()
  const [certs, setCerts] = useState([])
  const [favorites, setFavorites] = useState({})
  const [filter, setFilter] = useState('All')
  const [costFilter, setCostFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const categories = ['All', 'IT', 'Leadership', 'Trade', 'Healthcare', 'Finance', 'Education']
  const costFilters = ['All', 'Free', 'Reduced Cost', 'Paid']

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: favData } = await supabase
          .from('cert_favorites')
          .select('cert_id')
          .eq('user_id', session.user.id)
        const favMap = {}
        favData?.forEach(f => { favMap[f.cert_id] = true })
        setFavorites(favMap)
      }
      const { data: certData } = await supabase
        .from('certifications')
        .select('*')
        .order('name')
      setCerts(certData || [])
      setLoading(false)
    }
    loadData()
  }, [])

const toggleFavorite = async (certId) => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('guest') === 'true') {
      alert('Sign in to save favorites!')
      return
    }
    if (!user) {
      alert('Please sign in to save favorites')
      return
    }
    const isFav = favorites[certId]
    setFavorites(prev => ({ ...prev, [certId]: !isFav }))
    if (isFav) {
      await supabase
        .from('cert_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('cert_id', certId)
    } else {
      await supabase
        .from('cert_favorites')
        .insert({ user_id: user.id, cert_id: certId })
    }
  }

  const filteredCerts = certs.filter(cert => {
    const matchesCategory = filter === 'All' || cert.category === filter
    const matchesCost = costFilter === 'All' || cert.cost_type === costFilter
    const matchesSearch = search === '' ||
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.provider.toLowerCase().includes(search.toLowerCase()) ||
      cert.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesCost && matchesSearch
  })

  const favoritedCerts = filteredCerts.filter(c => favorites[c.id])
  const otherCerts = filteredCerts.filter(c => !favorites[c.id])
  const displayCerts = [...favoritedCerts, ...otherCerts]

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      backgroundColor: '#0a1628', color: 'white',
      fontFamily: 'sans-serif'
    }}>
      Loading certifications...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a1628',
      color: 'white',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
        {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('guest') === 'true' && (
  <div style={{
    backgroundColor: '#2563eb11', border: '1px solid #2563eb',
    borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span>👋</span>
      <div>
        <p style={{ margin: 0, fontWeight: '500', color: '#2563eb' }}>Browsing as guest — read only</p>
        <p style={{ margin: 0, color: '#8899aa', fontSize: '0.8rem' }}>Sign in to save favorites.</p>
      </div>
    </div>
    <button onClick={() => router.push('/login')}
      style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
      Sign In →
    </button>
  </div>
)}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
<button onClick={() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') {
    router.push(`/dashboard?${params.toString()}`)
  } else {
    router.push('/dashboard')
  }
}} style={backButtonStyle}>
  ← Dashboard
</button>
        <h1 style={{ fontSize: '1.5rem' }}>Certifications</h1>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search certifications..."
        style={{ ...inputStyle, marginBottom: '1rem' }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: filter === cat ? '#2563eb' : '#1e3a5f',
              backgroundColor: filter === cat ? '#2563eb' : 'transparent',
              color: 'white',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {costFilters.map(cf => (
          <button
            key={cf}
            onClick={() => setCostFilter(cf)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: costFilter === cf ? '#f59e0b' : '#1e3a5f',
              backgroundColor: costFilter === cf ? '#f59e0b' : 'transparent',
              color: costFilter === cf ? '#000' : 'white',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {cf}
          </button>
        ))}
      </div>

      <p style={{ color: '#445566', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {displayCerts.length} certification{displayCerts.length !== 1 ? 's' : ''} found
        {favoritedCerts.length > 0 && ` · ${favoritedCerts.length} favorited`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayCerts.length === 0 ? (
          <div style={{ color: '#445566', textAlign: 'center', padding: '3rem' }}>
            No certifications found. Try adjusting your filters.
          </div>
        ) : (
          displayCerts.map(cert => (
            <div key={cert.id} style={{
              backgroundColor: '#0f2035',
              border: '1px solid',
              borderColor: favorites[cert.id] ? '#f59e0b' : '#1e3a5f',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{cert.name}</h3>
                    {favorites[cert.id] && (
                      <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>★ Favorited</span>
                    )}
                  </div>
                  <p style={{ color: '#8899aa', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                    {cert.provider}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span style={tagStyle(cert.cost_type === 'Free' ? '#22c55e' : cert.cost_type === 'Reduced Cost' ? '#f59e0b' : '#ef4444')}>
                      {cert.cost_type || 'Free'}
                    </span>
                    {cert.category && (
                      <span style={tagStyle('#2563eb')}>{cert.category}</span>
                    )}
                    {cert.source_type && (
                      <span style={tagStyle('#7c3aed')}>{cert.source_type}</span>
                    )}
                    {cert.duration_weeks && (
                      <span style={tagStyle('#0891b2')}>~{cert.duration_weeks} weeks</span>
                    )}
                  </div>
                  {cert.description && (
                    <p style={{ color: '#8899aa', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                      {cert.description}
                    </p>
                  )}
                  {cert.civilian_value && (
                    <p style={{ color: '#445566', fontSize: '0.8rem', margin: 0 }}>
                      💼 {cert.civilian_value}
                    </p>
                  )}
                  {cert.link && (
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '0.75rem',
                        color: '#2563eb',
                        fontSize: '0.85rem',
                        textDecoration: 'none'
                      }}
                    >
                      Learn more →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => toggleFavorite(cert.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid',
                    borderColor: favorites[cert.id] ? '#f59e0b' : '#1e3a5f',
                    color: favorites[cert.id] ? '#f59e0b' : '#445566',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginLeft: '1rem',
                    flexShrink: 0
                  }}
                >
                  {favorites[cert.id] ? '★' : '☆'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const tagStyle = (color) => ({
  fontSize: '0.7rem',
  padding: '3px 10px',
  borderRadius: '12px',
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
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #1e3a5f',
  backgroundColor: '#0f2035',
  color: 'white',
  fontSize: '1rem',
  boxSizing: 'border-box'
}