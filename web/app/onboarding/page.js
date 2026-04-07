'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const BRANCH_CONFIG = {
  'Army':         { color: '#16a34a', symbol: '⚔️', motto: 'This We\'ll Defend' },
  'Navy':         { color: '#1d4ed8', symbol: '⚓', motto: 'Forged by the Sea' },
  'Air Force':    { color: '#0891b2', symbol: '✈️', motto: 'Aim High' },
  'Marine Corps': { color: '#dc2626', symbol: '🦅', motto: 'Semper Fidelis' },
  'Space Force':  { color: '#7c3aed', symbol: '🚀', motto: 'Semper Supra' },
  'Coast Guard':  { color: '#d97706', symbol: '⚓', motto: 'Semper Paratus' },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '', branch: '', separation_type: '', separation_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const branches = ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard']
  const separationTypes = [
    'ETS / End of Service', 'Retirement (20+ years)',
    'Medical Separation', 'Early Release', 'Other'
  ]

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUser(session.user)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user)
    })
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) router.push('/login')
    }, 5000)
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.branch || !formData.separation_type || !formData.separation_date) {
      alert('Please fill in all fields before continuing.')
      return
    }
    if (!user) { alert('Your session expired. Please sign in again.'); router.push('/login'); return }
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, ...formData })
    if (error) { alert('Something went wrong: ' + error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const selectedBranch = BRANCH_CONFIG[formData.branch]
  const accentColor = selectedBranch?.color || '#2563eb'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>

      {/* Left panel */}
      <div style={{ flex: 1, backgroundColor: accentColor, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'white', transition: 'background-color 0.4s ease' }}>
        <div style={{ maxWidth: '380px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', transition: 'all 0.3s' }}>
            {selectedBranch ? selectedBranch.symbol : '🎖️'}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.4px', margin: '0 0 12px' }}>
            {selectedBranch ? `${formData.branch}` : 'Welcome, Service Member'}
          </h1>
          {selectedBranch && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontStyle: 'italic', margin: '0 0 24px' }}>
              "{selectedBranch.motto}"
            </p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {!selectedBranch
              ? 'We\'ll customize your experience based on your branch and separation details.'
              : 'Your dashboard, checklist, and resources will be tailored to your transition.'}
          </p>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{
                width: s <= step ? '24px' : '8px', height: '8px', borderRadius: '4px',
                backgroundColor: s <= step ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '8px' }}>
            Step {step} of 4
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '480px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>

          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
            Let's get you set up
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 28px' }}>
            Tell us about your transition so we can personalize your experience.
          </p>

          {!user && (
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
              <p style={{ color: '#92400e', fontSize: '13px', margin: 0 }}>⏳ Loading your session...</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Full name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input name="full_name" placeholder="e.g. Jane Smith" value={formData.full_name}
                onChange={e => { handleChange(e); setStep(Math.max(step, 1)) }}
                style={inputStyle} />
            </div>

            {/* Branch */}
            <div>
              <label style={labelStyle}>Branch of Service</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {branches.map(b => {
                  const bc = BRANCH_CONFIG[b]
                  const isSelected = formData.branch === b
                  return (
                    <button key={b} onClick={() => { setFormData(prev => ({ ...prev, branch: b })); setStep(Math.max(step, 2)) }}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', border: '2px solid',
                        borderColor: isSelected ? bc.color : '#e5e7eb',
                        backgroundColor: isSelected ? bc.color + '11' : '#fff',
                        color: isSelected ? bc.color : '#6b7280',
                        cursor: 'pointer', fontSize: '13px', fontWeight: isSelected ? '600' : '400',
                        display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                      }}>
                      <span>{bc.symbol}</span> {b}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Separation type */}
            <div>
              <label style={labelStyle}>Separation Type</label>
              <select name="separation_type" value={formData.separation_type}
                onChange={e => { handleChange(e); setStep(Math.max(step, 3)) }}
                style={inputStyle}>
                <option value="">Select type</option>
                {separationTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Separation date */}
            <div>
              <label style={labelStyle}>Separation Date</label>
              <input name="separation_date" type="date" value={formData.separation_date}
                onChange={e => { handleChange(e); setStep(Math.max(step, 4)) }}
                style={inputStyle} />
              <p style={{ color: '#9ca3af', fontSize: '11px', margin: '4px 0 0' }}>
                This powers your countdown timer and checklist priorities.
              </p>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading || !user} style={{
              backgroundColor: user ? accentColor : '#e5e7eb',
              color: user ? 'white' : '#9ca3af',
              border: 'none', padding: '14px', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600',
              cursor: user ? 'pointer' : 'not-allowed', marginTop: '8px',
              transition: 'background-color 0.3s'
            }}>
              {loading ? 'Saving...' : !user ? 'Loading session...' : 'Continue to Dashboard →'}
            </button>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
            You can update all of this later in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', color: '#374151', fontSize: '13px',
  fontWeight: '500', marginBottom: '6px'
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
  color: '#111', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
}