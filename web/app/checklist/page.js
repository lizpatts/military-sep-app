'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ChecklistPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [completed, setCompleted] = useState({})
  const [hidden, setHidden] = useState({})
  const [showHidden, setShowHidden] = useState(false)
  const [customTask, setCustomTask] = useState('')
  const [customDueDate, setCustomDueDate] = useState('')
  const [customCategory, setCustomCategory] = useState('Personal')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [guestParams, setGuestParams] = useState('')

  const categories = ['All', 'Medical', 'Finance', 'Housing', 'Legal', 'Career', 'Personal']
  const [showAllItems, setShowAllItems] = useState(false)
  const [isUnderOneYear, setIsUnderOneYear] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search)
      const guestMode = params.get('guest') === 'true'
      const branch = params.get('branch') || ''
      const sepType = params.get('separation_type') || ''
      setIsGuest(guestMode)
      setGuestParams(`guest=true&branch=${encodeURIComponent(branch)}&separation_type=${encodeURIComponent(sepType)}`)

      if (guestMode) {
        // Guest: just load the checklist items read-only
        const { data: checklistItems } = await supabase
          .from('checklist_items')
          .select('*')
          .order('days_before_separation', { ascending: false })
        setItems(checklistItems || [])
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      if (profileData?.separation_date) {
        const daysLeft = Math.ceil((new Date(profileData.separation_date) - new Date()) / (1000 * 60 * 60 * 24))
        setIsUnderOneYear(daysLeft <= 365 && daysLeft > 0)
      }

      const { data: checklistItems } = await supabase
        .from('checklist_items')
        .select('*')
        .order('days_before_separation', { ascending: false })

      const { data: customItems } = await supabase
        .from('user_custom_tasks')
        .select('*')
        .eq('user_id', session.user.id)

      const { data: progressData } = await supabase
        .from('user_checklist_progress')
        .select('*')
        .eq('user_id', session.user.id)

      const completedMap = {}
      const hiddenMap = {}
      progressData?.forEach(p => {
        completedMap[p.checklist_item_id] = p.completed === true
        hiddenMap[p.checklist_item_id] = p.hidden === true
      })

      setItems([
        ...(checklistItems || []),
        ...(customItems || []).map(t => ({ ...t, isCustom: true }))
      ])
      setCompleted(completedMap)
      setHidden(hiddenMap)
      setLoading(false)
    }

    loadData()
  }, [])

  const toggleItem = async (itemId, isCustom) => {
    if (isGuest) return
    const newValue = !(completed[itemId] === true)
    setCompleted(prev => ({ ...prev, [itemId]: newValue }))

    if (isCustom) {
      await supabase.from('user_custom_tasks').update({ completed: newValue }).eq('id', itemId)
    } else {
      await supabase.from('user_checklist_progress').upsert({
        user_id: user.id,
        checklist_item_id: itemId,
        completed: newValue,
        hidden: hidden[itemId] === true
      }, { onConflict: 'user_id,checklist_item_id' })
    }
  }

  const hideItem = async (itemId) => {
    if (isGuest) return
    setHidden(prev => ({ ...prev, [itemId]: true }))
    await supabase.from('user_checklist_progress').upsert({
      user_id: user.id,
      checklist_item_id: itemId,
      hidden: true,
      completed: completed[itemId] === true
    }, { onConflict: 'user_id,checklist_item_id' })
  }

  const restoreItem = async (itemId) => {
    if (isGuest) return
    setHidden(prev => ({ ...prev, [itemId]: false }))
    await supabase.from('user_checklist_progress').upsert({
      user_id: user.id,
      checklist_item_id: itemId,
      hidden: false,
      completed: completed[itemId] === true
    }, { onConflict: 'user_id,checklist_item_id' })
  }

  const deleteCustomTask = async (taskId) => {
    if (isGuest) return
    if (!confirm('Delete this custom task?')) return
    setItems(prev => prev.filter(item => item.id !== taskId))
    await supabase.from('user_custom_tasks').delete().eq('id', taskId)
  }

  const addCustomTask = async () => {
    if (isGuest) return
    if (!customTask.trim()) return
    const { data, error } = await supabase
      .from('user_custom_tasks')
      .insert({
        user_id: user.id,
        title: customTask.trim(),
        category: customCategory || 'Personal',
        due_date: customDueDate || null,
        completed: false
      })
      .select()
      .single()

    if (error) { alert('Something went wrong: ' + error.message); return }
    if (data) {
      setItems(prev => [...prev, { ...data, isCustom: true }])
      setCustomTask('')
      setCustomDueDate('')
      setCustomCategory('Personal')
      setShowCustomInput(false)
    }
  }

  const filteredItems = items.filter(item => {
    const isHidden = hidden[item.id] === true
    if (isHidden && !showHidden) return false
    if (filter !== 'All' && item.category !== filter) return false
    if (isUnderOneYear && !showAllItems && !item.isCustom) {
      if (item.priority !== 'high' && item.priority !== 'critical') return false
    }
    return true
  })

  const highPriorityItems = items.filter(i => !i.isCustom && (i.priority === 'high' || i.priority === 'critical'))
  const allHighPriorityDone = highPriorityItems.length > 0 && highPriorityItems.every(i => completed[i.id] === true)
  const hiddenCount = items.filter(item => hidden[item.id] === true).length
  const activeItems = items.filter(item => {
    const isHidden = hidden[item.id] === true
    const isCompleted = completed[item.id] === true
    if (isHidden && !isCompleted) return false
    return true
  })
  const completedCount = activeItems.filter(item => completed[item.id] === true).length
  const totalCount = activeItems.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0a1628', color: 'white', fontFamily: 'sans-serif' }}>
      Loading checklist...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a1628', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>

      {/* Guest banner */}
      {isGuest && (
        <div style={{
          backgroundColor: '#2563eb11', border: '1px solid #2563eb',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>👋</span>
            <div>
              <p style={{ margin: 0, fontWeight: '500', color: '#2563eb' }}>You're browsing as a guest — read only</p>
              <p style={{ margin: 0, color: '#8899aa', fontSize: '0.8rem' }}>Sign in to check off tasks, mute items, and track your progress.</p>
            </div>
          </div>
          <button onClick={() => router.push('/login')}
            style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
            Sign In →
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') {
    router.push(`/dashboard?${params.toString()}`)
  } else {
    router.push('/dashboard')
  }
}}
          style={backButtonStyle}>
          ← Dashboard
        </button>
        <h1 style={{ fontSize: '1.5rem' }}>My Separation Checklist</h1>
      </div>

      {/* Progress — hidden for guests */}
      {!isGuest && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#8899aa', fontSize: '0.85rem' }}>Overall Progress</span>
            <span style={{ fontWeight: 'bold' }}>{progressPct}%</span>
          </div>
          <div style={progressTrackStyle}>
            <div style={{ ...progressBarStyle, width: `${progressPct}%`, backgroundColor: '#22c55e' }} />
          </div>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: '6px 14px', borderRadius: '20px', border: '1px solid',
            borderColor: filter === cat ? '#2563eb' : '#1e3a5f',
            backgroundColor: filter === cat ? '#2563eb' : 'transparent',
            color: 'white', fontSize: '0.85rem', cursor: 'pointer'
          }}>
            {cat}
          </button>
        ))}
      </div>

      {isUnderOneYear && !isGuest && (
        <div style={{ backgroundColor: '#f59e0b11', border: '1px solid #f59e0b', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 4px', color: '#f59e0b', fontWeight: '500', fontSize: '0.9rem' }}>
            ⏰ Crunch time mode — showing high priority items only
          </p>
          <p style={{ margin: 0, color: '#8899aa', fontSize: '0.8rem' }}>
            These are the most important tasks to complete before your separation date.
          </p>
          {allHighPriorityDone && (
            <button onClick={() => setShowAllItems(!showAllItems)} style={{
              marginTop: '0.75rem', backgroundColor: 'transparent',
              border: '1px solid #22c55e', color: '#22c55e',
              borderRadius: '6px', padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer'
            }}>
              {showAllItems ? 'Show high priority only' : '✓ All high priority done — show remaining tasks'}
            </button>
          )}
        </div>
      )}

      {hiddenCount > 0 && !isGuest && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => setShowHidden(!showHidden)} style={{
            backgroundColor: 'transparent', border: '1px solid #1e3a5f',
            color: '#445566', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer'
          }}>
            {showHidden ? '🔇 Hide muted items' : `🔇 Show ${hiddenCount} muted item${hiddenCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ color: '#445566', textAlign: 'center', padding: '2rem' }}>
            {filter === 'All' ? 'No checklist items yet.' : `No items in the ${filter} category.`}
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} style={{
              ...cardStyle, display: 'flex', alignItems: 'flex-start', gap: '1rem',
              opacity: hidden[item.id] === true ? 0.4 : completed[item.id] === true ? 0.7 : 1,
              borderColor: completed[item.id] === true ? '#22c55e' : '#1e3a5f'
            }}>
              <div
                onClick={() => !isGuest && toggleItem(item.id, item.isCustom)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', border: '2px solid',
                  borderColor: completed[item.id] === true ? '#22c55e' : '#445566',
                  backgroundColor: completed[item.id] === true ? '#22c55e' : 'transparent',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem',
                  cursor: isGuest ? 'not-allowed' : 'pointer', marginTop: '2px'
                }}
              >
                {completed[item.id] === true ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '500', textDecoration: completed[item.id] === true ? 'line-through' : 'none' }}>
                  {item.title}
                  {item.isCustom && <span style={{ marginLeft: '8px', fontSize: '0.7rem', backgroundColor: '#1e3a5f', padding: '2px 8px', borderRadius: '10px', color: '#8899aa' }}>custom</span>}
                  {hidden[item.id] === true && <span style={{ marginLeft: '8px', fontSize: '0.7rem', backgroundColor: '#1e3a5f', padding: '2px 8px', borderRadius: '10px', color: '#445566' }}>muted</span>}
                </p>
                {item.description && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#8899aa' }}>{item.description}</p>}
                {item.days_before_separation && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#445566' }}>Recommended: {item.days_before_separation} days before separation</p>}
                {item.due_date && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#445566' }}>Due: {new Date(item.due_date).toLocaleDateString()}</p>}
                {item.category && (
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.7rem', backgroundColor: '#0f2035', border: '1px solid #1e3a5f', padding: '2px 8px', borderRadius: '10px', color: '#8899aa' }}>
                    {item.category}
                  </span>
                )}

                {/* Action buttons — hidden for guests */}
                {!isGuest && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => toggleItem(item.id, item.isCustom)} style={{
                      backgroundColor: completed[item.id] === true ? '#22c55e22' : 'transparent',
                      border: '1px solid', borderColor: completed[item.id] === true ? '#22c55e' : '#1e3a5f',
                      color: completed[item.id] === true ? '#22c55e' : '#8899aa',
                      borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer'
                    }}>
                      {completed[item.id] === true ? '✓ Done' : 'Mark Done'}
                    </button>
                    {!item.isCustom && hidden[item.id] !== true && (
                      <button onClick={() => hideItem(item.id)} style={{ backgroundColor: 'transparent', border: '1px solid #1e3a5f', color: '#445566', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>Mute</button>
                    )}
                    {!item.isCustom && hidden[item.id] === true && (
                      <button onClick={() => restoreItem(item.id)} style={{ backgroundColor: 'transparent', border: '1px solid #1e3a5f', color: '#8899aa', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>Restore</button>
                    )}
                    {item.isCustom && (
                      <button onClick={() => deleteCustomTask(item.id)} style={{ backgroundColor: 'transparent', border: '1px solid #ef444455', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add custom task — hidden for guests */}
      {!isGuest && (
        <div style={cardStyle}>
          {showCustomInput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input value={customTask} onChange={e => setCustomTask(e.target.value)} placeholder="Enter your custom task..."
                onKeyDown={e => e.key === 'Enter' && addCustomTask()} style={inputStyle} autoFocus />
              <select value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={inputStyle}>
                {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div>
                <label style={{ color: '#8899aa', fontSize: '0.85rem' }}>Due Date (optional)</label>
                <input type="date" value={customDueDate} onChange={e => setCustomDueDate(e.target.value)} style={{ ...inputStyle, marginTop: '0.25rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={addCustomTask} style={primaryButtonStyle}>Add Task</button>
                <button onClick={() => { setShowCustomInput(false); setCustomTask('') }} style={secondaryButtonStyle}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCustomInput(true)} style={secondaryButtonStyle}>+ Add Custom Task</button>
          )}
        </div>
      )}

      {/* Sign in prompt for guests at bottom */}
      {isGuest && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#445566' }}>
          <p style={{ marginBottom: '1rem' }}>Want to check off tasks and track your progress?</p>
          <button onClick={() => router.push('/login')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
            Sign In to Save Progress →
          </button>
        </div>
      )}
    </div>
  )
}

const cardStyle = { backgroundColor: '#0f2035', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '1.25rem' }
const progressTrackStyle = { width: '100%', height: '8px', backgroundColor: '#1e3a5f', borderRadius: '4px', overflow: 'hidden' }
const progressBarStyle = { height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }
const backButtonStyle = { backgroundColor: 'transparent', color: '#8899aa', border: '1px solid #1e3a5f', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1e3a5f', backgroundColor: '#0a1628', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }
const primaryButtonStyle = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer' }
const secondaryButtonStyle = { backgroundColor: 'transparent', color: '#8899aa', border: '1px solid #1e3a5f', padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', width: '100%' }