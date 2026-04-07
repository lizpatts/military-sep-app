'use client'

import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) console.log('Login error:', error.message)
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif'
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1, backgroundColor: '#1d4ed8',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '3rem', color: 'white'
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎖️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 1rem' }}>
            Military Separation App
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 3rem' }}>
            Your guide to a successful transition from active duty to civilian life.
          </p>

          {/* Feature list */}
          {[
            { icon: '✅', text: 'Personalized separation checklist' },
            { icon: '🗺️', text: 'SkillBridge opportunity map' },
            { icon: '💰', text: 'TSP, GI Bill & VA calculators' },
            { icon: '📜', text: 'Certification recommendations' },
            { icon: '📰', text: 'Transition stories & interviews' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', textAlign: 'left' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: '#dbeafe', fontSize: '14px' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — sign in */}
      <div style={{
        width: '480px', backgroundColor: '#fff',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '3rem'
      }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
            Welcome back
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 32px' }}>
            Sign in to access your transition dashboard
          </p>

          {/* Google sign in */}
          <button onClick={handleGoogleLogin} style={{
            width: '100%', backgroundColor: '#fff', color: '#111',
            border: '1px solid #e5e7eb', padding: '12px 20px',
            borderRadius: '8px', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px', marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'box-shadow 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.82v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.52.09-1.02.25-1.52V5.41H1.82A8 8 0 0 0 .98 9c0 1.29.31 2.51.84 3.59l2.69-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.16 4.41l2.69 2.07c.63-1.89 2.39-3.9 4.47-3.9z"/>
            </svg>
            Sign in with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          </div>

          {/* Guest mode */}
          <button onClick={() => window.location.href = '/guest'} style={{
            width: '100%', backgroundColor: '#f9fafb', color: '#374151',
            border: '1px solid #e5e7eb', padding: '12px 20px',
            borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
            fontWeight: '500', marginBottom: '24px'
          }}>
            Browse as Guest →
          </button>

          <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', lineHeight: '1.5' }}>
            Guest mode lets you explore the checklist and resources without saving progress.
          </p>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '11px' }}>
              Built for service members by veterans 🎖️
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}