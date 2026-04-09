'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

const BRANCH_CONFIG = {
  'Army':         { color: '#16a34a', light: '#f0fdf4', badge: '#dcfce7', text: '#15803d', symbol: '⚔️', motto: 'This We\'ll Defend' },
  'Navy':         { color: '#1d4ed8', light: '#eff6ff', badge: '#dbeafe', text: '#1e40af', symbol: '⚓', motto: 'Forged by the Sea' },
  'Air Force':    { color: '#0891b2', light: '#f0f9ff', badge: '#e0f2fe', text: '#0e7490', symbol: '✈️', motto: 'Aim High' },
  'Marine Corps': { color: '#dc2626', light: '#fef2f2', badge: '#fee2e2', text: '#b91c1c', symbol: '🦅', motto: 'Semper Fidelis' },
  'Space Force':  { color: '#7c3aed', light: '#faf5ff', badge: '#ede9fe', text: '#6d28d9', symbol: '🚀', motto: 'Semper Supra' },
  'Coast Guard':  { color: '#d97706', light: '#fffbeb', badge: '#fef3c7', text: '#b45309', symbol: '⚓', motto: 'Semper Paratus' },
}

const DEFAULT_BRANCH = { color: '#2563eb', light: '#eff6ff', badge: '#dbeafe', text: '#1d4ed8', symbol: '🎖️', motto: 'Your transition starts here' }

