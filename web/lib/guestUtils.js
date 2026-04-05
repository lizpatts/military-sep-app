// Checks if current page is in guest mode
export function getGuestParams() {
  if (typeof window === 'undefined') return { isGuest: false, guestParams: '' }
  const params = new URLSearchParams(window.location.search)
  const isGuest = params.get('guest') === 'true'
  return {
    isGuest,
    guestParams: params.toString(),
    branch: params.get('branch') || '',
    sepType: params.get('separation_type') || ''
  }
}

// Use this for any back-to-dashboard button
export function dashboardHref() {
  if (typeof window === 'undefined') return '/dashboard'
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') return `/dashboard?${params.toString()}`
  return '/dashboard'
}

// Use this to navigate to any page while preserving guest params
export function guestHref(path) {
  if (typeof window === 'undefined') return path
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') return `${path}?${params.toString()}`
  return path
}