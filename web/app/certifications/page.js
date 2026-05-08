'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'
import PageContent from '../components/PageContent'

const APP_URL = 'https://military-sep-app.vercel.app'

export default function CertificationsPage() {
  const router = useRouter()
  const [certs, setCerts] = useState([])
  const [favorites, setFavorites] = useState({})
  const [filter, setFilter] = useState('All')
  const [costFilter, setCostFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [highlightId, setHighlightId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const highlightRef = useRef(null)

  const categories = ['All', 'IT', 'Leadership', 'Trade', 'Healthcare', 'Finance', 'Education']
const costFilters = ['All', 'Free', 'Reduced Cost', 'Out of Pocket']

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search)
      const guestMode = params.get('guest') === 'true'
      setIsGuest(guestMode)
      const hid = params.get('highlight')
      if (hid) setHighlightId(hid)

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: favData } = await supabase
          .from('cert_favorites').select('cert_id').eq('user_id', session.user.id)
        const favMap = {}
        favData?.forEach(f => { favMap[f.cert_id] = true })
        setFavorites(favMap)
      }
      const { data: certData } = await supabase
        .from('certifications').select('*').order('name')
      setCerts(certData || [])
      setLoading(false)
    }
    loadData()
  }, [])

  // Scroll to highlighted cert after load
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 500)
    }
  }, [highlightId, loading])

  const toggleFavorite = async (certId) => {
    if (isGuest) { alert('Sign in to save favorites!'); return }
    if (!user) { alert('Please sign in to save favorites'); return }
    const isFav = favorites[certId]
    setFavorites(prev => ({ ...prev, [certId]: !isFav }))
    if (isFav) {
      await supabase.from('cert_favorites').delete().eq('user_id', user.id).eq('cert_id', certId)
    } else {
      await supabase.from('cert_favorites').insert({ user_id: user.id, cert_id: certId })
    }
  }

  const handleShare = (cert) => {
    const url = `${APP_URL}/certifications?guest=true&highlight=${cert.id}`
    const text = `Check out this certification on MilSep: ${cert.name} by ${cert.provider}`
    if (navigator.share) {
      navigator.share({ title: `MilSep — ${cert.name}`, text, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopiedId(cert.id)
      setTimeout(() => setCopiedId(null), 2000)
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

  // Put highlighted cert first if it exists
  const highlightedCert = highlightId ? certs.find(c => c.id === highlightId) : null
  const favoritedCerts = filteredCerts.filter(c => favorites[c.id] && c.id !== highlightId)
  const otherCerts = filteredCerts.filter(c => !favorites[c.id] && c.id !== highlightId)
  const displayCerts = [
    ...(highlightedCert ? [highlightedCert] : []),
    ...favoritedCerts,
    ...otherCerts
  ]

  const costColor = (type) => {
    if (type === 'Free') return { bg: '#f0fdf4', border: '#86efac', text: '#15803d' }
    if (type === 'Reduced Cost') return { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' }
    return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      Loading certifications...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar isGuest={isGuest}
        guestBranch={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('branch') || '' : ''}
        guestSepType={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('separation_type') || '' : ''}
      />

      <PageContent>
        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>Certifications</h1>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Browse and favorite certifications relevant to your transition</p>
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            {displayCerts.length} found{favoritedCerts.length > 0 && ` · ${favoritedCerts.length} favorited`}
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Shared cert banner */}
          {highlightId && highlightedCert && (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🎖️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#1d4ed8', fontSize: '13px' }}>Shared via MilSep</p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Someone shared <strong>{highlightedCert.name}</strong> with you. Sign up free to save favorites and track your transition.</p>
                </div>
              </div>
              <button onClick={() => router.push('/login')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Sign Up Free →
              </button>
            </div>
          )}

          {/* Guest banner */}
          {isGuest && !highlightId && (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👋</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#1d4ed8', fontSize: '13px' }}>Browsing as guest — read only</p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Sign in to save favorites.</p>
                </div>
              </div>
              <button onClick={() => router.push('/login')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Sign In →
              </button>
            </div>
          )}

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search certifications, providers..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#111', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px', outline: 'none' }}
          />

          {/* Category filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filter === cat ? '#2563eb' : '#e5e7eb',
                backgroundColor: filter === cat ? '#2563eb' : '#fff',
                color: filter === cat ? '#fff' : '#6b7280',
                fontSize: '13px', cursor: 'pointer', fontWeight: filter === cat ? '600' : '400'
              }}>{cat}</button>
            ))}
          </div>

          {/* Cost filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {costFilters.map(cf => (
              <button key={cf} onClick={() => setCostFilter(cf)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: costFilter === cf ? '#f59e0b' : '#e5e7eb',
                backgroundColor: costFilter === cf ? '#fffbeb' : '#fff',
                color: costFilter === cf ? '#92400e' : '#6b7280',
                fontSize: '13px', cursor: 'pointer', fontWeight: costFilter === cf ? '600' : '400'
              }}>{cf}</button>
            ))}
          </div>

          {/* Certs list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayCerts.length === 0 ? (
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>No certifications found. Try adjusting your filters.</p>
              </div>
            ) : (
              displayCerts.map(cert => {
                const isFav = favorites[cert.id]
                const cc = costColor(cert.cost_type)
                const isHighlighted = cert.id === highlightId
                return (
                  <div
                    key={cert.id}
                    ref={isHighlighted ? highlightRef : null}
                    style={{
                      backgroundColor: '#fff',
                      border: `1px solid ${isHighlighted ? '#2563eb' : isFav ? '#fcd34d' : '#e5e7eb'}`,
                      borderLeft: `4px solid ${isHighlighted ? '#2563eb' : isFav ? '#f59e0b' : '#e5e7eb'}`,
                      borderRadius: '10px', padding: '18px',
                      transition: 'border-color 0.15s',
                      boxShadow: isHighlighted ? '0 0 0 3px #dbeafe' : 'none'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111' }}>{cert.name}</h3>
                          {isFav && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>★ Favorited</span>}
                          {isHighlighted && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600', backgroundColor: '#eff6ff', padding: '1px 8px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>Shared with you</span>}
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 10px' }}>{cert.provider}</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: cc.bg, border: `1px solid ${cc.border}`, color: cc.text, fontWeight: '600' }}>
                            {cert.cost_type || 'Free'}
                          </span>
                          {cert.category && (
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                              {cert.category}
                            </span>
                          )}
                          {cert.source_type && (
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', color: '#7c3aed' }}>
                              {cert.source_type}
                            </span>
                          )}
                          {cert.duration_weeks && (
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
                              ~{cert.duration_weeks} weeks
                            </span>
                          )}
                        </div>
                        {cert.description && (
                          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 8px', lineHeight: '1.5' }}>{cert.description}</p>
                        )}
                        {cert.civilian_value && (
                          <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px' }}>💼 {cert.civilian_value}</p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                          {cert.link && (
                            <a href={cert.link} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2563eb', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
                              Learn more →
                            </a>
                          )}
                          <button onClick={() => handleShare(cert)} style={{
                            backgroundColor: copiedId === cert.id ? '#f0fdf4' : '#f9fafb',
                            border: `1px solid ${copiedId === cert.id ? '#86efac' : '#e5e7eb'}`,
                            color: copiedId === cert.id ? '#15803d' : '#6b7280',
                            borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer'
                          }}>
                            {copiedId === cert.id ? '✓ Link copied!' : '↗ Share'}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => toggleFavorite(cert.id)} style={{
                        backgroundColor: isFav ? '#fffbeb' : '#f9fafb',
                        border: `1px solid ${isFav ? '#fcd34d' : '#e5e7eb'}`,
                        color: isFav ? '#d97706' : '#9ca3af',
                        borderRadius: '8px', padding: '8px 12px',
                        cursor: 'pointer', fontSize: '16px', flexShrink: 0,
                        transition: 'all 0.15s'
                      }}>
                        {isFav ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </PageContent>
    </div>
  )
}