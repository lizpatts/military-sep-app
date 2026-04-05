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

    let res
    if (action === 'delete') {
      res = await fetch('/api/skillbridge/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const json = await res.json()
      if (json.success) {
        setSubmissions(prev => prev.filter(s => s.id !== id))
        setMessage({ type: 'success', text: 'Location deleted.' })
      } else {
        setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
      }
    } else {
      res = await fetch('/api/skillbridge/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action })
      })
      const json = await res.json()
      if (json.success) {
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s))
        setMessage({ type: 'success', text: `Location marked as ${action}.` })
      } else {
        setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
      }
    }
    setActionLoading(null)
  }

async function handleEdit(id) {
    setActionLoading(id + 'edit')
    setMessage(null)

    // Auto-geocode if city/state changed or coordinates are missing
    let formToSave = { ...editForm }
    const original = submissions.find(s => s.id === id)
    const cityChanged = editForm.city !== original.city || editForm.state !== original.state
    const missingCoords = !editForm.latitude || !editForm.longitude

    if (cityChanged || missingCoords) {
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(editForm.city + ', ' + editForm.state)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const geoData = await geoRes.json()
        if (geoData.results?.[0]?.geometry?.location) {
          formToSave.latitude = geoData.results[0].geometry.location.lat
          formToSave.longitude = geoData.results[0].geometry.location.lng
          setEditForm(prev => ({ ...prev, latitude: formToSave.latitude, longitude: formToSave.longitude }))
        }
      } catch (e) {
        console.error('Geocoding failed:', e)
      }
    }

    const res = await fetch('/api/skillbridge/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...formToSave })
    })
    const json = await res.json()
    if (json.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s))
      setEditingId(null)
      setMessage({ type: 'success', text: 'Location updated!' })
    } else {
      setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    }
    setActionLoading(null)
  }

  const filtered = submissions.filter(s => s.status === activeTab)
  const counts = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  const tabColor = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' }

  if (loading) return (
    <div style={{ background: '#0a1628', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8899aa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ background: '#0a1628', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.push('/skillbridge')}
            style={{ background: '#1e3a5f', color: '#8899aa', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>
            ← Back
          </button>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>🗺️ SkillBridge Admin Panel</h1>
            <p style={{ color: '#8899aa', margin: 0, fontSize: '0.85rem' }}>Manage all community submissions</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: message.type === 'success' ? '#14532d' : '#450a0a',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem'
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['pending', 'approved', 'rejected'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: '8px', border: '1px solid',
              borderColor: activeTab === tab ? tabColor[tab] : '#1e3a5f',
              background: activeTab === tab ? tabColor[tab] + '22' : 'transparent',
              color: activeTab === tab ? tabColor[tab] : '#8899aa',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize'
            }}>
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ background: '#0f2035', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#8899aa', fontSize: '1.1rem' }}>No {activeTab} submissions.</p>
          </div>
        )}

        {/* Submissions list */}
        {filtered.map(s => (
          <div key={s.id} style={{
            background: '#0f2035', border: `1px solid ${tabColor[s.status] || '#1e3a5f'}`,
            borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem'
          }}>
            {editingId === s.id ? (
              /* Edit form */
              <div>
                <h3 style={{ color: 'white', marginBottom: '1rem' }}>✏️ Editing: {s.employer_name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
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
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: 'block', color: '#8899aa', fontSize: '0.75rem', marginBottom: '4px' }}>{field.label}</label>
                      <input
                        value={editForm[field.key] ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e3a5f', background: '#0a1628', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', color: '#8899aa', fontSize: '0.75rem', marginBottom: '4px' }}>Industry</label>
                    <select value={editForm.industry ?? ''} onChange={e => setEditForm(prev => ({ ...prev, industry: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e3a5f', background: '#0a1628', color: 'white', fontSize: '0.85rem' }}>
                      {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#8899aa', fontSize: '0.75rem', marginBottom: '4px' }}>Branches Eligible</label>
                    <input value={editForm.branches_eligible ?? ''} onChange={e => setEditForm(prev => ({ ...prev, branches_eligible: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e3a5f', background: '#0a1628', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => handleEdit(s.id)} disabled={actionLoading === s.id + 'edit'}
                    style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, opacity: actionLoading === s.id + 'edit' ? 0.6 : 1 }}>
                    {actionLoading === s.id + 'edit' ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ background: 'transparent', color: '#8899aa', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ background: tabColor[s.status] + '22', color: tabColor[s.status], padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {s.status === 'pending' ? '⏳' : s.status === 'approved' ? '✅' : '❌'} {s.status.toUpperCase()}
                    </span>
                    <span style={{ color: '#445566', fontSize: '0.75rem' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                   {s.is_community_submitted && <span style={{ color: '#445566', fontSize: '0.75rem' }}>· Community</span>}
                   {s.submitted_by_branch && <span style={{ background: '#2563eb22', color: '#2563eb', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem' }}>⚔️ {s.submitted_by_branch}</span>}
                  </div>
                  <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.1rem' }}>{s.employer_name}</h2>
                  <p style={{ color: '#8899aa', margin: '0 0 4px 0', fontSize: '0.9rem' }}>
                    {s.city}, {s.state} · {s.industry} · {s.duration_weeks} weeks
                  </p>
                  {s.description && <p style={{ color: '#8899aa', margin: '4px 0', fontSize: '0.85rem', fontStyle: 'italic' }}>"{s.description}"</p>}
                  {s.notes && <p style={{ color: '#f59e0b', margin: '4px 0', fontSize: '0.85rem' }}>📝 {s.notes}</p>}
                  {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>{s.url}</a>}
                  <p style={{ color: '#445566', fontSize: '0.8rem', margin: '8px 0 0 0' }}>📍 {s.latitude}, {s.longitude}</p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                  <button onClick={() => { setEditingId(s.id); setEditForm({ ...s }) }}
                    style={{ background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                    ✏️ Edit
                  </button>
                  {s.status !== 'approved' && (
                    <button onClick={() => handleAction(s.id, 'approved')} disabled={actionLoading === s.id + 'approved'}
                      style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, opacity: actionLoading === s.id + 'approved' ? 0.6 : 1 }}>
                      {actionLoading === s.id + 'approved' ? '...' : '✅ Approve'}
                    </button>
                  )}
                  {s.status !== 'rejected' && (
                    <button onClick={() => handleAction(s.id, 'rejected')} disabled={actionLoading === s.id + 'rejected'}
                      style={{ background: '#f59e0b', color: 'black', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, opacity: actionLoading === s.id + 'rejected' ? 0.6 : 1 }}>
                      {actionLoading === s.id + 'rejected' ? '...' : '⚠️ Reject'}
                    </button>
                  )}
                  {s.status !== 'pending' && (
                    <button onClick={() => handleAction(s.id, 'pending')} disabled={actionLoading === s.id + 'pending'}
                      style={{ background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, opacity: actionLoading === s.id + 'pending' ? 0.6 : 1 }}>
                      {actionLoading === s.id + 'pending' ? '...' : '⏳ Set Pending'}
                    </button>
                  )}
                  <button onClick={() => handleAction(s.id, 'delete')} disabled={actionLoading === s.id + 'delete'}
                    style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, opacity: actionLoading === s.id + 'delete' ? 0.6 : 1 }}>
                    {actionLoading === s.id + 'delete' ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}