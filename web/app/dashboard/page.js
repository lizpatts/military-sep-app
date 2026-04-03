'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [totalDays, setTotalDays] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
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

    const userBranch = profileData.branch
    const userSepType = profileData.separation_type

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

    // Build maps for hidden and completed
    const hiddenMap = {}
    const completedMap = {}
    allProgress?.forEach(p => {
      hiddenMap[p.checklist_item_id] = p.hidden
      completedMap[p.checklist_item_id] = p.completed
    })

    // Count only items that are not (hidden AND uncompleted)
    const activeItems = allItems?.filter(item => {
      const isHidden = hiddenMap[item.id]
      const isCompleted = completedMap[item.id]
      if (isHidden && !isCompleted) return false
      return true
    }) || []

    const completedChecklistCount = activeItems.filter(item => completedMap[item.id]).length
    const totalCount = activeItems.length + (customItems?.length || 0)
    const completedCount = completedChecklistCount + (completedCustom?.length || 0)






    console.log('total:', totalCount, 'completed:', completedCount)

    if (totalCount > 0) {
      const pct = Math.round((completedCount / totalCount) * 100)
      setProgress(pct)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    const handleFocus = () => loadProfile()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProfile])

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
{/* Less than 1 year warning */}
      {daysRemaining !== null && daysRemaining <= 365 && daysRemaining > 0 && (
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

      {daysRemaining !== null && daysRemaining <= 0 && (
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
          Welcome back, {profile?.full_name?.split(' ')[0]} 👋
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
            {progress}%
          </p>
          <div style={progressTrackStyle}>
            <div style={{
              ...progressBarStyle,
              width: `${progress}%`,
              backgroundColor: '#22c55e'
            }} />
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            tasks completed
          </p>
        </div>

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
            }} />
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {timeProgress}% of timeline elapsed
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