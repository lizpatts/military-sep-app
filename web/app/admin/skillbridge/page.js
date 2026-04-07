'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const ADMIN_EMAIL = 'lizkaypatterson@gmail.com'
const industryOptions = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Government', 'Logistics', 'Education', 'Other']

export default function AdminSkillbridgePage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { checkAdminAndLoad() }, [])

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return }
    await loadAll()
    setLoading(false)
  }

  async function loadAll() {
    const res = await fetch('/api/skillbridge/admin?all=true')
    const json = await res.json()
    if (json.data) setSubmissions(json.data)
  }

  async function handleAction(id, action) {
    setActionLoading(id + action)
    setMessage(null)
    if (action === 'delete') {
      const res = await fetch('/api/skillbridge/admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const json = await res.json()
      if (json.success) { setSubmissions(prev => prev.filter(s => s.id !== id)); setMessage({ type: 'success', text: 'Location deleted.' }) }
      else setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    } else {
      const res = await fetch('/api/skillbridge/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: action }) })
      const json = await res.json()
      if (json.success) { setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s)); setMessage({ type: 'success', text: `Location marked as ${action}.` }) }
      else setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    }
    setActionLoading(null)
  }

  async function handleEdit(id) {
    setActionLoading(id + 'edit')
    setMessage(null)
    let formToSave = { ...editForm }
    const original = submissions.find(s => s.id === id)
    const cityChanged = editForm.city !== original.city || editForm.state !== original.state
    const missingCoords = !editForm.latitude || !editForm.longitude
    if (cityChanged || missingCoords) {
      try {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(editForm.city + ', ' + editForm.state)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
        const geoData = await geoRes.json()
        if (geoData.results?.[0]?.geometry?.location) {
          formToSave.latitude = geoData.results[0].geometry.location.lat
          formToSave.longitude = geoData.results[0].geometry.location.lng
          setEditForm(prev => ({ ...prev, latitude: formToSave.latitude, longitude: formToSave.longitude }))
        }
      } catch (e) { console.error('Geocoding failed:', e) }
    }
    const res = await fetch('/api/skillbridge/admin', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...formToSave }) })
    const json = await res.json()
    if (json.success) { setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s)); setEditingId(null); setMessage({ type: 'success', text: 'Location updated!' }) }
    else setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    setActionLoading(null)
  }

  const filtered = submissions.filter(s => s.status === activeTab)
  const counts = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  const tabConfig = {
    pending: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    approved: { color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
    rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  }

  if (loading) return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Topbar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/skillbridge')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
            ← SkillBridge
          </button>
          <span style={{ color: '#e5e7eb' }}>|</span>
          <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0 }}>🗺️ SkillBridge Admin Panel</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.entries(counts).map(([tab, count]) => (
            <span key={tab} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: tabConfig[tab].bg, border: `1px solid ${tabConfig[tab].border}`, color: tabConfig[tab].color, fontWeight: '600' }}>
              {tab}: {count}
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 32px' }}>

        {/* Message */}
        {message && (
          <div style={{ backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`, color: message.type === 'success' ? '#15803d' : '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['pending', 'approved', 'rejected'].map(tab => {
            const tc = tabConfig[tab]
            const isActive = activeTab === tab
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid',
                borderColor: isActive ? tc.border : '#e5e7eb',
                backgroundColor: isActive ? tc.bg : '#fff',
                color: isActive ? tc.color : '#6b7280',
                cursor: 'pointer', fontWeight: isActive ? '600' : '400',
                fontSize: '14px', textTransform: 'capitalize'
              }}>
                {tab} ({counts[tab]})
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>No {activeTab} submissions.</p>
          </div>
        )}

        {/* Submissions */}
        {filtered.map(s => {
          const tc = tabConfig[s.status]
          return (
            <div key={s.id} style={{ backgroundColor: '#fff', border: `1px solid ${tc.border}`, borderLeft: `4px solid ${tc.color}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>

              {editingId === s.id ? (
                <div>
                  <h3 style={{ color: '#111', marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>✏️ Editing: {s.employer_name}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { label: 'Employer Name', key: 'employer_name' },
                      { label: 'City', key: 'city' },
                      { label: 'State', key: 'state' },
                      { label: 'Latitude', key: 'latitude' },
                      { label: 'Longitude', key: 'longitude' },
                      { label: 'Duration (weeks)', key: 'duration_weeks' },
                      { label: 'URL', key: 'url' },
                      { label: 'Description', key: 'description' },
                      { label: 'Notes', key: 'notes' },
                      { label: 'Branches Eligible', key: 'branches_eligible' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>{field.label}</label>
                        <input value={editForm[field.key] ?? ''} onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>Industry</label>
                      <select value={editForm.industry ?? ''} onChange={e => setEditForm(prev => ({ ...prev, industry: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '13px' }}>
                        {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleEdit(s.id)} disabled={actionLoading === s.id + 'edit'}
                      style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', opacity: actionLoading === s.id + 'edit' ? 0.6 : 1 }}>
                      {actionLoading === s.id + 'edit' ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: tc.bg, color: tc.color, padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', border: `1px solid ${tc.border}` }}>
                        {s.status === 'pending' ? '⏳' : s.status === 'approved' ? '✅' : '❌'} {s.status.toUpperCase()}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                      {s.is_community_submitted && <span style={{ color: '#6b7280', fontSize: '12px' }}>· Community</span>}
                      {s.submitted_by_branch && (
                        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', border: '1px solid #bfdbfe', fontWeight: '600' }}>
                          ⚔️ {s.submitted_by_branch}
                        </span>
                      )}
                    </div>
                    <h2 style={{ color: '#111', margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>{s.employer_name}</h2>
                    <p style={{ color: '#6b7280', margin: '0 0 4px', fontSize: '14px' }}>{s.city}, {s.state} · {s.industry} · {s.duration_weeks} weeks</p>
                    {s.description && <p style={{ color: '#6b7280', margin: '4px 0', fontSize: '13px', fontStyle: 'italic' }}>"{s.description}"</p>}
                    {s.notes && <p style={{ color: '#d97706', margin: '4px 0', fontSize: '13px' }}>📝 {s.notes}</p>}
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '13px', display: 'block', marginTop: '4px' }}>{s.url}</a>}
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' }}>📍 {s.latitude}, {s.longitude}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px' }}>
                    <button onClick={() => { setEditingId(s.id); setEditForm({ ...s }) }}
                      style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                      ✏️ Edit
                    </button>
                    {s.status !== 'approved' && (
                      <button onClick={() => handleAction(s.id, 'approved')} disabled={actionLoading === s.id + 'approved'}
                        style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: actionLoading === s.id + 'approved' ? 0.6 : 1 }}>
                        {actionLoading === s.id + 'approved' ? '...' : '✅ Approve'}
                      </button>
                    )}
                    {s.status !== 'rejected' && (
                      <button onClick={() => handleAction(s.id, 'rejected')} disabled={actionLoading === s.id + 'rejected'}
                        style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: actionLoading === s.id + 'rejected' ? 0.6 : 1 }}>
                        {actionLoading === s.id + 'rejected' ? '...' : '⚠️ Reject'}
                      </button>
                    )}
                    {s.status !== 'pending' && (
                      <button onClick={() => handleAction(s.id, 'pending')} disabled={actionLoading === s.id + 'pending'}
                        style={{ backgroundColor: '#fff', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: actionLoading === s.id + 'pending' ? 0.6 : 1 }}>
                        {actionLoading === s.id + 'pending' ? '...' : '⏳ Set Pending'}
                      </button>
                    )}
                    <button onClick={() => handleAction(s.id, 'delete')} disabled={actionLoading === s.id + 'delete'}
                      style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: actionLoading === s.id + 'delete' ? 0.6 : 1 }}>
                      {actionLoading === s.id + 'delete' ? '...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}