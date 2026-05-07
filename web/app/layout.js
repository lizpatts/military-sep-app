
export const metadata = {
  title: "MilSep — Military Separation Guide",
  description: "A free personalized transition assistant for US military members. Separation checklist, SkillBridge map, financial calculators, certifications, and document vault.",
  manifest: "/manifest.json",
  metadataBase: new URL('https://military-sep-app.vercel.app'),
  openGraph: {
    title: "MilSep — Military Separation Guide",
    description: "A free personalized transition assistant for US military members. Checklist, SkillBridge map, TSP & VA calculators, and more.",
    url: "https://military-sep-app.vercel.app",
    siteName: "MilSep",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MilSep — Military Separation Guide",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MilSep — Military Separation Guide",
    description: "A free personalized transition assistant for US military members.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MilSep",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="MilSep" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MilSep" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f2044" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ minHeight: '100vh', margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}