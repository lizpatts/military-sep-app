'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    branch: '',
    separation_type: '',
    separation_date: ''
  })
  const [loading, setLoading] = useState(false)

  const branches = [
    'Army', 'Navy', 'Marine Corps',
    'Air Force', 'Space Force', 'Coast Guard'
  ]

  const separationTypes = [
    'ETS / End of Service',
    'Retirement (20+ years)',
    'Medical Separation',
    'Early Release',
    'Other'
  ]

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        if (session?.user) {
          setUser(session.user)
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.branch ||
      !formData.separation_type || !formData.separation_date) {
      alert('Please fill in all fields before continuing.')
      return
    }

    if (!user) {
      alert('Your session expired. Please sign in again.')
      router.push('/login')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...formData
      })

    if (error) {
      console.log('Error saving profile:', error.message)
      alert('Something went wrong: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a1628',
      color: 'white',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
        Let's get you set up
      </h1>
      <p style={{ color: '#8899aa', marginBottom: '2rem' }}>
        Tell us about your transition
      </p>

      {!user && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Loading your session...
          </p>
          <p style={{ color: '#445566', fontSize: '0.75rem' }}>
            If this takes too long, you'll be redirected to sign in.
          </p>
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <input
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          style={inputStyle}
        />

        <select
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select your branch</option>
          {branches.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          name="separation_type"
          value={formData.separation_type}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select separation type</option>
          {separationTypes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div>
          <label style={{ color: '#8899aa', fontSize: '0.85rem' }}>
            Separation Date
          </label>
          <input
            name="separation_date"
            type="date"
            value={formData.separation_date}
            onChange={handleChange}
            style={{ ...inputStyle, marginTop: '0.25rem' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !user}
          style={{
            backgroundColor: user ? '#2563eb' : '#1e3a5f',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: user ? 'pointer' : 'not-allowed',
            marginTop: '1rem'
          }}
        >
          {loading ? 'Saving...' : !user ? 'Loading session...' : 'Continue to Dashboard →'}
        </button>
      </div>
    </div>
  )
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