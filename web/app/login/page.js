'use client'

import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
            redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.log('Login error:', error.message)
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
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        🎖️ Military Separation App
      </h1>
      <p style={{ color: '#8899aa', marginBottom: '2rem' }}>
        Your guide to a successful transition
      </p>
      <button
        onClick={handleGoogleLogin}
        style={{
          backgroundColor: 'white',
          color: '#333',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        Sign in with Google
      </button>

      <button
        onClick={() => window.location.href = '/guest'}
        style={{
          backgroundColor: 'transparent',
          color: '#8899aa',
          border: '1px solid #1e3a5f',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Browse as Guest →
      </button>

      <p style={{ 
        color: '#445566', 
        fontSize: '0.8rem', 
        marginTop: '1rem',
        textAlign: 'center',
        maxWidth: '300px'
      }}>
        Guest mode lets you explore the checklist and resources without saving progress
      </p>
    </div>
  )
}
