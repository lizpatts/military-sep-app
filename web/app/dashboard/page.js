'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [totalDays, setTotalDays] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      // Calculate days remaining
      if (profileData.separation_date) {
        const today = new Date()
        const sepDate = new Date(profileData.separation_date)
        const created = new Date(profileData.created_at)
        const remaining = Math.ceil((sepDate - today) / (1000 * 60 * 60 * 24))
        const total = Math.ceil((sepDate - created) / (1000 * 60 * 60 * 24))
        setDaysRemaining(remaining)
        setTotalDays(total)
      }

      // Calculate checklist progress
      const { data: allItems } = await supabase
        .from('checklist_items')
        .select('id')

      const { data: completedItems } = await supabase
        .from('user_checklist_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true)

      if (allItems && allItems.length > 0) {
        const pct = Math.round((completedItems?.length || 0) / allItems.length * 100)
        setProgress(pct)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const timeProgress = totalDays && daysRemaining
    ? Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100))
    : 0

  if (loading) return (
    <div style={{ 
      display: 'flex', alignItems: 'center', 
      justifyContent: 'center', minHeight: '100vh',
      backgroundColor: '#0a1628', color: 'white',
      fontFamily: 'sans-serif'
    }}>
      Loading your dashboard...
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
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
          Welcome back, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#8899aa' }}>
          {profile?.branch} — {profile?.separation_type}
        </p>
      </div>

      {/* Progress Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Checklist Progress */}
        <div style={cardStyle}>
          <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Checklist Progress
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {progress}%
          </p>
          <div style={progressTrackStyle}>
            <div style={{
              ...progressBarStyle,
              width: `${progress}%`,
              backgroundColor: '#22c55e'
            }}/>
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            tasks completed
          </p>
        </div>

        {/* Time Progress */}
        <div style={cardStyle}>
          <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Time to Separation
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {daysRemaining !== null ? `${daysRemaining}d` : '--'}
          </p>
          <div style={progressTrackStyle}>
            <div style={{
              ...progressBarStyle,
              width: `${timeProgress}%`,
              backgroundColor: '#2563eb'
            }}/>
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {timeProgress}% of timeline elapsed
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        {[
          { label: '✅ My Checklist', path: '/checklist' },
          { label: '🗺️ SkillBridge Map', path: '/skillbridge' },
          { label: '📜 Free Certifications', path: '/certifications' },
          { label: '💰 Financial Calculators', path: '/calculators' },
          { label: '📰 Blog & Interviews', path: '/blog' },
          { label: '⚙️ Settings', path: '/settings' },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={navButtonStyle}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const cardStyle = {
  backgroundColor: '#0f2035',
  border: '1px solid #1e3a5f',
  borderRadius: '12px',
  padding: '1.25rem'
}

const progressTrackStyle = {
  width: '100%',
  height: '8px',
  backgroundColor: '#1e3a5f',
  borderRadius: '4px',
  overflow: 'hidden'
}

const progressBarStyle = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.5s ease'
}

const navButtonStyle = {
  backgroundColor: '#0f2035',
  color: 'white',
  border: '1px solid #1e3a5f',
  borderRadius: '12px',
  padding: '1.25rem',
  fontSize: '1rem',
  cursor: 'pointer',
  textAlign: 'left'
}