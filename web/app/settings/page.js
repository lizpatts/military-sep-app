'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    branch: '',
    separation_type: '',
    separation_date: '',
    phone_number: '',
    notify_push: false,
    notify_email: false,
    notify_sms: false
  })

  const branches = ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard']
  const separationTypes = [
    'ETS / End of Service',
    'Retirement (20+ years)',
    'Medical Separation',
    'Early Release',
    'Other'
  ]

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          branch: profileData.branch || '',
          separation_type: profileData.separation_type || '',
          separation_date: profileData.separation_date || '',
          phone_number: profileData.phone_number || '',
          notify_push: profileData.notify_push || false,
          notify_email: profileData.notify_email || false,
          notify_sms: profileData.notify_sms || false
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [e.target.name]: val }))
  }

const handleSave = async () => {
    const isChangingDate = formData.separation_date !== profile?.separation_date

    if (isChangingDate) {
      const newDate = new Date(formData.separation_date)
      const today = new Date()
      const daysUntilNew = Math.ceil((newDate - today) / (1000 * 60 * 60 * 24))
      const isUnderOneYear = daysUntilNew <= 365 && daysUntilNew > 0

      const message = isUnderOneYear
        ? `Are you sure you want to update your separation date to ${newDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}?\n\nSince your new date is less than a year away, your checklist will prioritize high priority items first. Your existing progress and tasks will not be affected.`
        : `Are you sure you want to update your separation date to ${newDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}?\n\nYour existing checklist progress and tasks will not be affected.`

      const confirmed = confirm(message)
      if (!confirmed) return
    }

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        branch: formData.branch,
        separation_type: formData.separation_type,
        separation_date: formData.separation_date,
        phone_number: formData.phone_number,
        notify_push: formData.notify_push,
        notify_email: formData.notify_email,
        notify_sms: formData.notify_sms
      })
      .eq('id', user.id)

    if (error) {
      alert('Error saving: ' + error.message)
      setSaving(false)
      return
    }

    setProfile({ ...profile, ...formData })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }
  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      backgroundColor: '#0a1628', color: 'white',
      fontFamily: 'sans-serif'
    }}>
      Loading settings...
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/dashboard')} style={backButtonStyle}>
          ← Dashboard
        </button>
        <h1 style={{ fontSize: '1.5rem' }}>Settings</h1>
      </div>

      {/* Profile Section */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#8899aa' }}>
          Profile Information
        </h2>

        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              value={user?.email || ''}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
            />
            <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>
              Email is managed by Google sign-in
            </p>
          </div>
          <div>
            <label style={labelStyle}>Branch</label>
            <select name="branch" value={formData.branch} onChange={handleChange} style={inputStyle}>
              <option value="">Select branch</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Separation Type</label>
            <select name="separation_type" value={formData.separation_type} onChange={handleChange} style={inputStyle}>
              <option value="">Select type</option>
              {separationTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Separation Date</label>
            <input
              name="separation_date"
              type="date"
              value={formData.separation_date}
              onChange={handleChange}
              style={inputStyle}
            />
            <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>
              Changing this will trigger a contract extension check
            </p>
          </div>
          <div>
            <label style={labelStyle}>Phone Number (for SMS reminders)</label>
            <input
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#8899aa' }}>
          Notification Preferences
        </h2>
        <p style={{ color: '#445566', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Choose how you want to receive separation reminders and updates.
        </p>

        {[
          { name: 'notify_push', label: 'Push Notifications', desc: 'Reminders via mobile app notifications' },
          { name: 'notify_email', label: 'Email Reminders', desc: 'Reminders sent to your Google email' },
          { name: 'notify_sms', label: 'SMS / Text Message', desc: 'Reminders sent to your phone number' },
        ].map(item => (
          <div key={item.name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 0',
            borderBottom: '1px solid #1e3a5f'
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: '500' }}>{item.label}</p>
              <p style={{ margin: '4px 0 0', color: '#445566', fontSize: '0.85rem' }}>{item.desc}</p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input
                type="checkbox"
                name={item.name}
                checked={formData[item.name]}
                onChange={handleChange}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: formData[item.name] ? '#2563eb' : '#1e3a5f',
                borderRadius: '24px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '18px',
                  width: '18px',
                  left: formData[item.name] ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }} />
              </span>
            </label>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saved ? '#22c55e' : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>

        <button onClick={handleSignOut} style={{
          backgroundColor: 'transparent',
          color: '#ef4444',
          border: '1px solid #ef444455',
          padding: '14px 28px',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

const cardStyle = {
  backgroundColor: '#0f2035',
  border: '1px solid #1e3a5f',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem'
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1rem'
}

const labelStyle = {
  display: 'block',
  color: '#8899aa',
  fontSize: '0.85rem',
  marginBottom: '0.5rem'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #1e3a5f',
  backgroundColor: '#0a1628',
  color: 'white',
  fontSize: '0.95rem',
  boxSizing: 'border-box'
}

const backButtonStyle = {
  backgroundColor: 'transparent',
  color: '#8899aa',
  border: '1px solid #1e3a5f',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  cursor: 'pointer'
}