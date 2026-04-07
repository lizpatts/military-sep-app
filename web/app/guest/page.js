'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BRANCH_CONFIG = {
  'Army':         { color: '#16a34a', symbol: '⚔️', motto: 'This We\'ll Defend' },
  'Navy':         { color: '#1d4ed8', symbol: '⚓', motto: 'Forged by the Sea' },
  'Air Force':    { color: '#0891b2', symbol: '✈️', motto: 'Aim High' },
  'Marine Corps': { color: '#dc2626', symbol: '🦅', motto: 'Semper Fidelis' },
  'Space Force':  { color: '#7c3aed', symbol: '🚀', motto: 'Semper Supra' },
  'Coast Guard':  { color: '#d97706', symbol: '⚓', motto: 'Semper Paratus' },
}

export default function GuestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ branch: '', separation_type: '' })

  const branches = ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard']
  const separationTypes = [
    'ETS / End of Service', 'Retirement (20+ years)',
    'Medical Separation', 'Early Release', 'Other'
  ]

  const handleContinue = () => {
    if (!formData.branch || !formData.separation_type) {
      alert('Please select your branch and separation type to continue.')
      return
    }
    router.push(`/dashboard?guest=true&branch=${encodeURIComponent(formData.branch)}&separation_type=${encodeURIComponent(formData.separation_type)}`)
  }

  const selectedBranch = BRANCH_CONFIG[formData.branch]
  const accentColor = selectedBranch?.color || '#2563eb'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>

      {/* Left panel */}
      <div style={{ flex: 1, backgroundColor: accentColor, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'white', transition: 'background-color 0.4s ease' }}>
        <div style={{ maxWidth: '380px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {selectedBranch ? selectedBranch.symbol : '👋'}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.4px', margin: '0 0 12px' }}>
            {selectedBranch ? formData.branch : 'Browse as Guest'}
          </h1>
          {selectedBranch && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontStyle: 'italic', margin: '0 0 24px' }}>
              "{selectedBranch.motto}"
            </p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 32px' }}>
            {!selectedBranch
              ? 'Explore your separation checklist, SkillBridge opportunities, certifications, and more — no account required.'
              : 'You\'ll be able to browse all resources in read-only mode. Sign up anytime to save your progress.'}
          </p>

          {/* Feature preview */}
          {[
            { icon: '✅', text: 'Browse the separation checklist' },
            { icon: '🗺️', text: 'Explore SkillBridge opportunities' },
            { icon: '💰', text: 'Use financial calculators' },
            { icon: '📜', text: 'Browse certifications' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', textAlign: 'left' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '480px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>

          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
            Quick setup
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 28px' }}>
            Select your branch and separation type to get a personalized view.
          </p>

          {/* Branch selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Branch of Service</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {branches.map(b => {
                const bc = BRANCH_CONFIG[b]
                const isSelected = formData.branch === b
                return (
                  <button key={b} onClick={() => setFormData(prev => ({ ...prev, branch: b }))}
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
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Separation Type</label>
            <select value={formData.separation_type} onChange={e => setFormData(prev => ({ ...prev, separation_type: e.target.value }))}
              style={inputStyle}>
              <option value="">Select type</option>
              {separationTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Continue button */}
          <button onClick={handleContinue} style={{
            width: '100%', backgroundColor: accentColor, color: 'white',
            border: 'none', padding: '13px', borderRadius: '8px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            marginBottom: '12px', transition: 'background-color 0.3s'
          }}>
            Browse as Guest →
          </button>

          <button onClick={() => router.push('/login')} style={{
            width: '100%', backgroundColor: '#f9fafb', color: '#6b7280',
            border: '1px solid #e5e7eb', padding: '13px', borderRadius: '8px',
            fontSize: '14px', cursor: 'pointer', marginBottom: '24px'
          }}>
            ← Back to Sign In
          </button>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px' }}>
            <p style={{ color: '#92400e', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
              ⚠️ Guest mode is read-only. Your progress won't be saved. Sign up anytime to save your checklist, favorites, and VA scenarios.
            </p>
          </div>

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