import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { userId, type } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          }
        }
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 })

const email = profile.email
    if (!email) return Response.json({ error: 'Email not found' }, { status: 404 })
    if (!email) return Response.json({ error: 'Email not found' }, { status: 404 })

    const firstName = profile.full_name?.split(' ')[0] || 'there'
    const sepDate = new Date(profile.separation_date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    const emails = {
      '365_days': {
        subject: `${firstName}, you have 1 year until separation — let's get started`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#2563eb;margin-bottom:1rem">🎖️ One year out</h1>
            <p>Hey ${firstName},</p>
            <p>You have <strong>365 days</strong> until your separation date of <strong>${sepDate}</strong>.</p>
            <p>Now is the time to start your separation checklist — the earlier you start, the smoother your transition will be.</p>
            <h3 style="color:#f59e0b">Top priorities right now:</h3>
            <ul>
              <li>Schedule your separation physical</li>
              <li>Meet with a VSO about your VA disability claim</li>
              <li>Review your TSP contributions</li>
              <li>Start researching SkillBridge opportunities</li>
            </ul>
            <a href="https://military-sep-app.vercel.app/checklist" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:1rem">
              Open My Checklist →
            </a>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              You're receiving this because you enabled email reminders. 
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      },
      '180_days': {
        subject: `${firstName}, 6 months out — time to accelerate`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#f59e0b;margin-bottom:1rem">⏰ 6 months out</h1>
            <p>Hey ${firstName},</p>
            <p>You have <strong>180 days</strong> until your separation date of <strong>${sepDate}</strong>.</p>
            <p>Things are getting real. Here's what needs to happen in the next 90 days:</p>
            <ul>
              <li>File your VA disability claim — don't wait until after separation</li>
              <li>Start your SkillBridge application if you haven't already</li>
              <li>Get your resume updated</li>
              <li>Request letters of recommendation from your chain of command</li>
              <li>Get your vaccines boosted for free while still on active duty</li>
            </ul>
            <a href="https://military-sep-app.vercel.app/checklist" style="display:inline-block;background:#f59e0b;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:1rem">
              Open My Checklist →
            </a>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      },
      '90_days': {
        subject: `${firstName}, 90 days — the final sprint`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#ef4444;margin-bottom:1rem">🚨 90 days out</h1>
            <p>Hey ${firstName},</p>
            <p>You have <strong>90 days</strong> until your separation date of <strong>${sepDate}</strong>.</p>
            <p>This is the final sprint. Critical items that must be done:</p>
            <ul>
              <li>Confirm your DD214 information is accurate</li>
              <li>Finalize housing arrangements</li>
              <li>Book your movers</li>
              <li>Plan your terminal leave dates with your command</li>
              <li>Make sure your emergency savings fund is in place</li>
            </ul>
            <a href="https://military-sep-app.vercel.app/checklist" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:1rem">
              Open My Checklist →
            </a>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      },
      '30_days': {
        subject: `${firstName}, 30 days — you're almost there`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#22c55e;margin-bottom:1rem">🎖️ 30 days out</h1>
            <p>Hey ${firstName},</p>
            <p>You have <strong>30 days</strong> until your separation date of <strong>${sepDate}</strong>.</p>
            <p>You're almost there. Last things to take care of:</p>
            <ul>
              <li>Pick up multiple certified copies of your DD214</li>
              <li>Update your address with USPS</li>
              <li>Confirm your VA claim has been submitted</li>
              <li>Remember — you are still on active duty during terminal leave. Stay sharp.</li>
            </ul>
            <a href="https://military-sep-app.vercel.app/checklist" style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:1rem">
              Open My Checklist →
            </a>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      },
      'separation_week': {
        subject: `${firstName}, your separation date is this week — congratulations`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#22c55e;margin-bottom:1rem">🎉 Separation week!</h1>
            <p>Hey ${firstName},</p>
            <p>Your separation date of <strong>${sepDate}</strong> is this week.</p>
            <p>It's going to be a shock at first — that's completely normal. The structure, the community, the sense of mission — those don't disappear overnight. Give yourself grace.</p>
            <p>Read this before you go: <a href="https://military-sep-app.vercel.app/blog" style="color:#2563eb">What to expect in your first week as a civilian</a></p>
            <p style="color:#f59e0b">You served. You sacrificed. Now it's your turn.</p>
            <p>Congratulations, ${firstName}. We've got you from here.</p>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      },
      '90_days_post': {
        subject: `${firstName}, how's civilian life going? (3 months post-separation)`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#2563eb;margin-bottom:1rem">👋 Checking in</h1>
            <p>Hey ${firstName},</p>
            <p>It's been about 3 months since your separation. How are you doing?</p>
            <p>The first 90 days are often the hardest. If you're struggling with the transition, that's normal and it does get better.</p>
            <p>We'd love to hear your story. Would you consider writing a short blog post about your transition experience? It could help thousands of service members who are where you were 3 months ago.</p>
            <a href="https://military-sep-app.vercel.app/blog" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:1rem">
              Share Your Story →
            </a>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      },
      '180_days_post': {
        subject: `${firstName}, 6 months out — how's the new chapter going?`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
            <h1 style="color:#2563eb;margin-bottom:1rem">6 months post-separation</h1>
            <p>Hey ${firstName},</p>
            <p>Six months into civilian life. You've made it through the hardest part.</p>
            <p>If you haven't already — get outside, find your community, and build your new routine. Struggles adjusting are completely normal at this stage.</p>
            <p>We'd love to hear how your transition has gone. Your story matters to the next service member coming behind you.</p>
            <a href="https://military-sep-app.vercel.app/blog" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:1rem">
              Share Your Story →
            </a>
            <p style="color:#445566;font-size:0.85rem;margin-top:2rem">
              <a href="https://military-sep-app.vercel.app/settings" style="color:#2563eb">Manage preferences</a>
            </p>
          </div>
        `
      }
    }

    const emailContent = emails[type]
    if (!emailContent) return Response.json({ error: 'Unknown email type' }, { status: 400 })

    const { data, error } = await resend.emails.send({
      from: 'Military Sep App <onboarding@resend.dev>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    })

    if (error) return Response.json({ error }, { status: 500 })
    return Response.json({ success: true, data })

  } catch (err) {
    console.error('Email error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}