'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function BlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const categories = ['All', 'Transition', 'Finance', 'Career', 'Mental Health', 'Community']

  useEffect(() => {
    const loadPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
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
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      backgroundColor: '#0a1628', color: 'white',
      fontFamily: 'sans-serif'
    }}>
      Loading posts...
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
<button onClick={() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') {
    router.push(`/dashboard?${params.toString()}`)
  } else {
    router.push('/dashboard')
  }
}} style={backButtonStyle}>
  ← Dashboard
</button>
        <h1 style={{ fontSize: '1.5rem' }}>Blog & Interviews</h1>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search posts..."
        style={{ ...inputStyle, marginBottom: '1rem' }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
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

      {filteredPosts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#0f2035',
          borderRadius: '12px',
          border: '1px solid #1e3a5f'
        }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✍️</p>
          <p style={{ color: '#8899aa', marginBottom: '0.5rem' }}>
            {search || filter !== 'All' ? 'No posts match your search.' : 'No posts yet — check back soon!'}
          </p>
          <p style={{ color: '#445566', fontSize: '0.85rem' }}>
            We're working on articles to help you navigate your transition.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredPosts.map(post => (
            <div
              key={post.id}
              onClick={() => router.push(`/blog/${post.slug}`)}
              style={{
                backgroundColor: '#0f2035',
                border: '1px solid #1e3a5f',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer'
              }}
            >
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}
                />
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {post.category && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#2563eb22',
                    border: '1px solid #2563eb',
                    color: '#2563eb'
                  }}>
                    {post.category}
                  </span>
                )}
                {post.read_time && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#1e3a5f',
                    color: '#8899aa'
                  }}>
                    {post.read_time} min read
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                {post.title}
              </h2>
              {post.excerpt && (
                <p style={{ color: '#8899aa', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                  {post.excerpt}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#445566', fontSize: '0.8rem' }}>
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </span>
                <span style={{ color: '#2563eb', fontSize: '0.85rem' }}>Read more →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
  backgroundColor: '#0f2035',
  color: 'white',
  fontSize: '1rem',
  boxSizing: 'border-box'
}