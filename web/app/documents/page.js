'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

const CATEGORIES = ['All', 'Legal', 'Finance', 'Housing', 'Orders', 'General']
const MAX_DOCS = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function DocumentsPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [uploadMessage, setUploadMessage] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState({ label: '', category: 'General' })
  const [pendingFile, setPendingFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [guestBranch, setGuestBranch] = useState('')
  const [guestSepType, setGuestSepType] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search)
      const guestMode = params.get('guest') === 'true'
      setIsGuest(guestMode)
      setGuestBranch(params.get('branch') || '')
      setGuestSepType(params.get('separation_type') || '')

      if (guestMode) {
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        const recheck = new URLSearchParams(window.location.search)
        if (recheck.get('guest') === 'true') {
          setIsGuest(true)
          setGuestBranch(recheck.get('branch') || '')
          setGuestSepType(recheck.get('separation_type') || '')
          setLoading(false)
          return
        }
        router.push('/login')
        return
      }
      setUser(session.user)
      await loadDocuments(session.user.id)
      setLoading(false)
    }
    loadData()
  }, [])

  async function loadDocuments(userId) {
    const { data } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setUploadMessage({ type: 'error', text: 'File is too large. Maximum size is 10MB.' })
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
    if (!allowed.includes(file.type)) {
      setUploadMessage({ type: 'error', text: 'File type not supported. Please upload PDF, JPG, PNG, or HEIC.' })
      return
    }
    if (documents.length >= MAX_DOCS) {
      setUploadMessage({ type: 'error', text: `Free tier limit reached (${MAX_DOCS} documents). Premium coming soon.` })
      return
    }
    setPendingFile(file)
    setUploadForm({ label: file.name.replace(/\.[^/.]+$/, ''), category: 'General' })
    setShowUploadForm(true)
    setUploadMessage(null)
  }

  const handleUpload = async () => {
    if (!pendingFile || !user) return
    setUploading(true)
    setUploadMessage(null)
    const fileExt = pendingFile.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`
    const { error: storageError } = await supabase.storage.from('storage').upload(filePath, pendingFile)
    if (storageError) {
      setUploadMessage({ type: 'error', text: 'Upload failed: ' + storageError.message })
      setUploading(false)
      return
    }
    const { error: dbError } = await supabase.from('user_documents').insert({
      user_id: user.id, file_name: pendingFile.name, file_path: filePath,
      file_size: pendingFile.size, file_type: pendingFile.type,
      category: uploadForm.category, label: uploadForm.label || pendingFile.name
    })
    if (dbError) {
      setUploadMessage({ type: 'error', text: 'Failed to save document: ' + dbError.message })
      setUploading(false)
      return
    }
    await loadDocuments(user.id)
    setUploadMessage({ type: 'success', text: '✅ Document uploaded successfully!' })
    setShowUploadForm(false)
    setPendingFile(null)
    setUploadForm({ label: '', category: 'General' })
    fileInputRef.current.value = ''
    setUploading(false)
    setTimeout(() => setUploadMessage(null), 3000)
  }

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.label}"? This cannot be undone.`)) return
    await supabase.storage.from('storage').remove([doc.file_path])
    await supabase.from('user_documents').delete().eq('id', doc.id)
    setDocuments(prev => prev.filter(d => d.id !== doc.id))
    if (selectedDoc?.id === doc.id) setSelectedDoc(null)
  }

  const handlePreview = async (doc) => {
    setSelectedDoc(doc)
    const { data } = await supabase.storage.from('storage').createSignedUrl(doc.file_path, 60)
    if (data?.signedUrl) setPreviewUrl(data.signedUrl)
  }

  const handleDownload = async (doc) => {
    const { data } = await supabase.storage.from('storage').createSignedUrl(doc.file_path, 60)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = doc.file_name
      a.click()
    }
  }

  const handleShare = async (doc) => {
    const { data } = await supabase.storage.from('storage').createSignedUrl(doc.file_path, 60 * 60 * 24)
    if (!data?.signedUrl) return
    if (navigator.share) {
      navigator.share({ title: doc.label, text: `Here is my document: ${doc.label}`, url: data.signedUrl })
    } else {
      navigator.clipboard.writeText(data.signedUrl)
      alert('Share link copied to clipboard! Link expires in 24 hours.')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryColor = (cat) => {
    const colors = {
      'Legal':   { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
      'Finance': { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' },
      'Housing': { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
      'Orders':  { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
      'General': { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' },
    }
    return colors[cat] || colors['General']
  }

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return '📄'
    if (fileType?.startsWith('image/')) return '🖼️'
    return '📎'
  }

  const filteredDocs = filter === 'All' ? documents : documents.filter(d => d.category === filter)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'sans-serif' }}>
      Loading your vault...
    </div>
  )

  // Guest view — show sign up prompt instead of vault contents
  if (isGuest) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar isGuest={true} guestBranch={guestBranch} guestSepType={guestSepType} />
      <div style={{ marginLeft: '220px', flex: 1 }}>
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px' }}>
          <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>Documents Vault</h1>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Store and organize your important documents — PCS orders, leases, insurance cards, and more</p>
        </div>
        <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', maxWidth: '440px', width: '100%' }}>
            <p style={{ fontSize: '3rem', margin: '0 0 16px' }}>🗄️</p>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 10px', letterSpacing: '-0.3px' }}>Documents Vault</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px', lineHeight: '1.6' }}>
              Store your PCS orders, housing documents, legal paperwork, and more — all in one secure place.
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.6' }}>
              Creating an account is <strong style={{ color: '#111' }}>free</strong> and takes less than a minute with Google Sign-In.
            </p>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#15803d', fontSize: '13px' }}>Free account includes:</p>
              <p style={{ margin: '2px 0', color: '#6b7280', fontSize: '13px' }}>✓ Upload up to 10 documents</p>
              <p style={{ margin: '2px 0', color: '#6b7280', fontSize: '13px' }}>✓ Preview, download, and share files</p>
              <p style={{ margin: '2px 0', color: '#6b7280', fontSize: '13px' }}>✓ Organize by category</p>
              <p style={{ margin: '2px 0', color: '#6b7280', fontSize: '13px' }}>✓ Full checklist progress tracking</p>
              <p style={{ margin: '2px 0', color: '#6b7280', fontSize: '13px' }}>✓ Save SkillBridge favorites</p>
            </div>
            <button onClick={() => router.push('/login')}
              style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px' }}>
              Create Free Account →
            </button>
            <button onClick={() => router.push('/login')}
              style={{ width: '100%', backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px', flex: 1 }}>
        {/* Topbar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>Documents Vault</h1>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Store and access your important military documents</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: documents.length >= MAX_DOCS ? '#ef4444' : '#6b7280' }}>
              {documents.length}/{MAX_DOCS} documents
            </span>
            <button onClick={() => fileInputRef.current?.click()} disabled={documents.length >= MAX_DOCS}
              style={{ backgroundColor: documents.length >= MAX_DOCS ? '#e5e7eb' : '#2563eb', color: documents.length >= MAX_DOCS ? '#9ca3af' : 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: documents.length >= MAX_DOCS ? 'not-allowed' : 'pointer' }}>
              + Upload Document
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={handleFileSelect} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* DD-214 advisory notice */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', marginTop: '1px' }}>💡</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              <strong>For sensitive government records</strong> like your DD-214, we recommend using official portals —{' '}
              <a href="https://milconnect.dmdc.osd.mil" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>MilConnect</a>{' '}and{' '}
              <a href="https://www.archives.gov/veterans/military-service-records" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>National Archives</a>.
              This vault is designed for general documents like PCS orders, leases, and appointment records.
            </p>
          </div>

          {/* Security notice */}
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: '600', color: '#991b1b', fontSize: '13px' }}>Do not upload sensitive documents</p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '12px', lineHeight: '1.5' }}>
                Do not upload DD214s, medical records, or any documents containing Social Security Numbers, financial account numbers, or personal health information. This vault is intended for general military documents such as orders, housing, legal, and finance paperwork.
              </p>
            </div>
          </div>

          {/* Upload message */}
          {uploadMessage && (
            <div style={{ backgroundColor: uploadMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${uploadMessage.type === 'success' ? '#86efac' : '#fca5a5'}`, color: uploadMessage.type === 'success' ? '#15803d' : '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {uploadMessage.text}
            </div>
          )}

          {/* Upload form modal */}
          {showUploadForm && pendingFile && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: '0 0 6px' }}>Add Document Details</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>
                  {getFileIcon(pendingFile.type)} {pendingFile.name} · {formatFileSize(pendingFile.size)}
                </p>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>⚠️</span>
                  <p style={{ margin: 0, color: '#991b1b', fontSize: '12px', lineHeight: '1.5' }}>
                    Do not upload DD214s, medical records, or documents with SSNs or health information.
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Document Label</label>
                  <input value={uploadForm.label} onChange={e => setUploadForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. PCS Orders 2024, BAH Approval Letter"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {CATEGORIES.filter(c => c !== 'All').map(cat => {
                      const cc = getCategoryColor(cat)
                      const isSelected = uploadForm.category === cat
                      return (
                        <button key={cat} onClick={() => setUploadForm(prev => ({ ...prev, category: cat }))}
                          style={{ padding: '8px 4px', borderRadius: '8px', border: `2px solid ${isSelected ? cc.border : '#e5e7eb'}`, backgroundColor: isSelected ? cc.bg : '#fff', color: isSelected ? cc.text : '#6b7280', cursor: 'pointer', fontSize: '12px', fontWeight: isSelected ? '600' : '400' }}>
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setShowUploadForm(false); setPendingFile(null); fileInputRef.current.value = '' }}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                  <button onClick={handleUpload} disabled={uploading}
                    style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px', opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? 'Uploading...' : 'Save to Vault'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview modal */}
          {selectedDoc && previewUrl && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '15px', color: '#111' }}>{selectedDoc.label}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{selectedDoc.category} · {formatFileSize(selectedDoc.file_size)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleDownload(selectedDoc)} style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Download</button>
                    <button onClick={() => handleShare(selectedDoc)} style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Share</button>
                    <button onClick={() => { setSelectedDoc(null); setPreviewUrl(null) }} style={{ backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>Close</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedDoc.file_type === 'application/pdf' ? (
                    <iframe src={previewUrl} style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px' }} />
                  ) : (
                    <img src={previewUrl} alt={selectedDoc.label} style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px', objectFit: 'contain' }} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Free tier banner */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🔒</span>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#92400e', fontSize: '13px' }}>Free tier — {MAX_DOCS - documents.length} upload{MAX_DOCS - documents.length !== 1 ? 's' : ''} remaining</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Premium unlimited storage coming soon.</p>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>{documents.length}/{MAX_DOCS} used</span>
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filter === cat ? '#2563eb' : '#e5e7eb',
                backgroundColor: filter === cat ? '#2563eb' : '#fff',
                color: filter === cat ? '#fff' : '#6b7280',
                fontSize: '13px', cursor: 'pointer', fontWeight: filter === cat ? '600' : '400'
              }}>{cat}</button>
            ))}
          </div>

          {/* Empty state */}
          {filteredDocs.length === 0 ? (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '4rem', textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', margin: '0 0 12px' }}>🗄️</p>
              <p style={{ color: '#111', fontWeight: '600', fontSize: '15px', margin: '0 0 8px' }}>
                {filter === 'All' ? 'No documents yet' : `No ${filter} documents`}
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px' }}>
                {filter === 'All' ? 'Upload your orders, housing documents, legal paperwork, and more.' : `Upload a document and tag it as ${filter}.`}
              </p>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Upload First Document
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {filteredDocs.map(doc => {
                const cc = getCategoryColor(doc.category)
                return (
                  <div key={doc.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: cc.bg, border: `1px solid ${cc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#111', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.label}</p>
                        <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#9ca3af' }}>{formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        <span style={{ backgroundColor: cc.bg, color: cc.text, border: `1px solid ${cc.border}`, fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', display: 'inline-block' }}>
                          {doc.category}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handlePreview(doc)} style={{ flex: 1, backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>👁 Preview</button>
                      <button onClick={() => handleDownload(doc)} style={{ flex: 1, backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>↓ Download</button>
                      <button onClick={() => handleShare(doc)} style={{ flex: 1, backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>↗ Share</button>
                      <button onClick={() => handleDelete(doc)} style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '12px' }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
