'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const ADMIN_EMAIL = 'lizkaypatterson@gmail.com'

export default function AdminSkillbridgePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }

    setUser(user)
    await loadSubmissions()
    setLoading(false)
  }

  async function loadSubmissions() {
    const res = await fetch('/api/skillbridge/admin')
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
    } else {
      res = await fetch('/api/skillbridge/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action })
      })
    }

    const json = await res.json()
    if (json.success) {
      setSubmissions(prev => prev.filter(s => s.id !== id))
      setMessage({ type: 'success', text: `Location ${action}d successfully!` })
    } else {
      setMessage({ type: 'error', text: json.error || 'Something went wrong.' })
    }
    setActionLoading(null)
  }

  if (loading) return (
    <div style={{ background: '#0a1628', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8899aa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ background: '#0a1628', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push('/skillbridge')}
            style={{ background: '#1e3a5f', color: '#8899aa', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>🗺️ SkillBridge Admin Panel</h1>
            <p style={{ color: '#8899aa', margin: 0, fontSize: '0.85rem' }}>Review community submissions</p>
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

        {/* Empty state */}
        {submissions.length === 0 && (
          <div style={{ background: '#0f2035', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#8899aa', fontSize: '1.1rem' }}>✅ No pending submissions!</p>
            <p style={{ color: '#445566' }}>All community submissions have been reviewed.</p>
          </div>
        )}

        {/* Submissions list */}
        {submissions.map(s => (
          <div key={s.id} style={{
            background: '#0f2035', border: '1px solid #f59e0b',
            borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#f59e0b22', color: '#f59e0b', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    ⏳ PENDING
                  </span>
                  <span style={{ color: '#445566', fontSize: '0.75rem' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.1rem' }}>{s.employer_name}</h2>
                <p style={{ color: '#8899aa', margin: '0 0 4px 0', fontSize: '0.9rem' }}>
                  {s.city}, {s.state} · {s.industry} · {s.duration_weeks} weeks
                </p>
                {s.description && (
                  <p style={{ color: '#8899aa', margin: '4px 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    "{s.description}"
                  </p>
                )}
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2563eb', fontSize: '0.85rem' }}>
                    {s.url}
                  </a>
                )}
                <p style={{ color: '#445566', fontSize: '0.8rem', margin: '8px 0 0 0' }}>
                  📍 {s.latitude}, {s.longitude}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                <button
                  onClick={() => handleAction(s.id, 'approved')}
                  disabled={actionLoading === s.id + 'approved'}
                  style={{
                    background: '#22c55e', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '10px 16px', cursor: 'pointer',
                    fontWeight: 600, opacity: actionLoading === s.id + 'approved' ? 0.6 : 1
                  }}
                >
                  {actionLoading === s.id + 'approved' ? '...' : '✅ Approve'}
                </button>
                <button
                  onClick={() => handleAction(s.id, 'rejected')}
                  disabled={actionLoading === s.id + 'rejected'}
                  style={{
                    background: '#f59e0b', color: 'black', border: 'none',
                    borderRadius: '8px', padding: '10px 16px', cursor: 'pointer',
                    fontWeight: 600, opacity: actionLoading === s.id + 'rejected' ? 0.6 : 1
                  }}
                >
                  {actionLoading === s.id + 'rejected' ? '...' : '⚠️ Reject'}
                </button>
                <button
                  onClick={() => handleAction(s.id, 'delete')}
                  disabled={actionLoading === s.id + 'delete'}
                  style={{
                    background: 'transparent', color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '8px', padding: '10px 16px', cursor: 'pointer',
                    fontWeight: 600, opacity: actionLoading === s.id + 'delete' ? 0.6 : 1
                  }}
                >
                  {actionLoading === s.id + 'delete' ? '...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}