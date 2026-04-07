'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

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
        .from('profiles').select('*').eq('id', session.user.id).single()
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
        ? `Update separation date to ${newDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}?\n\nSince your new date is less than a year away, your checklist will prioritize high priority items. Your progress will not be affected.`
        : `Update separation date to ${newDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}?\n\nYour existing checklist progress and tasks will not be affected.`
      if (!confirm(message)) return
    }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      email: user.email,
      full_name: formData.full_name,
      branch: formData.branch,
      separation_type: formData.separation_type,
      separation_date: formData.separation_date,
      phone_number: formData.phone_number,
      notify_push: formData.notify_push,
      notify_email: formData.notify_email,
      notify_sms: formData.notify_sms
    }).eq('id', user.id)
    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      Loading settings...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar />

      <div style={{ marginLeft: '220px', flex: 1 }}>
        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px' }}>
          <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>Settings</h1>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Manage your profile, notifications, and account</p>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: '800px' }}>

          {/* Profile card */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Profile Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input name="full_name" value={formData.full_name} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={user?.email || ''} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#f3f4f6' }} />
                <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>Managed by Google sign-in</p>
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
                <input name="separation_date" type="date" value={formData.separation_date} onChange={handleChange} style={inputStyle} />
                <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>Changing this updates your timeline and checklist priority</p>
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+1 (555) 000-0000" style={inputStyle} />
                <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>Used for SMS reminders (coming soon)</p>
              </div>
            </div>
          </div>

          {/* Notifications card */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Notification Preferences
            </h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
              Choose how you want to receive separation reminders and updates.
            </p>
            {[
              { name: 'notify_push', label: 'Push Notifications', desc: 'Reminders via mobile app notifications' },
              { name: 'notify_email', label: 'Email Reminders', desc: 'Reminders sent to your Google email' },
              { name: 'notify_sms', label: 'SMS / Text Message', desc: 'Reminders sent to your phone number' },
            ].map((item, i, arr) => (
              <div key={item.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '500', fontSize: '14px', color: '#111' }}>{item.label}</p>
                  <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '12px' }}>{item.desc}</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, marginLeft: '16px' }}>
                  <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span onClick={() => setFormData(prev => ({ ...prev, [item.name]: !prev[item.name] }))} style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: formData[item.name] ? '#2563eb' : '#e5e7eb',
                    borderRadius: '24px', transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute', height: '18px', width: '18px',
                      left: formData[item.name] ? '23px' : '3px', bottom: '3px',
                      backgroundColor: 'white', borderRadius: '50%', transition: '0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>

          {/* Account card */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Account
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                {formData.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '500', fontSize: '14px', color: '#111' }}>{formData.full_name || 'No name set'}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} style={{
              backgroundColor: saved ? '#22c55e' : '#2563eb',
              color: 'white', border: 'none', padding: '12px 28px',
              borderRadius: '8px', fontSize: '14px', fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s'
            }}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
            <button onClick={handleSignOut} style={{
              backgroundColor: '#fff', color: '#ef4444',
              border: '1px solid #fca5a5', padding: '12px 28px',
              borderRadius: '8px', fontSize: '14px', cursor: 'pointer'
            }}>
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

const cardStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '16px'
}

const labelStyle = {
  display: 'block',
  color: '#6b7280',
  fontSize: '13px',
  marginBottom: '6px',
  fontWeight: '500'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff',
  color: '#111',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none'
}