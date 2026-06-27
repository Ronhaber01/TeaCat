'use client'

import { useRouter } from 'next/navigation'

export default function LegalBackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-gray-500 text-sm mb-6 active:text-gray-300 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 19l-7-7 7-7"/>
      </svg>
      Back
    </button>
  )
}
