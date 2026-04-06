'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

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
  const [showAllItems, setShowAllItems] = useState(false)
  const [isUnderOneYear, setIsUnderOneYear] = useState(false)

  const categories = ['All', 'Medical', 'Finance', 'Housing', 'Legal', 'Career', 'Personal']

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search)
      const guestMode = params.get('guest') === 'true'
      setIsGuest(guestMode)

      if (guestMode) {
        const { data: checklistItems } = await supabase
          .from('checklist_items').select('*')
          .order('days_before_separation', { ascending: false })
        setItems(checklistItems || [])
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(profileData)

      if (profileData?.separation_date) {
        const daysLeft = Math.ceil((new Date(profileData.separation_date) - new Date()) / (1000 * 60 * 60 * 24))
        setIsUnderOneYear(daysLeft <= 365 && daysLeft > 0)
      }

      const { data: checklistItems } = await supabase
        .from('checklist_items').select('*')
        .order('days_before_separation', { ascending: false })
      const { data: customItems } = await supabase
        .from('user_custom_tasks').select('*').eq('user_id', session.user.id)
      const { data: progressData } = await supabase
        .from('user_checklist_progress').select('*').eq('user_id', session.user.id)

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
        user_id: user.id, checklist_item_id: itemId,
        completed: newValue, hidden: hidden[itemId] === true
      }, { onConflict: 'user_id,checklist_item_id' })
    }
  }

  const hideItem = async (itemId) => {
    if (isGuest) return
    setHidden(prev => ({ ...prev, [itemId]: true }))
    await supabase.from('user_checklist_progress').upsert({
      user_id: user.id, checklist_item_id: itemId,
      hidden: true, completed: completed[itemId] === true
    }, { onConflict: 'user_id,checklist_item_id' })
  }

  const restoreItem = async (itemId) => {
    if (isGuest) return
    setHidden(prev => ({ ...prev, [itemId]: false }))
    await supabase.from('user_checklist_progress').upsert({
      user_id: user.id, checklist_item_id: itemId,
      hidden: false, completed: completed[itemId] === true
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
      .insert({ user_id: user.id, title: customTask.trim(), category: customCategory || 'Personal', due_date: customDueDate || null, completed: false })
      .select().single()
    if (error) { alert('Something went wrong: ' + error.message); return }
    if (data) {
      setItems(prev => [...prev, { ...data, isCustom: true }])
      setCustomTask(''); setCustomDueDate(''); setCustomCategory('Personal'); setShowCustomInput(false)
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
  const activeItems = items.filter(item => !(hidden[item.id] === true && !(completed[item.id] === true)))
  const completedCount = activeItems.filter(item => completed[item.id] === true).length
  const totalCount = activeItems.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getPriorityColor = (priority) => {
    if (priority === 'critical') return '#ef4444'
    if (priority === 'high') return '#f59e0b'
    return '#e5e7eb'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      Loading checklist...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar isGuest={isGuest} guestBranch={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('branch') || ''} guestSepType={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('separation_type') || ''} />

      <div style={{ marginLeft: '220px', flex: 1 }}>
        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>My Separation Checklist</h1>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Track your transition tasks</p>
          </div>
          {!isGuest && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{completedCount}/{totalCount} done</span>
              <div style={{ width: '100px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#22c55e', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>{progressPct}%</span>
            </div>
          )}
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Guest banner */}
          {isGuest && (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👋</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#1d4ed8', fontSize: '13px' }}>Browsing as guest — read only</p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Sign in to check off tasks and track your progress.</p>
                </div>
              </div>
              <button onClick={() => router.push('/login')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Sign In →
              </button>
            </div>
          )}

          {/* Crunch time banner */}
          {isUnderOneYear && !isGuest && (
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 4px', color: '#92400e', fontWeight: '600', fontSize: '13px' }}>⏰ Crunch time — showing high priority items only</p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>These are the most important tasks before your separation date.</p>
              {allHighPriorityDone && (
                <button onClick={() => setShowAllItems(!showAllItems)} style={{ marginTop: '8px', background: 'transparent', border: '1px solid #22c55e', color: '#15803d', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>
                  {showAllItems ? 'Show high priority only' : '✓ All done — show remaining tasks'}
                </button>
              )}
            </div>
          )}

          {/* Progress card */}
          {!isGuest && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>Overall Progress</span>
                <span style={{ fontWeight: '700', color: '#22c55e', fontSize: '16px' }}>{progressPct}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#22c55e', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{completedCount} of {totalCount} tasks completed</p>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filter === cat ? '#2563eb' : '#e5e7eb',
                backgroundColor: filter === cat ? '#2563eb' : '#fff',
                color: filter === cat ? '#fff' : '#6b7280',
                fontSize: '0.85rem', cursor: 'pointer', fontWeight: filter === cat ? '600' : '400'
              }}>
                {cat}
              </button>
            ))}
            {hiddenCount > 0 && !isGuest && (
              <button onClick={() => setShowHidden(!showHidden)} style={{
                marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px',
                border: '1px solid #e5e7eb', backgroundColor: showHidden ? '#f3f4f6' : '#fff',
                color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer'
              }}>
                🔇 {showHidden ? 'Hide muted' : `${hiddenCount} muted`}
              </button>
            )}
          </div>

          {/* Checklist items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {filteredItems.length === 0 ? (
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>{filter === 'All' ? 'No checklist items yet.' : `No items in the ${filter} category.`}</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isDone = completed[item.id] === true
                const isMuted = hidden[item.id] === true
                const priorityColor = getPriorityColor(item.priority)
                return (
                  <div key={item.id} style={{
                    backgroundColor: '#fff', border: '1px solid #e5e7eb',
                    borderLeft: `4px solid ${isDone ? '#22c55e' : isMuted ? '#e5e7eb' : priorityColor}`,
                    borderRadius: '10px', padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    opacity: isMuted ? 0.5 : isDone ? 0.75 : 1,
                    transition: 'opacity 0.2s ease'
                  }}>
                    {/* Checkbox */}
                    <div onClick={() => !isGuest && toggleItem(item.id, item.isCustom)} style={{
                      width: '22px', height: '22px', borderRadius: '50%', border: '2px solid',
                      borderColor: isDone ? '#22c55e' : '#d1d5db',
                      backgroundColor: isDone ? '#22c55e' : '#fff',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: '#fff',
                      cursor: isGuest ? 'not-allowed' : 'pointer', marginTop: '1px'
                    }}>
                      {isDone ? '✓' : ''}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <p style={{ margin: 0, fontWeight: '500', fontSize: '14px', color: '#111', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {item.title}
                        </p>
                        {item.priority === 'critical' && !isDone && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#ef4444', fontWeight: '700' }}>CRITICAL</span>
                        )}
                        {item.priority === 'high' && !isDone && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', color: '#d97706', fontWeight: '700' }}>HIGH</span>
                        )}
                        {item.isCustom && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280' }}>custom</span>
                        )}
                        {isMuted && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#9ca3af' }}>muted</span>
                        )}
                      </div>

                      {item.description && <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#6b7280' }}>{item.description}</p>}

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {item.category && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>{item.category}</span>
                        )}
                        {item.days_before_separation && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Recommended {item.days_before_separation} days before separation</span>
                        )}
                        {item.due_date && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                        )}
                      </div>

                      {!isGuest && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <button onClick={() => toggleItem(item.id, item.isCustom)} style={{
                            backgroundColor: isDone ? '#f0fdf4' : '#f9fafb',
                            border: `1px solid ${isDone ? '#86efac' : '#e5e7eb'}`,
                            color: isDone ? '#15803d' : '#6b7280',
                            borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: isDone ? '600' : '400'
                          }}>
                            {isDone ? '✓ Done' : 'Mark Done'}
                          </button>
                          {!item.isCustom && !isMuted && (
                            <button onClick={() => hideItem(item.id)} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#9ca3af', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>Mute</button>
                          )}
                          {!item.isCustom && isMuted && (
                            <button onClick={() => restoreItem(item.id)} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>Restore</button>
                          )}
                          {item.isCustom && (
                            <button onClick={() => deleteCustomTask(item.id)} style={{ backgroundColor: '#fff', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Add custom task */}
          {!isGuest && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              {showCustomInput ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input value={customTask} onChange={e => setCustomTask(e.target.value)} placeholder="Enter your custom task..."
                    onKeyDown={e => e.key === 'Enter' && addCustomTask()} style={inputStyle} autoFocus />
                  <select value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={inputStyle}>
                    {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div>
                    <label style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Due Date (optional)</label>
                    <input type="date" value={customDueDate} onChange={e => setCustomDueDate(e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={addCustomTask} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>Add Task</button>
                    <button onClick={() => { setShowCustomInput(false); setCustomTask('') }} style={{ backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCustomInput(true)} style={{ backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
                  + Add Custom Task
                </button>
              )}
            </div>
          )}

          {/* Guest sign in prompt */}
          {isGuest && (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '14px' }}>Want to check off tasks and track your progress?</p>
              <button onClick={() => router.push('/login')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Sign In to Save Progress →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', boxSizing: 'border-box' }