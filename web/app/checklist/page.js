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
 const [customTask, setCustomTask] = useState('')
  const [customDueDate, setCustomDueDate] = useState('')
  const [customCategory, setCustomCategory] = useState('Personal')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  const categories = ['All', 'Medical', 'Finance', 'Housing', 'Legal', 'Career', 'Personal']

  useEffect(() => {
    const loadData = async () => {
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
      progressData?.forEach(p => {
        completedMap[p.checklist_item_id] = p.completed
      })

      setItems([
        ...(checklistItems || []),
        ...(customItems || []).map(t => ({ ...t, isCustom: true }))
      ])
      setCompleted(completedMap)
      setLoading(false)
    }

    loadData()
  }, [])

const toggleItem = async (itemId, isCustom) => {
    const newValue = !completed[itemId]
    setCompleted(prev => ({ ...prev, [itemId]: newValue }))

    if (isCustom) {
      const { error } = await supabase
        .from('user_custom_tasks')
        .update({ completed: newValue })
        .eq('id', itemId)
      if (error) console.log('Custom task error:', error.message)
    } else {
      const { error } = await supabase
        .from('user_checklist_progress')
        .upsert({
          user_id: user.id,
          checklist_item_id: itemId,
          completed: newValue
        }, {
          onConflict: 'user_id,checklist_item_id'
        })
      if (error) console.log('Progress save error:', error.message)
    }
  }

  const addCustomTask = async () => {
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

    if (error) {
      console.log('Error adding task:', error.message)
      alert('Something went wrong: ' + error.message)
      return
    }

    if (data) {
      setItems(prev => [...prev, { ...data, isCustom: true }])
      setCustomTask('')
      setCustomDueDate('')
      setCustomCategory('Personal')
      setShowCustomInput(false)
    }
  }
  const filteredItems = filter === 'All'
    ? items
    : items.filter(item => item.category === filter)

  const completedCount = Object.values(completed).filter(Boolean).length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      backgroundColor: '#0a1628', color: 'white',
      fontFamily: 'sans-serif'
    }}>
      Loading checklist...
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={backButtonStyle}
        >
          ← Dashboard
        </button>
        <h1 style={{ fontSize: '1.5rem' }}>My Separation Checklist</h1>
      </div>

      {/* Progress Bar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#8899aa', fontSize: '0.85rem' }}>Overall Progress</span>
          <span style={{ fontWeight: 'bold' }}>{progressPct}%</span>
        </div>
        <div style={progressTrackStyle}>
          <div style={{
            ...progressBarStyle,
            width: `${progressPct}%`,
            backgroundColor: '#22c55e'
          }} />
        </div>
        <p style={{ color: '#445566', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: filter === cat ? '#2563eb' : '#1e3a5f',
              backgroundColor: filter === cat ? '#2563eb' : 'transparent',
              color: 'white',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ color: '#445566', textAlign: 'center', padding: '2rem' }}>
            {filter === 'All'
              ? 'No checklist items yet. Add a custom task below!'
              : `No items in the ${filter} category yet.`}
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id, item.isCustom)}
              style={{
                ...cardStyle,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                cursor: 'pointer',
                opacity: completed[item.id] ? 0.6 : 1,
                borderColor: completed[item.id] ? '#22c55e' : '#1e3a5f'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: completed[item.id] ? '#22c55e' : '#445566',
                backgroundColor: completed[item.id] ? '#22c55e' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem'
              }}>
                {completed[item.id] ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: 0,
                  fontWeight: '500',
                  textDecoration: completed[item.id] ? 'line-through' : 'none'
                }}>
                  {item.title}
                  {item.isCustom && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.7rem',
                      backgroundColor: '#1e3a5f',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      color: '#8899aa'
                    }}>
                      custom
                    </span>
                  )}
                </p>
                {item.description && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#8899aa' }}>
                    {item.description}
                  </p>
                )}
                {item.days_before_separation && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#445566' }}>
                    Recommended: {item.days_before_separation} days before separation
                  </p>
                )}
                {item.due_date && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#445566' }}>
                    Due: {new Date(item.due_date).toLocaleDateString()}
                  </p>
                )}
                {item.category && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '0.7rem',
                    backgroundColor: '#0f2035',
                    border: '1px solid #1e3a5f',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    color: '#8899aa'
                  }}>
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Task */}
      <div style={cardStyle}>
        {showCustomInput ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
 <input
              value={customTask}
              onChange={e => setCustomTask(e.target.value)}
              placeholder="Enter your custom task..."
              onKeyDown={e => e.key === 'Enter' && addCustomTask()}
              style={inputStyle}
              autoFocus
            />
            <select
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              style={inputStyle}
            >
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div>
              <label style={{ color: '#8899aa', fontSize: '0.85rem' }}>
                Due Date (optional)
              </label>
              <input
                type="date"
                value={customDueDate}
                onChange={e => setCustomDueDate(e.target.value)}
                style={{ ...inputStyle, marginTop: '0.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={addCustomTask} style={primaryButtonStyle}>
                Add Task
              </button>
              <button
                onClick={() => { setShowCustomInput(false); setCustomTask('') }}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            style={secondaryButtonStyle}
          >
            + Add Custom Task
          </button>
        )}
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

const backButtonStyle = {
  backgroundColor: 'transparent',
  color: '#8899aa',
  border: '1px solid #1e3a5f',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  cursor: 'pointer'
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #1e3a5f',
  backgroundColor: '#0a1628',
  color: 'white',
  fontSize: '1rem',
  boxSizing: 'border-box'
}

const primaryButtonStyle = {
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  cursor: 'pointer'
}

const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  color: '#8899aa',
  border: '1px solid #1e3a5f',
  padding: '10px 20px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  width: '100%'
}