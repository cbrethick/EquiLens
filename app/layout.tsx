import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EquiLens — AI Bias & Fairness Auditor',
  description: 'Upload any decision dataset. Gemini AI detects hidden bias, explains who is harmed, and tells you exactly how to fix it.',
  keywords: ['AI bias', 'fairness', 'discrimination', 'Gemini', 'machine learning', 'ethics'],
  authors: [{ name: 'Rethick CB' }],
  openGraph: {
    title: 'EquiLens — AI Bias Detector',
    description: 'Detect hidden discrimination in AI decisions. Powered by Gemini 2.0',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
