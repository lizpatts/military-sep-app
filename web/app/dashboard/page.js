'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
const searchParams = useSearchParams()
const isGuest = searchParams.get('guest') === 'true'
const guestBranch = searchParams.get('branch') || ''
const guestSepType = searchParams.get('separation_type') || ''

  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [totalDays, setTotalDays] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    // Check URL params directly to avoid timing issues
    const params = new URLSearchParams(window.location.search)
    const guestMode = params.get('guest') === 'true'
    const branch = params.get('branch') || ''
    const sepType = params.get('separation_type') || ''

    if (guestMode) {
      setProfile({ full_name: 'Guest', branch, separation_type: sepType })
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profileData) {
      router.push('/onboarding')
      return
    }

    setProfile(profileData)

    if (profileData.separation_date) {
      const today = new Date()
      const sepDate = new Date(profileData.separation_date)
      const created = new Date(profileData.created_at)
      const remaining = Math.ceil((sepDate - today) / (1000 * 60 * 60 * 24))
      const total = Math.ceil((sepDate - created) / (1000 * 60 * 60 * 24))
      setDaysRemaining(remaining)
      setTotalDays(total)
    }

    const { data: allItems } = await supabase
      .from('checklist_items')
      .select('id')

    const { data: allProgress } = await supabase
      .from('user_checklist_progress')
      .select('checklist_item_id, hidden, completed')
      .eq('user_id', session.user.id)

    const { data: customItems } = await supabase
      .from('user_custom_tasks')
      .select('id')
      .eq('user_id', session.user.id)

    const { data: completedCustom } = await supabase
      .from('user_custom_tasks')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('completed', true)

    const hiddenMap = {}
    const completedMap = {}
    allProgress?.forEach(p => {
      hiddenMap[p.checklist_item_id] = p.hidden
      completedMap[p.checklist_item_id] = p.completed
    })

    const activeItems = allItems?.filter(item => {
      const isHidden = hiddenMap[item.id]
      const isCompleted = completedMap[item.id]
      if (isHidden && !isCompleted) return false
      return true
    }) || []

    const completedChecklistCount = activeItems.filter(item => completedMap[item.id]).length
    const totalCount = activeItems.length + (customItems?.length || 0)
    const completedCount = completedChecklistCount + (completedCustom?.length || 0)

    if (totalCount > 0) {
      const pct = Math.round((completedCount / totalCount) * 100)
      setProgress(pct)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const params = new URLSearchParams(window.location.search)
  console.log('URL params:', window.location.search)
  console.log('guest mode:', params.get('guest'))

  useEffect(() => {
    if (isGuest) return
    const handleFocus = () => loadProfile()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProfile, isGuest])

  const timeProgress = totalDays && daysRemaining
    ? Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100))
    : 0

  const guestNav = (path) => {
    if (path === '/settings') {
      alert('Sign in to access settings.')
      return
    }
    const sep = path.includes('?') ? '&' : '?'
    router.push(`${path}${sep}guest=true&branch=${encodeURIComponent(guestBranch)}&separation_type=${encodeURIComponent(guestSepType)}`)
  }

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

      {/* Guest banner */}
      {isGuest && (
        <div style={{
          backgroundColor: '#2563eb11',
          border: '1px solid #2563eb',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>👋</span>
            <div>
              <p style={{ margin: 0, fontWeight: '500', color: '#2563eb' }}>You're browsing as a guest</p>
              <p style={{ margin: 0, color: '#8899aa', fontSize: '0.8rem' }}>Sign in to save your progress, favorites, and checklist.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: '#2563eb', color: 'white', border: 'none',
              borderRadius: '8px', padding: '8px 18px',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Sign In →
          </button>
        </div>
      )}

      {/* Less than 1 year warning — only for logged in users */}
      {!isGuest && daysRemaining !== null && daysRemaining <= 365 && daysRemaining > 0 && (
        <div style={{
          backgroundColor: '#f59e0b11',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⏰</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: '500', color: '#f59e0b' }}>
              You're less than a year out — it's crunch time!
            </p>
            <p style={{ margin: 0, color: '#8899aa', fontSize: '0.85rem' }}>
              {daysRemaining} days until separation. Your dashboard is now prioritizing the most important items. Don't wait — start checking things off today.
            </p>
          </div>
        </div>
      )}

      {!isGuest && daysRemaining !== null && daysRemaining <= 0 && (
        <div style={{
          backgroundColor: '#22c55e11',
          border: '1px solid #22c55e',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎖️</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: '500', color: '#22c55e' }}>
              Congratulations — you've separated!
            </p>
            <p style={{ margin: 0, color: '#8899aa', fontSize: '0.85rem' }}>
              Welcome to the other side. Check in with your checklist and don't forget to take care of yourself during this transition.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
          {isGuest ? 'Welcome, Guest 👋' : `Welcome back, ${profile?.full_name?.split(' ')[0]} 👋`}
        </h1>
        <p style={{ color: '#8899aa' }}>
          {profile?.branch} — {profile?.separation_type}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={cardStyle}>
          <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Checklist Progress
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {isGuest ? '--' : `${progress}%`}
          </p>
          <div style={progressTrackStyle}>
            {!isGuest && (
              <div style={{ ...progressBarStyle, width: `${progress}%`, backgroundColor: '#22c55e' }} />
            )}
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {isGuest ? 'Sign in to track progress' : 'tasks completed'}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Time to Separation
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {isGuest ? '--' : daysRemaining !== null ? `${daysRemaining}d` : '--'}
          </p>
          <div style={progressTrackStyle}>
            {!isGuest && (
              <div style={{ ...progressBarStyle, width: `${timeProgress}%`, backgroundColor: '#2563eb' }} />
            )}
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {isGuest ? 'Sign in to see your timeline' : `${timeProgress}% of timeline elapsed`}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        {[
          { label: '✅ My Checklist', path: '/checklist' },
          { label: '🗺️ SkillBridge Map', path: '/skillbridge' },
          { label: '📜 Certifications', path: '/certifications' },
          { label: '💰 Financial Calculators', path: '/calculators' },
          { label: '📰 Blog & Interviews', path: '/blog' },
          { label: '⚙️ Settings', path: '/settings' },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => isGuest ? guestNav(item.path) : router.push(item.path)}
            style={{
              ...navButtonStyle,
              opacity: isGuest && item.path === '/settings' ? 0.4 : 1
            }}
          >
            {item.label}
            {isGuest && item.path === '/settings' && (
              <span style={{ color: '#445566', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                Sign in required
              </span>
            )}
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