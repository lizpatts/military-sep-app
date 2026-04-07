'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Sidebar from '../../components/Sidebar'

export default function BlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    setIsGuest(urlParams.get('guest') === 'true')

    const loadPost = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return }
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()
      if (!data) { setNotFound(true) } else { setPost(data) }
      setLoading(false)
    }
    loadPost()
  }, [slug])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      Loading post...
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar isGuest={isGuest}
        guestBranch={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('branch') || '' : ''}
        guestSepType={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('separation_type') || '' : ''}
      />
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '3rem' }}>✍️</p>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111', margin: 0 }}>Post not found</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>This post may have been removed or the link is incorrect.</p>
        <button onClick={() => router.push('/blog')} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
          ← Back to Blog
        </button>
      </div>
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
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/blog')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
            ← Blog
          </button>
          <span style={{ color: '#e5e7eb' }}>|</span>
          <span style={{ color: '#9ca3af', fontSize: '13px' }} >{post.category}</span>
        </div>

        {/* Article */}
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 32px' }}>

          {/* Cover image */}
          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title}
              style={{ width: '100%', height: '340px', objectFit: 'cover', borderRadius: '12px', marginBottom: '32px' }}
            />
          )}

          {/* Meta */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
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
            {post.published_at && (
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111', lineHeight: '1.3', letterSpacing: '-0.5px', margin: '0 0 16px' }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{ fontSize: '18px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 32px', fontStyle: 'italic', borderLeft: '3px solid #2563eb', paddingLeft: '16px' }}>
              {post.excerpt}
            </p>
          )}

          <div style={{ height: '1px', backgroundColor: '#e5e7eb', marginBottom: '32px' }} />

          {/* Content */}
          {post.content ? (
            <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n\n/g, '</p><p style="margin:0 0 20px">').replace(/\n/g, '<br/>') }}
            />
          ) : (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>✍️</p>
              <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Full article coming soon.</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => router.push('/blog')} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              ← Back to Blog
            </button>
            <button onClick={() => {
              if (navigator.share) {
                navigator.share({ title: post.title, text: post.excerpt, url: window.location.href })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
              }
            }} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
              Share →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}