function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isGuest = searchParams.get('guest') === 'true'
  const guestBranch = searchParams.get('branch') || ''
  const guestSepType = searchParams.get('separation_type') || ''

  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [totalDays, setTotalDays] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deadlines, setDeadlines] = useState([])
  const [vaScenario, setVaScenario] = useState(null)

  const loadProfile = useCallback(async () => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const guestMode = params.get('guest') === 'true'
    const branch = params.get('branch') || ''
    const sepType = params.get('separation_type') || ''

    if (guestMode) {
      setProfile({ full_name: 'Guest', branch, separation_type: sepType })
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single()

    if (!profileData) { router.push('/onboarding'); return }
    setProfile(profileData)

    if (profileData.separation_date) {
      const today = new Date()
      const sepDate = new Date(profileData.separation_date)
      const created = new Date(profileData.created_at)
      const remaining = Math.ceil((sepDate - today) / (1000 * 60 * 60 * 24))
      const total = Math.ceil((sepDate - created) / (1000 * 60 * 60 * 24))
      setDaysRemaining(remaining)
      setTotalDays(total)

      const { data: allItems } = await supabase.from('checklist_items').select('*')
      const { data: allProgress } = await supabase
        .from('user_checklist_progress')
        .select('checklist_item_id, completed, hidden')
        .eq('user_id', session.user.id)

      const completedMap = {}
      const hiddenMap = {}
      allProgress?.forEach(p => {
        completedMap[p.checklist_item_id] = p.completed
        hiddenMap[p.checklist_item_id] = p.hidden
      })

      const incompleteItems = (allItems || [])
        .filter(item => !completedMap[item.id] && !hiddenMap[item.id])
        .map(item => {
          const dueInDays = item.days_before_separation
            ? remaining - item.days_before_separation
            : null
          return { ...item, dueInDays }
        })
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, normal: 2 }
          const pa = priorityOrder[a.priority] ?? 2
          const pb = priorityOrder[b.priority] ?? 2
          if (pa !== pb) return pa - pb
          return (a.dueInDays ?? 999) - (b.dueInDays ?? 999)
        })
        .slice(0, 5)

      setDeadlines(incompleteItems)

      const { data: customItems } = await supabase
        .from('user_custom_tasks').select('id').eq('user_id', session.user.id)
      const { data: completedCustom } = await supabase
        .from('user_custom_tasks').select('id').eq('user_id', session.user.id).eq('completed', true)

      const activeItems = (allItems || []).filter(item => {
        if (hiddenMap[item.id] && !completedMap[item.id]) return false
        return true
      })
      const completedChecklist = activeItems.filter(item => completedMap[item.id]).length
      const taskTotal = activeItems.length + (customItems?.length || 0)
      const taskCompleted = completedChecklist + (completedCustom?.length || 0)
      setCompletedCount(taskCompleted)
      setTotalCount(taskTotal)
      if (taskTotal > 0) setProgress(Math.round((taskCompleted / taskTotal) * 100))
    }

    const { data: scenarios } = await supabase
      .from('va_disability_scenarios')
      .select('*').eq('user_id', session.user.id)
      .order('created_at', { ascending: false }).limit(1)
    if (scenarios?.length > 0) setVaScenario(scenarios[0])

    setLoading(false)
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  useEffect(() => {
    if (isGuest) return
    const handleFocus = () => loadProfile()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProfile, isGuest])

  const timeProgress = totalDays && daysRemaining
    ? Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100))
    : 0

  const branch = profile?.branch || ''
  const branchConfig = BRANCH_CONFIG[branch] || DEFAULT_BRANCH

  const guestNav = (path) => {
    if (path === '/settings') { alert('Sign in to access settings.'); return }
    const sep = path.includes('?') ? '&' : '?'
    router.push(`${path}${sep}guest=true&branch=${encodeURIComponent(guestBranch)}&separation_type=${encodeURIComponent(guestSepType)}`)
  }

  const getPriorityStyle = (priority, dueInDays) => {
    if (priority === 'critical') return {
      bg: '#fef2f2', border: '#ef4444', label: 'CRITICAL', labelBg: '#fee2e2', labelColor: '#ef4444',
      barColor: '#ef4444', dueColor: '#ef4444',
      dueText: dueInDays <= 0 ? 'OVERDUE' : `Due in ${dueInDays}d`
    }
    if (priority === 'high') return {
      bg: '#fffbeb', border: '#f59e0b', label: 'HIGH', labelBg: '#fef3c7', labelColor: '#d97706',
      barColor: '#f59e0b', dueColor: '#d97706',
      dueText: dueInDays <= 0 ? 'OVERDUE' : `Due in ${dueInDays}d`
    }
    return {
      bg: '#f9fafb', border: '#3b82f6', label: 'NORMAL', labelBg: '#eff6ff', labelColor: '#2563eb',
      barColor: '#3b82f6', dueColor: '#6b7280',
      dueText: dueInDays !== null ? `Due in ${dueInDays}d` : ''
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      Loading your dashboard...
    </div>
  )

  const firstName = isGuest ? 'Guest' : profile?.full_name?.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>

      <Sidebar isGuest={isGuest} guestBranch={guestBranch} guestSepType={guestSepType} />

      {/* Main content */}
      <div style={{ marginLeft: '220px', flex: 1, minHeight: '100vh' }}>

        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>
              Good morning, {firstName} 👋
            </h1>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{profile?.branch} — {profile?.separation_type}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isGuest && daysRemaining !== null && (
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', color: '#6b7280' }}>
                Separating in <span style={{ color: branchConfig.color, fontWeight: '700' }}>{daysRemaining} days</span>
              </div>
            )}
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: branchConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700' }}>
              {isGuest ? '👤' : (profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?')}
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Guest banner */}
          {isGuest && (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👋</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#1d4ed8', fontSize: '13px' }}>You're browsing as a guest</p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Sign in to save your progress, favorites, and checklist.</p>
                </div>
              </div>
              <button onClick={() => router.push('/login')}
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Sign In →
              </button>
            </div>
          )}

          {/* Alert banners */}
          {!isGuest && daysRemaining !== null && daysRemaining <= 365 && daysRemaining > 0 && (
            <div style={{ backgroundColor: branchConfig.light, border: `1px solid ${branchConfig.color}40`, borderLeft: `4px solid ${branchConfig.color}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>⏰</span>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: '600', color: branchConfig.text, fontSize: '13px' }}>Less than a year out — {branchConfig.motto}.</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>{daysRemaining} days until separation. High-priority items are shown first. Don't wait.</p>
              </div>
            </div>
          )}

          {!isGuest && daysRemaining !== null && daysRemaining <= 0 && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderLeft: '4px solid #22c55e', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>🎖️</span>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: '600', color: '#15803d', fontSize: '13px' }}>Congratulations — you've separated!</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Welcome to the other side. Don't forget to take care of yourself during this transition.</p>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: vaScenario ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px', marginBottom: '20px' }}>

            {/* Checklist progress — always green */}
            <div onClick={() => !isGuest && router.push('/checklist')}
              style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', cursor: isGuest ? 'default' : 'pointer' }}
              onMouseEnter={e => { if (!isGuest) e.currentTarget.style.borderColor = '#22c55e' }}
              onMouseLeave={e => { if (!isGuest) e.currentTarget.style.borderColor = '#e5e7eb' }}>
              <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase', margin: '0 0 8px' }}>Checklist Progress</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e', margin: '0 0 4px', letterSpacing: '-1px' }}>{isGuest ? '--' : `${progress}%`}</p>
              {!isGuest && (
                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '4px', padding: '2px 8px', display: 'inline-block', marginBottom: '8px' }}>
                  <span style={{ color: '#15803d', fontSize: '11px', fontWeight: '600' }}>↑ {completedCount} of {totalCount} done</span>
                </div>
              )}
              <div style={{ height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: isGuest ? '0%' : `${progress}%`, backgroundColor: '#22c55e', borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0' }}>{isGuest ? 'Sign in to track' : `${progress}% complete`}</p>
            </div>

            {/* Tasks completed */}
            <div onClick={() => !isGuest && router.push('/checklist')}
              style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', cursor: isGuest ? 'default' : 'pointer' }}
              onMouseEnter={e => { if (!isGuest) e.currentTarget.style.borderColor = '#f59e0b' }}
              onMouseLeave={e => { if (!isGuest) e.currentTarget.style.borderColor = '#e5e7eb' }}>
              <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase', margin: '0 0 8px' }}>Tasks Completed</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: '0 0 4px', letterSpacing: '-1px' }}>
                {isGuest ? '--' : `${completedCount}`}<span style={{ fontSize: '14px', color: '#9ca3af' }}>{isGuest ? '' : `/${totalCount}`}</span>
              </p>
              {!isGuest && deadlines.filter(d => d.priority === 'critical').length > 0 && (
                <div style={{ backgroundColor: '#fef2f2', borderRadius: '4px', padding: '2px 8px', display: 'inline-block', marginBottom: '8px' }}>
                  <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600' }}>⚠ {deadlines.filter(d => d.priority === 'critical').length} critical pending</span>
                </div>
              )}
              {!isGuest && deadlines.filter(d => d.priority === 'critical').length === 0 && deadlines.filter(d => d.priority === 'high').length > 0 && (
                <div style={{ backgroundColor: '#fffbeb', borderRadius: '4px', padding: '2px 8px', display: 'inline-block', marginBottom: '8px' }}>
                  <span style={{ color: '#d97706', fontSize: '11px', fontWeight: '600' }}>⚠ {deadlines.filter(d => d.priority === 'high').length} high priority pending</span>
                </div>
              )}
              <div style={{ height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: isGuest ? '0%' : `${progress}%`, backgroundColor: deadlines.filter(d => d.priority === 'critical').length > 0 ? '#ef4444' : '#f59e0b', borderRadius: '2px' }} />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0' }}>{isGuest ? 'Sign in to track' : `${timeProgress}% of timeline elapsed`}</p>
            </div>

            {/* VA Disability — always blue, only if saved scenario */}
            {vaScenario && (
              <div style={{ backgroundColor: '#fff', border: '1px solid #2563eb', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#2563eb' }} />
                <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase', margin: '0 0 8px' }}>VA Disability Est.</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', margin: '0 0 2px', letterSpacing: '-1px' }}>{vaScenario.result?.combinedRounded}%</p>
                <p style={{ color: '#111', fontSize: '13px', fontWeight: '600', margin: '0 0 8px' }}>~${parseFloat(vaScenario.result?.monthly || 0).toLocaleString()}<span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '400' }}>/mo tax-free</span></p>
                <div style={{ height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${vaScenario.result?.combinedRounded || 0}%`, backgroundColor: '#2563eb', borderRadius: '2px' }} />
                </div>
                <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0', fontStyle: 'italic' }}>"{vaScenario.name}"</p>
              </div>
            )}
          </div>

          {/* Quick nav cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'SkillBridge', icon: '🗺️', path: '/skillbridge', sub: 'Find opportunities' },
              { label: 'Certifications', icon: '📜', path: '/certifications', sub: 'Browse & favorite' },
              { label: 'Calculators', icon: '💰', path: '/calculators', sub: 'TSP · GI Bill · VA' },
              { label: 'Blog', icon: '📰', path: '/blog', sub: 'Stories & advice' },
            ].map(item => (
              <div key={item.path}
                onClick={() => isGuest ? guestNav(item.path) : router.push(item.path)}
                style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = branchConfig.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: branchConfig.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{item.icon}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#111' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{item.sub}</p>
                  </div>
                </div>
                <span style={{ color: '#d1d5db', fontSize: '18px' }}>›</span>
              </div>
            ))}
          </div>

          {/* Deadlines section */}
          {!isGuest && deadlines.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0 }}>Upcoming Deadlines — Incomplete Only</p>
                <button onClick={() => router.push('/checklist')}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}>
                  View checklist →
                </button>
              </div>

              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                {deadlines.map((item, i) => {
                  const s = getPriorityStyle(item.priority, item.dueInDays)
                  return (
                    <div key={item.id}
                      onClick={() => router.push('/checklist')}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', backgroundColor: '#fff', borderBottom: i < deadlines.length - 1 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer', borderLeft: `4px solid ${s.border}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ backgroundColor: s.labelBg, color: s.labelColor, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${s.border}` }}>{s.label}</span>
                          {item.category && <span style={{ color: '#9ca3af', fontSize: '11px' }}>{item.category}</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#111' }}>{item.title}</p>
                        {item.description && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>{item.description}</p>}
                      </div>
                      {s.dueText && (
                        <span style={{ color: s.dueColor, fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>{s.dueText}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!isGuest && deadlines.length === 0 && totalCount > 0 && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '20px', margin: '0 0 8px' }}>🎉</p>
              <p style={{ color: '#15803d', fontWeight: '600', margin: '0 0 4px', fontSize: '14px' }}>All caught up!</p>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No pending high-priority items. Keep it up!</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
        Loading...
      </div>
    }>
      <DashboardPage />
    </Suspense>
  )
}