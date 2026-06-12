'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function BoostPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  return (
    <div className="min-h-screen bg-[#111111] px-5 pt-14 pb-10">
      <Link
        href={eventId ? `/host/events/${eventId}` : '/host'}
        className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-8 active:scale-90 transition-transform"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="text-5xl mb-6">🚀</div>
      <h1 className="text-white font-black text-3xl mb-2">Event Boost</h1>
      <p className="text-gray-400 text-sm mb-8 leading-relaxed">
        Boost your event to the top of the feed and reach more people in NYC. Spend $20 and get $15 back in credits toward your next boost.
      </p>

      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] divide-y divide-[#2A2A2A] mb-8">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-white font-bold text-sm">24-hour boost</p>
            <p className="text-gray-500 text-xs">Top of feed for 24 hours</p>
          </div>
          <span className="text-[#A3FF12] font-black text-lg">$20</span>
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-white font-bold text-sm">48-hour boost</p>
            <p className="text-gray-500 text-xs">Top of feed for 48 hours</p>
          </div>
          <span className="text-[#A3FF12] font-black text-lg">$35</span>
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-white font-bold text-sm">Week boost</p>
            <p className="text-gray-500 text-xs">Top of feed for 7 days</p>
          </div>
          <span className="text-[#A3FF12] font-black text-lg">$60</span>
        </div>
      </div>

      <div className="bg-[#7B2EFF]/10 border border-[#7B2EFF]/30 rounded-2xl p-4 mb-8">
        <p className="text-[#7B2EFF] font-bold text-sm mb-1">💡 Boost credits</p>
        <p className="text-gray-400 text-xs leading-relaxed">Every $20 you spend on boosts earns you $15 in credits. Credits can be used for future boosts.</p>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 text-center">
        <p className="text-gray-400 text-sm">Boost payments coming soon.</p>
        <p className="text-gray-600 text-xs mt-1">Email <a href="mailto:hello@teacat.app" className="text-[#7B2EFF]">hello@teacat.app</a> to boost your event now.</p>
      </div>
    </div>
  )
}
