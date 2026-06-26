'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function DiscoBall({ active }: { active: boolean }) {
  const c = active ? '#A3FF12' : '#666'
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M4.5 10 C7.5 8.5 16.5 8.5 19.5 10"/>
      <path d="M4.2 13 C7.5 11.5 16.5 11.5 19.8 13"/>
      <path d="M4.5 16 C7.5 17.5 16.5 17.5 19.5 16"/>
      <path d="M11.5 9 L12.5 10 L11.5 11 L10.5 10 Z"/>
      <path d="M8 12 L9 13 L8 14 L7 13 Z"/>
      <path d="M15 12 L16 13 L15 14 L14 13 Z"/>
      <path d="M11.5 14.5 L12.5 15.5 L11.5 16.5 L10.5 15.5 Z"/>
      <line x1="18.5" y1="6" x2="22" y2="2.5"/>
      <line x1="20" y1="9" x2="23" y2="7"/>
      <line x1="17" y1="5" x2="21" y2="4"/>
    </svg>
  )
}

const leftTabs = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? '#A3FF12' : 'none'} viewBox="0 0 24 24" stroke={active ? '#A3FF12' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={active ? '#A3FF12' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
]

const rightTabs = [
  {
    href: '/host/create',
    label: 'Create',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={active ? '#A3FF12' : '#666'} strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? '#A3FF12' : 'none'} viewBox="0 0 24 24" stroke={active ? '#A3FF12' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-[#111111] border-t border-[#2A2A2A] z-50"
      style={{ maxWidth: 430 }}
    >
      <div className="grid grid-cols-5 items-end px-1 pt-2 pb-6">
        {leftTabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              {tab.icon(active)}
              <span className={`text-[10px] font-semibold ${active ? 'text-[#A3FF12]' : 'text-[#666]'}`}>{tab.label}</span>
            </Link>
          )
        })}

        {/* Center floating Explore */}
        <div className="flex flex-col items-center -mt-7">
          <Link
            href="/explore"
            className="w-14 h-14 rounded-full bg-[#7B2EFF] flex items-center justify-center shadow-lg shadow-[#7B2EFF]/40 active:scale-90 transition-transform"
          >
            <DiscoBall active={pathname === '/explore'} />
          </Link>
          <span className={`text-[10px] font-semibold mt-1 ${pathname === '/explore' ? 'text-[#A3FF12]' : 'text-[#666]'}`}>
            Explore
          </span>
        </div>

        {rightTabs.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              {tab.icon(active)}
              <span className={`text-[10px] font-semibold ${active ? 'text-[#A3FF12]' : 'text-[#666]'}`}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
