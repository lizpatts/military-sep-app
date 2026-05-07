'use client'

import { useEffect, useState } from 'react'

export default function PageContent({ children }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ marginLeft: isMobile ? '0' : '220px', flex: 1, minWidth: 0 }}>
      {children}
    </div>
  )
}