import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Callback hit, code:', code ? 'present' : 'missing')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (e) {
              console.log('Cookie set error:', e)
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange result:', data?.session ? 'success' : 'failed')
    console.log('Exchange error:', error?.message)

    if (data?.session?.user) {
      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, branch')
        .eq('id', data.session.user.id)
        .single()

      // If profile exists and has branch set, go to dashboard
      if (profile?.branch) {
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
      }
    }
  }

  // If no code (cancelled) go back to login, otherwise onboarding for new users
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
  }
  return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
}