'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const BRANCH_CONFIG = {
  'Army':         { color: '#16a34a', light: '#f0fdf4', badge: '#dcfce7', text: '#15803d', symbol: '⚔️', motto: 'This We\'ll Defend' },
  'Navy':         { color: '#1d4ed8', light: '#eff6ff', badge: '#dbeafe', text: '#1e40af', symbol: '⚓', motto: 'Forged by the Sea' },
  'Air Force':    { color: '#0891b2', light: '#f0f9ff', badge: '#e0f2fe', text: '#0e7490', symbol: '✈️', motto: 'Aim High' },
  'Marine Corps': { color: '#dc2626', light: '#fef2f2', badge: '#fee2e2', text: '#b91c1c', symbol: '🦅', motto: 'Semper Fidelis' },
  'Space Force':  { color: '#7c3aed', light: '#faf5ff', badge: '#ede9fe', text: '#6d28d9', symbol: '🚀', motto: 'Semper Supra' },
  'Coast Guard':  { color: '#d97706', light: '#fffbeb', badge: '#fef3c7', text: '#b45309', symbol: '⚓', motto: 'Semper Paratus' },
}

const DEFAULT_BRANCH = { color: '#2563eb', light: '#eff6ff', badge: '#dbeafe', text: '#1d4ed8', symbol: '🎖️', motto: 'Your transition starts here' }

export default function Sidebar({ isGuest = false, guestBranch = '', guestSepType = '' }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState(null)
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [timeProgress, setTimeProgress] = useState(0)

  useEffect(() => {
    const load = async () => {
      if (isGuest) {
        setProfile({ branch: guestBranch, separation_type: guestSepType })
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      if (!profileData) return
      setProfile(profileData)
      if (profileData.separation_date) {
        const today = new Date()
        const sepDate = new Date(profileData.separation_date)
        const created = new Date(profileData.created_at)
        const remaining = Math.ceil((sepDate - today) / (1000 * 60 * 60 * 24))
        const total = Math.ceil((sepDate - created) / (1000 * 60 * 60 * 24))
        setDaysRemaining(remaining)
        setTimeProgress(total > 0 ? Math.max(0, Math.round(((total - remaining) / total) * 100)) : 0)
      }
    }
    load()
  }, [isGuest, guestBranch, guestSepType])

  const branch = profile?.branch || ''
  const bc = BRANCH_CONFIG[branch] || DEFAULT_BRANCH

  const nav = (path) => {
    if (isGuest) {
      if (path === '/settings') { alert('Sign in to access settings.'); return }
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      router.push(`${path}?${params.toString()}`)
    } else {
      router.push(path)
    }
  }

  const navItems = [
    { label: 'Dashboard',      icon: '⊞',  path: '/dashboard' },
    { label: 'Checklist',      icon: '✅', path: '/checklist' },
    { label: 'SkillBridge',    icon: '🗺️', path: '/skillbridge' },
    { label: 'Certifications', icon: '📜', path: '/certifications' },
    { label: 'Calculators',    icon: '💰', path: '/calculators' },
    { label: 'Documents',      icon: '🗄️', path: '/documents' },
  ]

  const isActive = (path) => pathname === path

  // Header area is approximately 110px (3px strip + logo/branch block + divider).
  // Countdown widget is approximately 100px when visible.
  // Nav gets everything in between, with overflowY: auto to scroll if needed.
  const countdownHeight = (!isGuest && daysRemaining !== null) ? 116 : 0
  const headerHeight = 110

  return (
    <div style={{
      width: '220px',
      height: '100vh',
      backgroundColor: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 100,
      overflow: 'hidden',
    }}>

      {/* Branch color strip */}
      <div style={{ height: '3px', backgroundColor: bc.color, flexShrink: 0 }} />

      {/* Logo + branch tag */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: bc.color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px'
          }}>🎖️</div>
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#111', letterSpacing: '-0.3px' }}>MilSep</span>
        </div>
        {branch && (
          <>
            <div style={{
              backgroundColor: bc.badge, borderRadius: '6px', padding: '4px 10px',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              <span style={{ fontSize: '12px' }}>{bc.symbol}</span>
              <span style={{ color: bc.text, fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>
                {branch.toUpperCase()}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '10px', margin: '4px 0 0', fontStyle: 'italic' }}>{bc.motto}</p>
          </>
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0 16px', flexShrink: 0 }} />

      {/* Nav — scrollable, takes all remaining space above the countdown */}
      <nav style={{
        padding: '8px',
        overflowY: 'auto',
        overflowX: 'hidden',
        flex: 1,
        // Ensure the nav never grows taller than the available space so the
        // countdown widget is never pushed off-screen.
        minHeight: 0,
      }}>
        {navItems.map(item => (
          <div
            key={item.path}
            onClick={() => nav(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
              backgroundColor: isActive(item.path) ? bc.light : 'transparent',
              borderLeft: isActive(item.path) ? `3px solid ${bc.color}` : '3px solid transparent',
              color: isActive(item.path) ? bc.text : '#6b7280',
              fontWeight: isActive(item.path) ? '600' : '400', fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '14px' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        {/* Content section */}
        <div style={{
          color: '#9ca3af', fontSize: '10px', fontWeight: '600',
          letterSpacing: '0.8px', padding: '8px 10px 4px', textTransform: 'uppercase'
        }}>Content</div>
        <div
          onClick={() => nav('/blog')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
            borderRadius: '6px', cursor: 'pointer', marginBottom: '2px',
            backgroundColor: isActive('/blog') ? bc.light : 'transparent',
            borderLeft: isActive('/blog') ? `3px solid ${bc.color}` : '3px solid transparent',
            color: isActive('/blog') ? bc.text : '#6b7280',
            fontWeight: isActive('/blog') ? '600' : '400', fontSize: '13px',
          }}
        >
          <span>📰</span> Blog
        </div>

        {/* Account section */}
        <div style={{
          color: '#9ca3af', fontSize: '10px', fontWeight: '600',
          letterSpacing: '0.8px', padding: '12px 10px 4px', textTransform: 'uppercase'
        }}>Account</div>
        <div
          onClick={() => nav('/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
            borderRadius: '6px', cursor: 'pointer',
            backgroundColor: isActive('/settings') ? bc.light : 'transparent',
            borderLeft: isActive('/settings') ? `3px solid ${bc.color}` : '3px solid transparent',
            color: isActive('/settings') ? bc.text : '#6b7280',
            fontWeight: isActive('/settings') ? '600' : '400', fontSize: '13px',
            opacity: isGuest ? 0.4 : 1,
          }}
        >
          <span>⚙️</span> Settings
        </div>
      </nav>

      {/* Separation countdown — pinned to bottom, never scrolls away */}
      {!isGuest && daysRemaining !== null && (
        <div style={{
          margin: '0 12px 16px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <p style={{
            color: '#9ca3af', fontSize: '10px', fontWeight: '600',
            letterSpacing: '0.6px', margin: '0 0 4px', textTransform: 'uppercase'
          }}>Days to Separation</p>
          <p style={{ color: bc.color, fontSize: '28px', fontWeight: '700', margin: '0 0 6px', letterSpacing: '-1px' }}>
            {daysRemaining}
          </p>
          <div style={{ height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timeProgress}%`, backgroundColor: bc.color, borderRadius: '2px' }} />
          </div>
          <p style={{ color: '#9ca3af', fontSize: '10px', margin: '4px 0 0' }}>{timeProgress}% elapsed</p>
        </div>
      )}

    </div>
  )
}
