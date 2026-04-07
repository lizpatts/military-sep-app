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

  const categories = ['All', 'Transition', 'Finance', 'Career', 'Mental Health', 'Community']

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsGuest(params.get('guest') === 'true')

    const loadPosts = async () => {
      const { data } = await supabase
        .from('blog_posts').select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    loadPosts()
  }, [])

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filter === 'All' || post.category === filter
    const matchesSearch = search === '' ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}</span>
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
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                We are working on articles to help you navigate your transition.
              </p>
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
                    <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '8px', lineHeight: '1.4', margin: '0 0 8px' }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '14px', lineHeight: '1.6', margin: '0 0 14px' }}>
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
    </div>
  )
}