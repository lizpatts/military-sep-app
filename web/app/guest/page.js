'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GuestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    branch: '',
    separation_type: ''
  })

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleContinue = () => {
    if (!formData.branch || !formData.separation_type) {
      alert('Please select your branch and separation type to continue.')
      return
    }
    router.push(`/dashboard?guest=true&branch=${formData.branch}&separation_type=${formData.separation_type}`)
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
        Browse as Guest
      </h1>
      <p style={{ color: '#8899aa', marginBottom: '0.5rem' }}>
        See your personalized checklist without signing in
      </p>
      <p style={{ 
        color: '#445566', 
        fontSize: '0.85rem',
        marginBottom: '2rem',
        textAlign: 'center',
        maxWidth: '350px'
      }}>
        Note: Your progress won't be saved. Sign up anytime to save your checklist.
      </p>

      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

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

        <button
          onClick={handleContinue}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          View Checklist →
        </button>

        <button
          onClick={() => router.push('/login')}
          style={{
            backgroundColor: 'transparent',
            color: '#8899aa',
            border: 'none',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          ← Back to sign in
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