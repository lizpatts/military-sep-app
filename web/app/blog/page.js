'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

export default function BlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [submissionType, setSubmissionType] = useState('post_idea')
  const [form, setForm] = useState({ title: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const categories = ['All', 'Transition', 'Finance', 'Career', 'Mental Health', 'Community']

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsGuest(params.get('guest') === 'true')

    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(profileData)
      }

      const { data } = await supabase
        .from('blog_posts').select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filter === 'All' || post.category === filter
    const matchesSearch = search === '' ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleOpenModal = () => {
    if (isGuest) { alert('Sign in to submit a post idea or interview request.'); return }
    setForm({ title: '', description: '' })
    setSubmitMessage(null)
    setSubmissionType('post_idea')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { setSubmitMessage({ type: 'error', text: 'Please add a title.' }); return }
    if (!form.description.trim()) { setSubmitMessage({ type: 'error', text: 'Please add a description.' }); return }
    if (!user) { setSubmitMessage({ type: 'error', text: 'You must be signed in to submit.' }); return }

    setSubmitting(true)
    setSubmitMessage(null)

    const { error } = await supabase.from('blog_submissions').insert({
      user_id: user.id,
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      branch: profile?.branch || '',
      submission_type: submissionType,
      title: form.title.trim(),
      description: form.description.trim(),
      status: 'pending'
    })

    if (error) {
      setSubmitMessage({ type: 'error', text: 'Submission failed: ' + error.message })
      setSubmitting(false)
      return
    }

    setSubmitMessage({ type: 'success', text: '✅ Submitted! We\'ll review it and reach out soon.' })
    setSubmitting(false)
    setForm({ title: '', description: '' })
    setTimeout(() => setShowModal(false), 2000)
  }

  const submissionTypes = [
    { value: 'post_idea', label: '💡 Submit a Post Idea', description: 'Have a topic you want us to cover?' },
    { value: 'volunteer_interview', label: '🎙️ Volunteer for an Interview', description: 'Share your transition story with others' },

  ]

  const getTitlePlaceholder = () => {
    if (submissionType === 'post_idea') return 'e.g. How to negotiate your first civilian salary'
    return 'e.g. Army Infantry → Software Engineer at Google'

  }

  const getDescriptionPlaceholder = () => {
    if (submissionType === 'post_idea') return 'What should the post cover? Why would it help transitioning service members?'
    return 'Tell us a bit about your transition — branch, MOS/rate, what you do now, and what you wish you knew.'

  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      Loading posts...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar isGuest={isGuest}
        guestBranch={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('branch') || '' : ''}
        guestSepType={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('separation_type') || '' : ''}
      />

      <div style={{ marginLeft: '220px', flex: 1 }}>
        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>Blog & Interviews</h1>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Stories, advice, and interviews from veterans who've made the transition</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}</span>
            <button onClick={handleOpenModal} style={{
              backgroundColor: '#2563eb', color: 'white', border: 'none',
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer'
            }}>
              ✍️ Share Your Story
            </button>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#111', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px', outline: 'none' }}
          />

          {/* Category filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filter === cat ? '#2563eb' : '#e5e7eb',
                backgroundColor: filter === cat ? '#2563eb' : '#fff',
                color: filter === cat ? '#fff' : '#6b7280',
                fontSize: '13px', cursor: 'pointer', fontWeight: filter === cat ? '600' : '400'
              }}>{cat}</button>
            ))}
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✍️</p>
              <p style={{ color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
                {search || filter !== 'All' ? 'No posts match your search.' : 'No posts yet — check back soon!'}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 20px' }}>
                We are working on articles to help you navigate your transition.
              </p>
              <button onClick={handleOpenModal} style={{
                backgroundColor: '#2563eb', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}>
                ✍️ Share Your Story
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {filteredPosts.map(post => (
                <div key={post.id} onClick={() => router.push(`/blog/${post.slug}`)}
                  style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt={post.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {post.category && (
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: '600' }}>
                          {post.category}
                        </span>
                      )}
                      {post.read_time && (
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                          {post.read_time} min read
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111', margin: '0 0 8px', lineHeight: '1.4' }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 14px', lineHeight: '1.6' }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </span>
                      <span style={{ color: '#2563eb', fontSize: '13px', fontWeight: '500' }}>Read more →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submission modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0 }}>Share Your Story</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px' }}>
              Help fellow service members by contributing to the MilSep community.
            </p>

            {/* Submission type selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>What would you like to do?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {submissionTypes.map(type => (
                  <div key={type.value} onClick={() => setSubmissionType(type.value)}
                    style={{
                      padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: `2px solid ${submissionType === type.value ? '#2563eb' : '#e5e7eb'}`,
                      backgroundColor: submissionType === type.value ? '#eff6ff' : '#fff',
                    }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: submissionType === type.value ? '#1d4ed8' : '#111' }}>{type.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Title</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={getTitlePlaceholder()}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Details</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={getDescriptionPlaceholder()}
                rows={4}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Message */}
            {submitMessage && (
              <div style={{
                backgroundColor: submitMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${submitMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
                color: submitMessage.type === 'success' ? '#15803d' : '#dc2626',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px'
              }}>
                {submitMessage.text}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}